import {
    Button,
    Icon,
    Modal,
    Row,
    Form,
    Input,
    DatePicker,
    Switch,
    Upload,
    Select,
  } from 'antd';
  import React from 'react';
  import moment from 'moment';
  import { connect } from 'react-redux';
  import * as config from '../config';

  import { getGroupDetail, getGroupTag } from '../services/apis';
  import { addGroup, editGroup, getGroupsLists } from '../reducers/actionCreater';
  
  const FormItem = Form.Item;
  const Option = Select.Option;
  
  class GroupEdit extends React.Component {
    constructor (props) {
      super(props);
      this.state = {
        visible: false,
        confirmLoading: false,
        groupDetail: {
          name: '',
          id: null,
          memberNum: 0,
          memberMaxNum: 100,
          avatar: '',
          onlyRobotPull: 0,
          qrcodeUrl: '',
          invalidDate: null,
          tagName: ''
        },
        groupTag: [],
        fileList: [],
        groupAvatar: [],
        tagNameOptions: []
      }
    }
    
    componentWillMount () {
      
    }

    getGroupTag = () => {
      getGroupTag().then(data => {
        if (data.data.status === 1) {
          let groupTag = this.state.groupTag;
          let tagNameOptions =this.state.tagNameOptions;
          groupTag = data.data.data;
          tagNameOptions = groupTag.map(tag => {
            return <Option key={tag.name}>{tag.name}</Option>
          });
          this.setState({
            groupTag,
            tagNameOptions
          })
        }
      })
    }

    getGroupDetail = () => {
      let groupId = this.props.groupId;
      if (groupId > 0) {
        getGroupDetail(groupId).then(data => {
          if (data.data.status === 1) {
            let groupDetail = data.data.data;
            groupDetail.invalidDate = new moment(groupDetail.invalidDate);
            this.setState({
              groupDetail,
              groupAvatar: groupDetail.avatar ? [{
                  uid: -1,
                  name: '群头像.png',
                  state: 'done',
                  url: groupDetail.avatar
                }] : [],
                fileList: groupDetail.qrcodeUrl ? [{
                  uid: -1,
                  name: '群二维码.png',
                  status: 'done',
                  url: groupDetail.qrcodeUrl
                }] : [],
            })
          }
        })
      }
    }

    showModal = id => {
      const groupId = id;
      this.setState({
        visible: true,
        confirmLoading: false,
        groupDetail: {
          name: '',
          id: null,
          memberNum: 0,
          memberMaxNum: 100,
          avatar: '',
          onlyRobotPull: 0,
          qrcodeUrl: '',
          invalidDate: null,
          tagName: ''
        },
        groupTag: [],
        fileList: [],
        groupAvatar: [],
        tagNameOptions: []
      })
      this.getGroupTag()
      if (groupId > 0) {
        this.getGroupDetail()
      }
    }

    onGroupNameChange = (e) => {
      let groupDetail = this.state.groupDetail;
      groupDetail.name = e.target.value
      this.setState({ groupDetail });
    }

    handleGpAvatarChange = ({ fileList }) => {
      if (fileList.length === 0) {
        this.setState({groupAvatar: fileList});
      } else {
        this.setState({
          groupAvatar: [{
            uid: fileList[0].uid,
            name: fileList[0].name,
            status: fileList[0].status,
            url: (fileList[0].response && fileList[0].response.data.url) || ''
          }]
        });
      }
    }

    onUploadChange = (e) => {
      let groupDetail = this.state.groupDetail;
      groupDetail.fileField = e.target
      this.setState({ groupDetail });
    };

    handleQrcodeChange = ({ fileList }) => {
      if (fileList.length === 0) {
        this.setState({fileList});
      } else {
        this.setState({
          fileList: [{
            uid: fileList[0].uid,
            name: fileList[0].name,
            status: fileList[0].status,
            url: (fileList[0].response && fileList[0].response.data.url) || ''
          }]
        });
      }
    };

    handleOnlyRobotPullChange = (checked) => {
      let groupDetail = this.state.groupDetail;
      if (checked) {
        groupDetail.onlyRobotPull = 1;
      } else {
        groupDetail.onlyRobotPull = 0;
      }
      this.setState({ groupDetail });
    }

    onTimeChange = (value) => {
      let groupDetail = this.state.groupDetail;
      groupDetail.invalidDate = new moment(value);
      this.setState({ groupDetail });
    };

    onLimitChange = (e) => {
      let groupDetail = this.state.groupDetail;
      groupDetail.memberMaxNum = e.target.value | 0;
      this.setState({ groupDetail });
    };

    onTagNameAdd = value => {
      let tagNameOptions = [];
      let tags = this.state.groupTag;
      let groupDetail = this.state.groupDetail;
      if (!value) {
        tagNameOptions = tags.map(tag => {
          return <Option key={tag.name}>{tag.name}</Option>
        });
      } else {
        tags = tags.filter(tag => {
          return (tag.name).indexOf(value) >= 0;
        })
        tagNameOptions = tags.map(tag => {
          return <Option key={tag.name}>{tag.name}</Option>
        });
      }
      groupDetail.tagName = value;
  
      this.setState({ tagNameOptions, groupDetail })
    }

    handleOk = () => {
      this.setState({
        confirmLoading: true
      });
      let pagination = {
        current: (this.props.current - 1),
        pageSize: this.props.pageSize
      };
      let params = null;
      const groupDetail = this.state.groupDetail;
      if (this.props.type === 'edit') {
        params = {
          name: groupDetail.name,
          id: this.props.groupId,
          memberNum: groupDetail.memberNum,
          memberMaxNum: groupDetail.memberMaxNum,
          avatar: groupDetail.avatar,
          onlyRobotPull: groupDetail.onlyRobotPull,
          qrcodeUrl: groupDetail.qrcodeUrl,
          invalidDate: groupDetail.invalidDate,
          tagName: groupDetail.tagName
        };
        if (this.state.fileList[0] && this.state.fileList[0].url) {
          params.qrcodeUrl = this.state.fileList[0].url;
        } else {
          params.qrcodeUrl = null;
        }
        if (this.state.groupAvatar[0] && this.state.groupAvatar[0].url) {
          params.avatar = this.state.groupAvatar[0].url;
        } else {
          params.avatar = null;
        }
        this.props.editGroup({params, pagination});
      } else if (this.props.type === 'add') {
        params = {
          name: this.state.groupDetail.name,
          memberNum: -1,
          avatar: (this.state.groupAvatar[0] && this.state.groupAvatar[0].url) || null,
          memberMaxNum: this.state.groupDetail.memberMaxNum,
          onlyRobotPull: this.state.groupDetail.onlyRobotPull,
          qrcodeUrl: (this.state.fileList[0] && this.state.fileList[0].url) || null,
          invalidDate: this.state.groupDetail.invalidDate,
          tagName: this.state.groupDetail.tagName || ''
        };
        if (!params.tagName) delete params.tagName;
        this.props.addGroup({params, pagination});
      }
      this.setState({
        visible: false,
        confirmLoading: false
      });
    };

    handleCancel = () => {
      this.setState({ 
        visible: false,
        groupDetail: {
          name: '',
          id: null,
          memberNum: 0,
          memberMaxNum: 100,
          avatar: '',
          onlyRobotPull: 0,
          qrcodeUrl: '',
          invalidDate: 0,
          tagName: ''
        },
        groupTag: [],
        fileList: [],
        groupAvatar: [],
        tagNameOptions: []
      })
    }
  
    render () {
      let { type, groupId } = this.props;
      return (
        <div style={{display: 'inline-block', margin: '0 3px 0 3px'}}>
        {
            type === 'add' ? (
              <Button 
                type="primary" 
                size="small" 
                title='添加群'
                onClick={this.showModal.bind(this, groupId)}>
                <Icon type="plus" />
                添加
              </Button>
            ): (
              <Button 
                style={{marginLeft: '10px'}} 
                size='small'
                title='编辑群信息' 
                onClick={this.showModal.bind(this, groupId)}>
                  编辑群
              </Button>
            )
        }
        <Modal title="Title"
          visible={this.state.visible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          footer={[
            <Button size='small' key='back' onClick={this.handleCancel}>取消</Button>,
            <Button size='small' key='submit' type='primary' loading={this.state.confirmLoading} onClick={this.handleOk}>
              确定
            </Button>
          ]}>
          <Form layout='horizontal'>
            <Row>
              <FormItem
                label='群名称'
                labelCol={{span: 6}}
                wrapperCol={{span: 14}}>
                <Input
                  placeholder='请填写群名称'
                  value={this.state.groupDetail.name}
                  disabled={type === 'edit'}
                  onChange={this.onGroupNameChange}></Input>
              </FormItem>
            </Row>
            <Row>
              <FormItem label='群头像'
                labelCol={{span: 6}}
                wrapperCol={{span: 14}}>
                <Upload
                  action={`${config.uploadUrl}/product/image/save`}
                  listType='picture-card'
                  name='imageFile'
                  fileList={this.state.groupAvatar}
                  onChange={this.handleGpAvatarChange}>
                  {this.state.groupAvatar.length > 0 ? null :
                    (<div>
                      <Icon type='plus'></Icon>
                      <div className='ant-upload-text'>Upload</div>
                    </div>)}
                </Upload>
                <Input type='file' onChange={this.onUploadChange} name='file' id='upload' style={{display: 'none'}}></Input>
              </FormItem>
            </Row>
            <Row>
              <FormItem label='群二维码'
                labelCol={{span: 6}}
                wrapperCol={{span: 14}}>
                <Upload
                  action={`${config.uploadUrl}/product/image/save`}
                  listType='picture-card'
                  name='imageFile'
                  fileList={this.state.fileList}
                  onChange={this.handleQrcodeChange}>
                  {this.state.fileList.length > 0 ? null :
                    (<div>
                      <Icon type='plus'></Icon>
                      <div className='ant-upload-text'>Upload</div>
                    </div>)}
                </Upload>
                <Input type='file' onChange={this.onUploadChange} name='file' id='upload' style={{display: 'none'}}></Input>
              </FormItem>
            </Row>
            <Row>
              <FormItem label='仅派发机器人二维码'
                labelCol={{span: 6}}
                wrapperCol={{span: 14}}>
                <Switch checked={this.state.groupDetail.onlyRobotPull === 1} onChange={this.handleOnlyRobotPullChange} />
              </FormItem>
            </Row>
            <Row>
              <FormItem label='失效时间'
                labelCol={{span: 6}}
                wrapperCol={{span: 14}}>
                <DatePicker 
                  onChange={this.onTimeChange}
                  value={!this.state.groupDetail.invalidDate ? null : this.state.groupDetail.invalidDate}
                  showTime
                  format="YYYY-MM-DD HH:mm:ss"
                  style={{width: '100%'}}/>
              </FormItem>
            </Row>
            <Row>
              <FormItem label='人数上限'
                labelCol={{span: 6}}
                wrapperCol={{span: 14}}>
                <Input defaultValue={this.state.groupDetail.memberMaxNum} type='number' onChange={this.onLimitChange} value={this.state.groupDetail.memberMaxNum}/>
              </FormItem>
            </Row>
            <Row>
              <Form.Item
                label="标签"
                labelCol={{span: 6}}
                wrapperCol={{span: 14}}>
                <Select
                  mode="combobox"
                  filterOption={false}
                  onChange={this.onTagNameAdd}
                  value={this.state.groupDetail.tagName}
                  >
                    { this.state.tagNameOptions }
                  </Select>
              </Form.Item>
            </Row>
          </Form>
        </Modal>
      </div>
      )
    }
  }

const mapStateToProps = (state, ownProps) => {
  return state
}
  
const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    getGroupsLists: (lists) => {
      dispatch(getGroupsLists(lists))
    },
    addGroup: (lists) => {
      dispatch(addGroup(lists))
    },
    editGroup: (lists) => {
      dispatch(editGroup(lists))
    }
  }
}
  
export default connect(mapStateToProps, mapDispatchToProps)(GroupEdit);