import React from 'react';
import { 
  Row, 
  Col, 
  Table, 
  Form, 
  Icon, 
  Input, 
  Button, 
  message, 
  Select, 
  DatePicker, 
  Switch,
  Modal,
  Upload,
  Tag
} from 'antd';
import { connect } from 'react-redux';
import { 
  getActivitiesLists, 
  pageChange, 
  getActivityTag, 
  getGroupTag, 
  editGroup,
  getGroupDetail
} from '../reducers/actionCreater';
import * as config from '../config';
import copyToClipboard from 'copy-to-clipboard';

import ShowCode from './ShowCode';
import { Link } from 'react-router-dom';
const {RangePicker} = DatePicker
import moment from 'moment';

class Activities extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      data: [],
      columns: [
        {
            title: '#',
            dataIndex: 'id',
            key: 'id',
            width: '50px',
            render: (v, r, i) => {
              return i+1;
            }
        }, {
            title: '活动名称',
            dataIndex: 'activityName',
            key: 'activityName',
            width: '150px'
        }, {
            title: '活动简介',
            dataIndex: 'activityDesc',
            key: 'activityDesc'
        }, {
            title: '仅剩名额',
            dataIndex: 'lastPullNum',
            key: 'lastPullNum',
            width: '50px',
        }, {
            title: '参加活动的群',
            dataIndex: 'groupInfoList',
            key: 'groupInfoList',
            width: '150px',
            render:(value, record) => {
              let lists = [];
              value.forEach(v => {
                  lists.push(<Tag style={{margin: '0px 3px 3px 0px'}} color="orange" key={v.id} onClick={this.onShowGroup.bind(this, v.id)}>{v.name}</Tag>)
              });
               if(value.length > 0) {
                   return lists
               }
                return (
                    <p style={{textAlign:'center'}}>--</p>
                )
            }
        }, {
            title: '创建时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: '165px',
            render: (value) => {
                let date = new Date(value);
                return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            }
        }, {
          title: '更新时间',
          dataIndex: 'updatedAt',
          key: 'updatedAt',
          render: (v, r, i) => {
            if (!!v) {
              let date = new Date(v);
              return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            } else {
              return '--'
            }
          }
        }, {
          title: '标签',
          dataIndex: 'tagName',
          key: 'tagName',
          width: '100px',
          render: (v) => {
            return !!v ? v : '--';
          }
        }, {
          title: '加群顺序',
          dataIndex: 'addGroupType',
          key: 'addGroupType',
          width: '100px',
          render: (v) => {
            return v === 'SEQUENCE' ? '顺序加群' : '随机加群';
          }
        }, {
          title: '群满条件',
          dataIndex: 'changeGroupType',
          key: 'changeGroupType',
          width: '100px',
          render: (v) => {
            return v === 'MEMBERNUM' ? '入群人数' : '扫描人数';
          }
        }, {
          title: '群满人数',
          dataIndex: 'maxScanNum',
          key: 'maxScanNum',
          width: '100px'
        }, {
          title: '操作',
          dataIndex: 'id',
          key: 'edit_id',
          width: '140px',
          render:(value) => {
              return (
                  <p>
                      <span style={{paddingRight:'10px'}}><Link to={'/activities/edit/ac/' + value}>编辑</Link></span>
                      <span style={{paddingRight:'10px'}}><Button id="btn" size='small' onClick={this.onCopyToClipboard.bind(this, value)}>复制</Button></span>
                      <ShowCode type='activity' activityId={value}/>
                  </p>
              );
          }
        }
      ],
      dataSource: [],
      pagination: {
        current: 1,
        pageSize: 20
      },
      loading: false,
      pageSize: 20,
      activityTag: [],
      tagName: 'ALL',
      activityName: null,
      sCreatedAt: [],
      sUpdatedAt: [],
      groupFileList: [],
      groupAvatar: [],
      groupTag: [],
      tagNameOptions: [],
      groupEdit: false,
      groupDetail: {
        robotList: []
      },
      groupLoading: false
    }
  }

  componentWillMount() {
    this.props.pageChange('activities')
    this.setState({loading: true})
    this.props.getActivitiesLists({page: 0, size: 20})
    this.props.getActivityTag()
    this.props.getGroupTag()
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      pagination: {
        current: nextProps.activities.page + 1,
        pageSize: this.state.pageSize,
        total: nextProps.activities.total
      },
      dataSource: nextProps.activities.data,
      loading: false,
      activityTag: nextProps.activityTag,
      groupDetail: nextProps.groupDetail,
      groupAvatar: nextProps.groupDetail.avatar ? [{
        uid: -1,
        name: '群头像.png',
        state: 'done',
        url: nextProps.groupDetail.avatar
      }] : [],
      groupFileList: nextProps.groupDetail.qrcodeUrl ? [{
        uid: -1,
        name: '群二维码.png',
        status: 'done',
        url: nextProps.groupDetail.qrcodeUrl
      }] : [],
      groupTag: nextProps.groupTag
    })
  }

  onCopyToClipboard = activityId => {
    //  h5接口
    let txt =`${config.formalUrl}:${config.formalPort}/h5/${activityId}`;
    copyToClipboard(txt);
    message.success('复制成功');
  }

  handleTableChange = (pagination) => {
    const pager = this.state.pagination;
    pager.current = pagination.current;
    this.setState({
       pagination: pager,
       loading: true
    });
    let params = {
       page: pagination.current-1,
       size: this.state.pageSize
    };

    if (this.state.tagName !== 'ALL') {
      params.tagName = this.state.tagName;
    }

    if (!!this.state.activityName) {
      params.activityName = this.state.activityName;
    }

    if (this.state.sCreatedAt.length > 0) {
      params.createdAtBegin = this.state.sCreatedAt[0];
      params.createdAtEnd = this.state.sCreatedAt[1];
    }

    if (this.state.sUpdatedAt.length > 0) {
      params.updatedAtBegin = this.state.sUpdatedAt[0];
      params.updatedAtEnd = this.state.sUpdatedAt[1];
    }

    this.props.getActivitiesLists(params)
  };

  onActivityTagChange = (tagName) => {
    this.setState({ tagName })
    let params = {
      page: 0,
      size: this.state.pageSize
    }

    if (tagName !== 'ALL') {
      params.tagName = tagName;
    }

    if (!!this.state.activityName) {
      params.activityName = this.state.activityName;
    }

    if (this.state.sCreatedAt.length > 0) {
      params.createdAtBegin = this.state.sCreatedAt[0];
      params.createdAtEnd = this.state.sCreatedAt[1];
    }

    if (this.state.sUpdatedAt.length > 0) {
      params.updatedAtBegin = this.state.sUpdatedAt[0];
      params.updatedAtEnd = this.state.sUpdatedAt[1];
    }

    this.props.getActivitiesLists(params);
  }

  onActivityNameChange = (e) => {
    this.setState({ activityName: e.target.value })
  }

  onActivityNameSearch = () => {
    let params = {
      page: 0,
      size: this.state.pageSize
    }

    if (this.state.tagName !== 'ALL') {
      params.tagName = this.state.tagName;
    }

    if (!!this.state.activityName) {
      params.activityName = this.state.activityName;
    }

    if (this.state.sCreatedAt.length > 0) {
      params.createdAtBegin = this.state.sCreatedAt[0];
      params.createdAtEnd = this.state.sCreatedAt[1];
    }

    if (this.state.sUpdatedAt.length > 0) {
      params.updatedAtBegin = this.state.sUpdatedAt[0];
      params.updatedAtEnd = this.state.sUpdatedAt[1];
    }

    this.props.getActivitiesLists(params);
  }

  onCreateTimeChange = (timeString, time) => {
    if (!time[0]) {
      time = [];
      this.setState({ sCreatedAt: [] })
    } else {
      this.setState({ sCreatedAt: time })
    }
    this.setState({ sCreatedAt: time })
    let params = {
      page: 0,
      size: this.state.pageSize
    }

    if (this.state.tagName !== 'ALL') {
      params.tagName = this.state.tagName;
    }

    if (!!this.state.activityName) {
      params.activityName = this.state.activityName;
    }

    if (time.length > 0) {
      params.createdAtBegin = time[0];
      params.createdAtEnd = time[1];
    }

    if (this.state.sUpdatedAt.length > 0) {
      params.updatedAtBegin = this.state.sUpdatedAt[0];
      params.updatedAtEnd = this.state.sUpdatedAt[1];
    }

    this.props.getActivitiesLists(params);
  }
  
  onUpdateTimeChange = (timeString, time) => {
    if (!time[0]) {
      time = [];
      this.setState({ sUpdatedAt: [] })
    } else {
      this.setState({ sUpdatedAt: time })
    }
    let params = {
      page: 0,
      size: this.state.pageSize
    }

    if (this.state.tagName !== 'ALL') {
      params.tagName = this.state.tagName;
    }

    if (!!this.state.activityName) {
      params.activityName = this.state.activityName;
    }

    if (this.state.sCreatedAt.length > 0) {
      params.createdAtBegin = this.state.sCreatedAt[0];
      params.createdAtEnd = this.state.sCreatedAt[1];
    }

    if (time.length > 0) {
      params.updatedAtBegin = time[0];
      params.updatedAtEnd = time[1];
    }

    this.props.getActivitiesLists(params);
  }

  onClearParams = () => {
    this.setState({
      tagName: 'ALL',
      activityName: null,
      sCreatedAt: [],
      sUpdatedAt: []
    })

    let params = {
      page: 0,
      size: this.state.pageSize
    }

    this.props.getActivitiesLists(params);
  }

  onShowGroup = (id) => {
    const groupId = +id;
    this.setState({ groupVisible: true })
    this.props.getGroupDetail(groupId)
  }

  onGroupNameChange = (e) => {
    this.setState({
      groupDetail: Object.assign(this.state.groupDetail, {name: e.target.value})
    });
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
    this.setState({
      groupDetail: Object.assign(this.state.groupDetail, {fileField: e.target})
    });
  };

  handleGroupQrcodeChange = ({ fileList }) => {
    if (fileList.length === 0) {
      this.setState({groupFileList: fileList});
    } else {
      this.setState({
        groupFileList: [{
          uid: fileList[0].uid,
          name: fileList[0].name,
          status: fileList[0].status,
          url: (fileList[0].response && fileList[0].response.data.url) || ''
        }]
      });
    }
  };

  handleOnlyRobotPullChange = (checked) => {
    if (checked) {
      this.setState({
        groupDetail: Object.assign(this.state.groupDetail, {onlyRobotPull: 1})
      });
    } else {
      this.setState({
        groupDetail: Object.assign(this.state.groupDetail, {onlyRobotPull: 0})
      });
    }
  }

  onTimeChange = (value) => {
    this.setState({
      groupDetail: Object.assign(this.state.groupDetail, {invalidDate: value})
    });
  };

  onLimitChange = (e) => {
    this.setState({
      groupDetail: Object.assign(this.state.groupDetail, {memberMaxNum: e.target.value | 0})
    });
  };

  onTagNameAdd = value => {
    let tagNameOptions = [];
    let tags = this.state.groupTag;
    let groupDetail = this.state.groupDetail;
    if (!value) {
      tagNameOptions = tags.map(tag => {
        return <Select.Option key={tag.name}>{tag.name}</Select.Option>
      });
    } else {
      tags = tags.filter(tag => {
        return (tag.name).indexOf(value) >= 0;
      })
      tagNameOptions = tags.map(tag => {
        return <Select.Option key={tag.name}>{tag.name}</Select.Option>
      });
    }
    groupDetail.tagName = value;
    this.setState({ tagNameOptions, groupDetail })
  }

  onUpdateGroupOk = () => {
    this.setState({
      groupLoading: true
    });
    let params = null;
    params = {
      ...this.state.groupDetail
    };
    if (this.state.groupFileList[0] && this.state.groupFileList[0].url) {
      params.qrcodeUrl = this.state.groupFileList[0].url;
    } else {
      params.qrcodeUrl = null;
    }
    if (this.state.groupAvatar[0] && this.state.groupAvatar[0].url) {
      params.avatar = this.state.groupAvatar[0].url;
    } else {
      params.avatar = null;
    }
    this.props.editGroup({params, pagination: {current: -1, pageSize: -1}});
    this.setState({
      groupLoading: false,
      groupVisible: false,
      groupEdit: false,
      groupDetail: {
        robotList: []
      }
    });
  };

  onGroupEdit = () => {
    this.setState({ groupEdit: true })
  }

  hideGroupModal = () => {
    this.setState({
      groupDetail: {
        robotList: []
      }, 
      groupVisible: false,
      groupEdit: false,
      groupLoading: false
    })
  }

  render () {
    return (
      <div>
        <Row style={{marginBottom: '20px'}}>
          <Col span={20}>
            <Form layout="inline">
              <Form.Item label="标签">
                <Select
                  size="small"
                  defaultValue="ALL"
                  style={{ width: 120 }}
                  onChange={this.onActivityTagChange}
                  value={this.state.tagName}>
                    <Select.Option value="ALL">全部</Select.Option>
                    { 
                      this.state.activityTag.map(item => {
                        return <Select.Option key={'key_'+item.id} value={item.name}>{item.name}</Select.Option>
                      })
                    }
                </Select>
              </Form.Item>
              <Form.Item label="名称">
                <Input.Search
                  size="small"
                  style={{ width: 120}}
                  onSearch={this.onActivityNameSearch}
                  onChange={this.onActivityNameChange}
                  value={this.state.activityName}
                  placeholder="活动名称"/>
              </Form.Item>
            
              <Form.Item label="创建时间">
                <RangePicker
                  size="small"
                  format="YYYY-MM-DD"
                  placeholder={['开始时间', '结束时间']}
                  onChange={this.onCreateTimeChange}
                  value={this.state.sCreatedAt.length > 0 ? 
                          [moment(this.state.sCreatedAt[0]), moment(this.state.sCreatedAt[1])] : 
                          []
                        }/>
              </Form.Item>

              <Form.Item label="更新时间">
                <RangePicker
                  size="small"
                  format="YYYY-MM-DD"
                  placeholder={['开始时间', '结束时间']}
                  onChange={this.onUpdateTimeChange}
                  value={this.state.sUpdatedAt.length > 0 ? 
                          [moment(this.state.sUpdatedAt[0]), moment(this.state.sUpdatedAt[1])] : 
                          []
                        }/>
              </Form.Item>

              <Form.Item>
                <Button type="default" size="small" onClick={this.onClearParams} >重置</Button>
              </Form.Item>
            </Form>
          </Col>

          <Col span={4} style={{textAlign: 'right'}}>
            <Button type="primary" size="small">
              <Link to={'/activities/ac/add'}>
                <Icon type="plus" />添加
              </Link>
            </Button>
          </Col>
        </Row>

        <Row>
          <Col span={24}>
            <Table
                pagination={this.state.pagination}
                dataSource={this.state.dataSource}
                 columns={this.state.columns}
                onChange={this.handleTableChange}
                loading={this.state.loading}
                rowKey="id"
                bordered/>
          </Col>
        </Row>

        <Modal
          title="查看群信息"
          onCancel={this.hideGroupModal}
          footer={[
            <Button key='back' onClick={this.hideGroupModal}>取消</Button>,
            <Button 
              key='submit' 
              type='primary' 
              loading={this.state.groupLoading} 
              onClick={this.state.groupEdit ? this.onUpdateGroupOk : this.onGroupEdit}>
              {this.state.groupEdit ? '保存' : '编辑'}
            </Button>
          ]}
          visible={this.state.groupVisible}>
          <Form layout='horizontal' id='groupForm'>
            <Row>
              <Form.Item
                label='群名称'
                labelCol={{span: 6}}
                wrapperCol={{span: 14}}>
                <Input
                  disabled={true}
                  placeholder='请填写群名称'
                  value={this.state.groupDetail.name}
                  onChange={this.onGroupNameChange}></Input>
              </Form.Item>
            </Row>
            <Row>
              {
                this.state.groupEdit ? (
                  <Form.Item label='群头像'
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
                  </Form.Item>
                ) : (
                  <Form.Item label='群头像'
                    labelCol={{span: 6}}
                    wrapperCol={{span: 14}}>
                    <img style={{width: 90, height: 90}} src={this.state.groupDetail.avatar} />
                  </Form.Item>
                )
              }
            </Row>
            <Row>
              {
                this.state.groupEdit ? (
                  <Form.Item label='群二维码'
                    labelCol={{span: 6}}
                    wrapperCol={{span: 14}}>
                    <Upload
                      action={`${config.uploadUrl}/product/image/save`}
                      listType='picture-card'
                      name='imageFile'
                      fileList={this.state.groupFileList}
                      onChange={this.handleGroupQrcodeChange}>
                      {this.state.groupFileList.length > 0 ? null :
                        (<div>
                          <Icon type='plus'></Icon>
                          <div className='ant-upload-text'>Upload</div>
                        </div>)}
                    </Upload>
                    <Input type='file' onChange={this.onUploadChange} name='file' id='upload' style={{display: 'none'}}></Input>
                  </Form.Item>
                ) :(
                  <Form.Item label='群二维码'
                    labelCol={{span: 6}}
                    wrapperCol={{span: 14}}>
                    <img style={{width: 90, height: 90}} src={this.state.groupDetail.qrcodeUrl} />
                  </Form.Item>
                )
              }
              
            </Row>
            <Row>
              <Form.Item label='仅派发机器人二维码'
                labelCol={{span: 6}}
                wrapperCol={{span: 14}}>
                <Switch 
                  checked={this.state.groupDetail.onlyRobotPull === 1} 
                  onChange={this.handleOnlyRobotPullChange} 
                  disabled={!this.state.groupEdit}/>
              </Form.Item>
            </Row>
            <Row>
              <Form.Item label='失效时间'
                labelCol={{span: 6}}
                wrapperCol={{span: 14}}>
                <DatePicker 
                  showTime
                  format="YYYY-MM-DD HH:mm:ss"
                  style={{width: '100%'}}
                  onChange={this.onTimeChange} 
                  value={moment(this.state.groupDetail.invalidDate)}
                  disabled={!this.state.groupEdit}/>
              </Form.Item>
            </Row>
            <Row>
              <Form.Item label='人数上限'
                labelCol={{span: 6}}
                wrapperCol={{span: 14}}>
                <Input 
                  type='number' 
                  onChange={this.onLimitChange} 
                  value={this.state.groupDetail.memberMaxNum}
                  disabled={!this.state.groupEdit}/>
              </Form.Item>
            </Row>
            <Row>
              <Form.Item
                label="标签"
                labelCol={{span: 6}}
                wrapperCol={{span: 14}}>
                <Select
                  disabled={!this.state.groupEdit}
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
    );
  }
  
};

const mapStateToProps = (state, ownProps) => {
  return state
}

const mapDispatchToProps = (dispatch, ownProps) => {
   return {
    getActivitiesLists: (lists) => {
      dispatch(getActivitiesLists(lists))
    },
    pageChange: (lists) => {
      dispatch(pageChange(lists))
    },
    getActivityTag: (lists) => {
      dispatch(getActivityTag(lists))
    },
    editGroup: (lists) => {
      dispatch(editGroup(lists))
    },
    getGroupTag: (lists) => {
      dispatch(getGroupTag(lists))
    },
    getGroupDetail: (lists) => {
      dispatch(getGroupDetail(lists))
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Activities);