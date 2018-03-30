import {
    Button,
    Icon,
    Modal,
    Row,
    Col,
    Form,
    Input,
    DatePicker,
    Switch,
    Upload,
    Select,
    Tabs,
    Steps,
    Table,
    message
  } from 'antd';
  import React from 'react';
  import moment from 'moment';
  import { connect } from 'react-redux';

  import { getGroupDetail, getRobotsList } from '../services/apis';
  import {  socketConnect, bingRobot2Group } from '../reducers/actionCreater';
  import io from '../../dependencies/node_modules/socket.io-client';

  import * as config from '../config.js';
  
  const FormItem = Form.Item;
  const Step = Steps.Step;
  const { RangePicker } = DatePicker
  
  class RobotBind extends React.Component {
    constructor (props) {
      super(props);
      this.state = {
        layerClassName: 'layer',
        tabsType: 'bind',                     // bind 绑定，select 选择
        uuid: '',
        isLogin: '',
        avatar: '',
        step: 0,
        onedayMaxPullNum: 0,
        robotCode: [],
        wxAccount: '',
        addMemberReply: '',
        groupDetail: {},
        bindGroupId: '',
        wxId: '',
        name: '',
        //  选择群参数
        sRobotName: '',
        sRobotCreateTime: [],
        sRobotUpdateTime: [],
        robotPagination: {
          current: 1,
          pageSize: 10
        },
        pageSize: 10,
        robotDataSource: [],
        robotSelectColumns: [
          {
            title: '#',
            dataIndex: 'id',
            key: 'index',
            render: (v, r, i) => {
              return i+1;
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
            title: '绑定',
            dataIndex: 'id',
            key: 'operation',
            render: (v, r, i) => {
              return !!r.groupInfo ? '': <Button size="small" type="primary" onClick={this.onSelectBindRobot.bind(this, r.id)}>绑定</Button>
            }
          }
        ],
        robotSelectLoading: false,
        socket: null
      }
    } 

    showModal = id => {
      !this.state.socket || this.state.socket.close()
      let socket = io(`${location.protocol}//${location.hostname}`)
      this.setState({ visible: true, confirmLoading: false, socket });
      this.getGroupDetail();
    }

    getGroupDetail = () => {
      let groupId = this.props.groupId;
      if (groupId > 0) {
        getGroupDetail(groupId).then(data => {
          if (data.data.status === 1) {
            let groupDetail = data.data.data;
            this.setState({ groupDetail })
            this.bindRobot(groupDetail)
          }
        })
      }
    }

    bindRobot = (currentGroup) => {
      let groupId = this.props.groupId | 0;
      this.setState({
        uuid: '',
        avatar: '',
        bindGroupId: groupId,
        groupName: this.props.groupName,
        currentGroup,
        layerClassName: 'layer'
      });
      // 发送请求，获取uuid
      if (this.state.socket) {
        let socket = this.state.socket;
        socket.emit('bind-robot');
        socket.once('send-uuid', data => {
          this.setState({
            uuid: data.uuid,
            layerClassName: 'layer get-uuid'
          });
        });
        socket.once('avatar', data => {
          this.setState({
            layerClassName: 'layer scanned',
            uuid: '',
            avatar: data.avatar
          });
        });
        socket.once('login', data => {
          this.setState({
            layerClassName: 'layer check-group',
            isLogin: true,
            step: 1,
            name: data.name
          });
    
          // 发送请求校验群名称
          socket.emit('check-group', {
            groupName: this.state.groupName
          })
        });
        socket.once('find-group-in-robot', _ => {
          this.setState({
            layerClassName: 'layer get-uuid',
            step: 2
          })
        });
      } else {
        message.error('服务器链接异常，无法获取二维码!');
      }
    }

    onTabsChange = value => {
      if (value === 'select') {
         this.getRobotsList({page: 0, size: 10})
      }
      this.setState({ tabsType: value })
    }

    onMaxPullChange = (e) => {
      this.setState({
        onedayMaxPullNum: e.target.value | 0
      });
    };

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
      // let fileBlob = new Blob(dataArr, {type: mime});
      let params = {
        wxId: this.state.wxId,
        wxAccount: this.state.wxAccount,
        addMemberReply: this.state.addMemberReply,
        onedayMaxPullNum: this.state.onedayMaxPullNum,
        name: this.state.name,
        bindGroupId: this.props.groupId,
        avatar: dataArr,
        qrcodeUrl: this.state.robotCode[0].url,
        currentGroup: this.state.currentGroup,
        groupName: this.props.groupName,
        socket: this.state.socket,
        editType: 'bind'
      };
      this.props.bingRobot2Group(params);
      this.setState({
        visible: false,
        step: 0,
        onedayMaxPullNum: 0,
        fileList: [],
        robotCode: [],
        addMemberReply: null,
        wxAccount: null,
        tabsType: 'bind'
      });
    }

    handleCancel = () => {
      this.setState({ 
        visible: false,
      })
    }

    // 选择群操作
    onRobotNameSearch = () => {
      this.setState({robotSelectLoading: true})
      let params = {
        page: 0,
        size: 10,
      }
  
      if (!!this.state.sRobotName) {
        params.robotName = this.state.sRobotName;
      }
  
      if (this.state.sRobotCreateTime.length > 0) {
        params.createdAtBegin = this.state.sRobotCreateTime[0];
        params.createdAtEnd = this.state.sRobotCreateTime[1];
      }
  
      if (this.state.sRobotUpdateTime.length > 0) {
        params.updatedAtBegin = this.state.sRobotUpdateTime[0];
        params.updatedAtEnd = this.state.sRobotUpdateTime[1];
      }
  
      this.getRobotsList(params);
    }

    onRobotNameChange = (e) => {
      this.setState({ sRobotName: e.target.value})
    }

    onRobotCreateTimeChange = (timeSting, time) => {
      this.setState({ sRobotCreateTime: time, robotSelectLoading: true })
  
      let params = {
        page: 0,
        size: 10,
      }
  
      if (!!this.state.sRobotName) {
        params.robotName = this.state.sRobotName;
      }
  
      if (time.length > 0) {
        params.createdAtBegin = time[0];
        params.createdAtEnd = time[1];
      }
  
      if (this.state.sRobotUpdateTime.length > 0) {
        params.updatedAtBegin = this.state.sRobotUpdateTime[0];
        params.updatedAtEnd = this.state.sRobotUpdateTime[1];
      }
  
      this.getRobotsList(params);
    }

    onRobotUpdateTimeChange = (timeSting, time) => {
      this.setState({ sRobotUpdateTime: time, robotSelectLoading: true })
  
      let params = {
        page: 0,
        size: this.state.pageSize,
      }
  
      if (!!this.state.sRobotName) {
        params.robotName = this.state.sRobotName;
      }
  
      if (this.state.sRobotCreateTime.length > 0) {
        params.createdAtBegin = this.state.sRobotCreateTime[0];
        params.createdAtEnd = this.state.sRobotCreateTime[1];
      }
  
      if (time.length > 0) {
        params.updatedAtBegin = time[0];
        params.updatedAtEnd = time[1];
      }
  
      this.getRobotsList(params);
    }

    onRobotClearParams = () => {
      this.setState({
        sRobotName: '',
        sRobotCreateTime: [],
        sRobotUpdateTime: [],
        robotSelectLoading: true
      })
  
      let params = {
        page: 0,
        size: 10
      }
  
      this.getRobotsList(params);
    }

    handleRobotTableChange = (pagination) => {
      const pager = this.state.pagination;
      pager.current = pagination.current;
      this.setState({
         pagination: pager,
         robotSelectLoading: true
      });
      let params = {
         page: pagination.current-1,
         size: 10
      };
  
      if (!!this.state.sRobotName) {
        params.robotName = this.state.sRobotName;
      }
  
      if (this.state.sRobotCreateTime.length > 0) {
        params.createdAtBegin = this.state.sRobotCreateTime[0];
        params.createdAtEnd = this.state.sRobotCreateTime[1];
      }
  
      if (this.state.sRobotUpdateTime.length > 0) {
        params.updatedAtBegin = this.state.sRobotUpdateTime[0];
        params.updatedAtEnd = this.state.sRobotUpdateTime[1];
      }
      
      this.getRobotsList(params)
    }
  
  getRobotsList = (params) => { 
      this.setState({ robotSelectLoading: true })
      getRobotsList(params).then(data => {
        let myData = data.data.data;
        console.log(myData)
        if (data.data.status === 1) {
          this.setState({ 
            robotSelectLoading: false,
            robotDataSource: myData.data,
            pagination: {
              current: myData.page + 1,
              pageSize: this.state.pageSize,
              total: myData.totalItem
            }
          })
        } else {
          this.setState({ robotSelectLoading: false })
        }
      })
    }

    onSelectBindRobot = (id) => {
      const robotId = +id;
      const bindGroupId = this.props.groupId;
      let robot = this.state.robotDataSource.filter(item => {
        return item.id === robotId;
      })

  
      robot = robot[0];
      const currentGroup = this.state.groupDetail;
  
      let params = {
        wxId: robot.wxId,
        wxAccount: robot.wxAccount,
        addMemberReply: robot.addMemberReply,
        onedayMaxPullNum: 0,
        name: robot.name,
        bindGroupId,
        avatar: robot.avatar,
        qrcodeUrl: robot.qrcodeUrl,
        currentGroup,
        groupName: currentGroup.groupName,
        socket: this.state.socket,
        editType: 'select',
        robotId
      };
  
      this.props.bingRobot2Group(params);
  
      this.setState({
        visible: false,
        step: 0,
        onedayMaxPullNum: 0,
        fileList: [],
        robotCode: [],
        addMemberReply: null,
        wxAccount: null,
        tabsType: 'bind'
      });
    }
  
    render () {
      let { type, groupId } = this.props;
      return (
        <div style={{display: 'inline-block', margin: '0 3px 0 3px'}}>
        {
            type === 'bind' ? (
              <Button 
                size="small" 
                title='绑定机器人'
                onClick={this.showModal.bind(this, groupId)}>
                绑定机器人
              </Button>
            ): (
              <Button 
                style={{marginLeft: '10px'}} 
                size='small'
                title='查看机器人'
                onClick={this.showModal.bind(this, groupId)}>
                查看机器人
              </Button>
            )
        }
        <Modal
          title='绑定机器人'
          layout='horizontal'
          id='robotsForm'
          width={600}
          onCancel={this.handleCancel}
          visible={this.state.visible}
          footer={[
            <Button key='back' onClick={this.handleCancel}>取消</Button>,
            <Button
              key='submit'
              type='primary'
              loading={this.state.tabsType === 'bind' && this.state.step !== 2}
              onClick={this.state.tabsType === 'bind' ? this.handleAddRobotOk : this.handleCancel}>
              确定
            </Button>,
          ]}
          >
          <Tabs
            activeKey={this.state.tabsType} 
            defaultActiveKey={this.state.tabsType} 
            size="small" 
            onChange={this.onTabsChange}>
            <Tabs.TabPane tab="添加绑定" key="bind">
              <Form>
                <Row>
                  <div className='img-wrapper' id='loginQdUrl'>
                    <div className={this.state.layerClassName}>
                      {
                        !this.state.uuid && !this.state.isLogin ?
                        (
                          <Icon className='icon' type='loading'>
                            <p className='tip'>二维码获取中</p>
                          </Icon>
                        ) : null
                      }
                      {
                        this.state.isLogin ?
                        (
                          <Icon className='icon' type='loading'>
                            <p className='tip'>校验当前群名称...</p>
                          </Icon>
                        ) : null
                      }
                    </div>
                    <img alt='' src={
                      this.state.uuid ?
                      `https://login.weixin.qq.com/qrcode/${this.state.uuid}` :
                      (this.state.avatar ? this.state.avatar : '')} />
                  </div>
                </Row>
                <Row>
                  <Col span={18} offset={3}>
                    <Steps current={this.state.step} size='small'>
                      <Step key='step-1' title='登录微信号'></Step>
                      <Step key='step-2' title='校验群名称'></Step>
                      <Step key='step-3' title='绑定机器人'></Step>
                    </Steps>
                  </Col>
                </Row>
                <Row>
                  <FormItem label='每日限额'>
                    <Input
                      placeholder='该机器人每天添加的粉丝上限'
                      value={this.state.onedayMaxPullNum}
                      onChange={this.onMaxPullChange} />
                  </FormItem>
                </Row>
                <Row>
                  <FormItem label='机器人二维码'>
                    <Upload
                      action={`${config.uploadUrl}/product/image/save`}
                      listType='picture-card'
                      name='imageFile'
                      fileList={this.state.robotCode}
                      onChange={this.handleRobotCdChange}>
                      {this.state.robotCode.length > 0 ? null :
                        (<div>
                          <Icon type='plus'></Icon>
                          <div className='ant-upload-text'>Upload</div>
                        </div>)}
                    </Upload>
                  </FormItem>
                </Row>
                <Row>
                  <FormItem label='微信号'>
                    <Input
                      placeholder='请输入微信号，用来标识绑定微信机器人'
                      value={this.state.wxAccount}
                      onChange={this.handleWxAccChange}></Input>
                  </FormItem>
                </Row>
                <Row>
                  <FormItem>
                    <Input
                      type='textarea'
                      rows={8}
                      value={this.state.addMemberReply}
                      onChange={this.handleAddRepChange}
                      placeholder='成功添加好友默认回复'></Input>
                  </FormItem>
                </Row>
              </Form>
            </Tabs.TabPane>
            <Tabs.TabPane tab="选择绑定" key="select">
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
                    onChange={this.onRobotCreateTimeChange}
                    value={this.state.sRobotCreateTime.length > 0 ? 
                            [moment(this.state.sRobotCreateTime[0]), moment(this.state.sRobotCreateTime[1])] : 
                            []
                          }/>
                </Form.Item>

                <Form.Item label="更新时间">
                  <RangePicker
                    size="small"
                    format="YYYY-MM-DD"
                    placeholder={['开始时间', '结束时间']}
                    onChange={this.onRobotUpdateTimeChange}
                    value={this.state.sRobotUpdateTime.length > 0 ? 
                            [moment(this.state.sRobotUpdateTime[0]), moment(this.state.sRobotUpdateTime[1])] : 
                            []
                          } />
                </Form.Item>

                <Form.Item>
                  <Button type="default" size="small" onClick={this.onRobotClearParams} >重置</Button>
                </Form.Item>
              </Form>
              <Table
                pagination={this.state.robotPagination}
                dataSource={this.state.robotDataSource}
                columns={this.state.robotSelectColumns}
                onChange={this.handleRobotTableChange}
                loading={this.state.robotSelectLoading}
                rowKey="id"
                bordered
                size="small"/>
            </Tabs.TabPane>
          </Tabs>
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
    socketConnect: (lists) => {
      dispatch(socketConnect(lists))
    },
    bingRobot2Group: (lists) => {
      dispatch(bingRobot2Group(lists))
    },
  }
}
  
export default connect(mapStateToProps, mapDispatchToProps)(RobotBind);