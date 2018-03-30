import React from 'react';
import {
  Row,
  Col,
  Table,
  Form,
  Icon,
  Input,
  Button,
  DatePicker,
  Modal,
  Avatar,
  Tag,
  Upload,
  message,
  Popover,
  Switch,
  Select
} from 'antd';
import { connect } from 'react-redux';
import {
  getRobotsList,
  pageChange,
  getGroupDetail,
  socketConnect,
  saveRobot,
  editGroup,
  getGroupTag
} from '../reducers/actionCreater';
const { RangePicker } = DatePicker
import moment from 'moment';

import RobotEdit from './RobotEdit';

import * as config from '../config.js';

class Robots extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      data: [],
      columns: [
        {
          title: '#',
          dataIndex: 'id',
          key: 'index',
          render: (v, r, i) => {
            return i+1;
          }
        }, {
          title: '微信ID',
          dataIndex: 'wxId',
          key: 'wxId',
          render: (v, r, i) => {
            return !!v ? v : '--';
          }
        }, {
          title: '微信账号',
          dataIndex: 'wxAccount',
          key: 'wxAccount',
          render: (v, r, i) => {
            return !!v ? v : '--';
          }
        }, {
          title: '状态',
          dataIndex: 'status',
          key: 'status',
          render: (v, r, i) => {
            return v === 'offline' ? '离线' : '在线';
          }
        }, {
          title: '微信昵称',
          dataIndex: 'name',
          key: 'name',
          render: (v, r, i) => {
            return !!v ? v : '--';
          }
        }, {
          title: '头像',
          dataIndex: 'avatar',
          key: 'avatar',
          render: (v, r, i) => {
            return !!v ? <Avatar shape="square" size="large" src={v} /> : <Avatar shape="square" size="large" icon="user" />;
          }
        }, {
          title: '二维码',
          dataIndex: 'qrcodeUrl',
          key: 'qrcodeUrl',
          render: (v, r, i) => {
            return !!v ? (<Popover content={<img style={{width: '200px', height: '200px'}} src={v} />} title="机器人二维码">
                <img style={{width: '30px', height: '30px', cursor: 'pointer'}} src={v} />
              </Popover>) : '--';
          }
        }, {
          title: '创建时间',
          dataIndex: 'createdAt',
          key: 'createdAt',
          render: (v, r, i) => {
            if (!!v) {
              let date = new Date(v);
              return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            } else {
              return '--'
            }
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
          title: '绑定群',
          dataIndex: 'groupInfo',
          key: 'groupInfo',
          render: (v, r, i) => {
            if (!!v) {
              return <Tag color="cyan" onClick={this.showGroupDetails.bind(this, v.id)} key={'key'+v.id} id={v.id}>{v.name}</Tag>
            } else {
              return '--'
            }
          }
        }, {
          title: '添加好友回复',
          dataIndex: 'addMemberReply',
          key: 'addMemberReply',
          render: (v, r, i) => {
            return !!v ? v : '--';
          }
        }, {
          title: '操作',
          dataIndex: 'id',
          key: 'operate_id',
          render: (v, r, i) => {
            return <RobotEdit type='edit' robotId={v} current={this.state.pagination.current} size={this.state.pageSize} />
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
      groupVisible: false,
      robotsVisible: false,
      groupDetail: {
        robotList: []
      },
      step: 0,
      layerClassName: '',
      uuid: '',
      isLogin: false,
      avatar: '',
      onedayMaxPullNum: 0,
      robotCode: [],
      wxAccount: null,
      addMemberReply: null,
      fileList: [],
      wxId: '',
      name: '',
      sRobotName: null,
      sCreateTime: [],
      sUpdateTime: [],
      groupFileList: [],
      groupAvatar: [],
      groupTag: [],
      tagNameOptions: [],
      groupEdit: false
    }
  }

  componentWillMount() {
    this.props.pageChange('robots')
    this.props.getRobotsList({page: 0, size: 20})
    this.props.getGroupTag()
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      dataSource: nextProps.robots.data,
      pagination: {
        current: nextProps.robots.page + 1,
        pageSize: this.state.pageSize,
        total: nextProps.robots.total
      },
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
      groupTag: nextProps.groupTag,
      loading: false
    })
  }

  showGroupDetails = (id) => {
    const groupId = +id;
    this.props.getGroupDetail(groupId)
    this.setState({ groupVisible: true })
  }

  hideGroupModal = () => {
    this.setState({
      groupDetail: {
        robotList: []
      },
      groupVisible: false,
      groupEdit: false
    })
  }

  cancelBind = () => {
    this.setState({ robotsVisible: false })
  }

  onMaxPullChange = (e) => {
    this.setState({
      onedayMaxPullNum: e.target.value | 0
    });
  }

  handleRobotCdChange = ({fileList}) => {
    if (fileList.length === 0) {
      this.setState({robotCode: fileList});
    } else {
      this.setState({
        robotCode: [{
          uid: fileList[0].uid,
          name: fileList[0].name,
          status: fileList[0].status,
          url: (fileList[0].response && fileList[0].response.data.url) || ''
        }]
      });
    }
  };

  handleWxAccChange = (e) => {
    this.setState({
      wxAccount: e.target.value
    });
  };

  handleAddRepChange = (e) => {
    this.setState({
      addMemberReply: e.target.value
    });
  };

  handleAddRobotOk = () => {
     // 将头像上传七牛云
    let decode = atob(this.state.avatar.split(',')[1]);
    // let mime = 'image/jpeg';
    let len = decode.length;
    let dataArr = new Int8Array(len);
    for (let i = 0; i < len; i++) {
      dataArr[i] = decode.charCodeAt(i);
    }

    let params = {
      params: {
        wxId: this.state.wxId,
        wxAccount: this.state.wxAccount,
        addMemberReply: this.state.addMemberReply,
        // onedayMaxPullNum: this.state.onedayMaxPullNum,
        avatar: dataArr,
        qrcodeUrl: this.state.robotCode[0].url,
        name: this.state.name
      },
      robotList: {
        page: this.state.pagination.current-1,
        size: this.state.pageSize
      }
    };
    this.props.saveRobot(params);
    this.setState({
      robotsVisible: false,
      step: 0,
      onedayMaxPullNum: 0,
      fileList: [],
      robotCode: [],
      addMemberReply: null,
      wxAccount: null,
    });
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

    if (!!this.state.sRobotName) {
      params.robotName = this.state.sRobotName;
    }

    if (this.state.sCreateTime.length > 0) {
      params.createdAtBegin = this.state.sCreateTime[0];
      params.createdAtEnd = this.state.sCreateTime[1];
    }

    if (this.state.sUpdateTime.length > 0) {
      params.updatedAtBegin = this.state.sUpdateTime[0];
      params.updatedAtEnd = this.state.sUpdateTime[1];
    }

    this.props.getRobotsList(params)
  }

  onRobotNameChange = (e) => {
    this.setState({ sRobotName: e.target.value})
  }

  onRobotNameSearch = () => {
    let params = {
      page: 0,
      size: this.state.pageSize,
    }

    if (!!this.state.sRobotName) {
      params.robotName = this.state.sRobotName;
    }

    if (this.state.sCreateTime.length > 0) {
      params.createdAtBegin = this.state.sCreateTime[0];
      params.createdAtEnd = this.state.sCreateTime[1];
    }

    if (this.state.sUpdateTime.length > 0) {
      params.updatedAtBegin = this.state.sUpdateTime[0];
      params.updatedAtEnd = this.state.sUpdateTime[1];
    }

    this.props.getRobotsList(params);
  }

  onCreateTimeChange = (timeSting, time) => {

    if (!time[0]) {
      time = [];
      this.setState({ sCreateTime: [] })
    } else {
      this.setState({ sCreateTime: time })
    }

    let params = {
      page: 0,
      size: this.state.pageSize,
    }

    if (!!this.state.sRobotName) {
      params.robotName = this.state.sRobotName;
    }

    if (time.length > 0) {
      params.createdAtBegin = time[0];
      params.createdAtEnd = time[1];
    }

    if (this.state.sUpdateTime.length > 0) {
      params.updatedAtBegin = this.state.sUpdateTime[0];
      params.updatedAtEnd = this.state.sUpdateTime[1];
    }

    this.props.getRobotsList(params);
  }

  onUpdateTimeChange = (timeSting, time) => {
    if (!time[0]) {
      time = [];
      this.setState({ sUpdateTime: [] })
    } else {
      this.setState({ sUpdateTime: time })
    }

    let params = {
      page: 0,
      size: this.state.pageSize,
    }

    if (!!this.state.sRobotName) {
      params.robotName = this.state.sRobotName;
    }

    if (this.state.sCreateTime.length > 0) {
      params.createdAtBegin = this.state.sCreateTime[0];
      params.createdAtEnd = this.state.sCreateTime[1];
    }

    if (time.length > 0) {
      params.updatedAtBegin = time[0];
      params.updatedAtEnd = time[1];
    }

    this.props.getRobotsList(params);
  }

  onClearParams = () => {
    this.setState({
      sRobotName: null,
      sCreateTime: [],
      sUpdateTime: []
    })

    let params = {
      page: 0,
      size: this.state.pageSize
    }

    this.props.getRobotsList(params);
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

  render () {
    return (
      <div>
        <Row style={{marginBottom: '20px'}}>
          <Col span={20}>
            <Form layout="inline">
              <Form.Item label="名称">
                <Input.Search
                  size="small"
                  style={{ width: 120}}
                  onSearch={this.onRobotNameSearch}
                  onChange={this.onRobotNameChange}
                  value={this.state.sRobotName}
                  placeholder="机器人名称"/>
              </Form.Item>

              <Form.Item label="创建时间">
                <RangePicker
                  size="small"
                  format="YYYY-MM-DD"
                  placeholder={['开始时间', '结束时间']}
                  onChange={this.onCreateTimeChange}
                  value={this.state.sCreateTime.length > 0 ?
                          [moment(this.state.sCreateTime[0]), moment(this.state.sCreateTime[1])] :
                          []
                        } />
              </Form.Item>

              <Form.Item label="更新时间">
                <RangePicker
                  size="small"
                  format="YYYY-MM-DD"
                  placeholder={['开始时间', '结束时间']}
                  onChange={this.onUpdateTimeChange}
                  value={this.state.sUpdateTime.length > 0 ?
                          [moment(this.state.sUpdateTime[0]), moment(this.state.sUpdateTime[1])] :
                          []
                        } />
              </Form.Item>

              <Form.Item>
                <Button type="default" size="small" onClick={this.onClearParams} >重置</Button>
              </Form.Item>
            </Form>
          </Col>
          <Col span={4} style={{textAlign: 'right'}}>
            <RobotEdit type='add' robotId={-1} current={this.state.pagination.current} size={this.state.pageSize} />
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
                  onChange={this.onTimeChange}
                  value={moment(this.state.groupDetail.invalidDate)}
                  disabled={!this.state.groupEdit}
                  showTime
                  format="YYYY-MM-DD HH:mm:ss"
                  style={{width: '100%'}}/>
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
    pageChange: (lists) => {
      dispatch(pageChange(lists))
    },
    getRobotsList: (lists) => {
      dispatch(getRobotsList(lists))
    },
    getGroupDetail: (lists) => {
      dispatch(getGroupDetail(lists))
    },
    socketConnect: (lists) => {
      dispatch(socketConnect(lists))
    },
    saveRobot: (lists) => {
      dispatch(saveRobot(lists))
    },
    editGroup: (lists) => {
      dispatch(editGroup(lists))
    },
    getGroupTag: (lists) => {
      dispatch(getGroupTag(lists))
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Robots);