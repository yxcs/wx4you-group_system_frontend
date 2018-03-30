import {
  Button,
  Icon,
  Modal,
  Row,
  Col,
  Form,
  Input,
  Upload,
  Steps,
  Table,
  message,
  Popconfirm
} from 'antd';
import React from 'react';
import { connect } from 'react-redux';

import { getGroupDetail, bingRobot2Group, updateRobot4Group } from '../reducers/actionCreater';
import io from '../../dependencies/node_modules/socket.io-client';

import * as config from '../config.js';

const FormItem = Form.Item;
const Step = Steps.Step;

class RobotOperate extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      layerClassName: 'layer',
      tabsType: 'bind',                     // bind 绑定，select 选择
      uuid: '',
      isLogin: false,
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
      groupName: '',

      // 绑定机器热表格
      robotData: [],
      robotColumns: [
        {
          title: '状态',
          dataIndex: 'status',
          key: 'robotStatus',
          render: (v, r) => {
            return v === 'online' ? 
                    <span><Icon style={{ fontSize: 14, color: '#13CE66', marginRight: '3px' }} type="check-circle-o" />已登陆</span> : 
                    <span><Icon style={{ fontSize: 14, color: '#FF4949', marginRight: '3px' }} type="close-circle-o" />未登陆</span>;
          }
        }, {
          title: '名称',
          dataIndex: 'name',
          key: 'name',
        }, {
          title: '今日限额',
          dataIndex: 'onedayMaxPullNum',
          key: 'onedayMaxPullNum',
        }, {
          title: '今日添加',
          dataIndex: 'todayCurrentPullNum',
          key: 'todayCurrentPullNum'
        }, {
          title: '操作',
          dataIndex: 'id',
          key: 'operation',
          render: (v, record) => {
            return (
              <div style={{textAlign: 'center'}}>
                <Button type={this.state.robotDetailType === 'edit' ? 'primary' : ''} icon='edit' shape='circle' title='编辑机器人信息'
                  onClick={this.handleUpdate.bind(this, v)} className='edit'></Button>
                <Button icon='delete' shape='circle' title='解除绑定'
                  data-id={record.id} className='edit' data-type='remove'
                  onClick={this.handleRmRobot.bind(this, v)}></Button>
                {
                  record.status === 'offline' ? (
                    <Button type={this.state.robotDetailType === 'login' ? 'primary' : ''} icon='login' shape='circle' title='微信登陆'
                      onClick={this.robotLogin.bind(this, v)}
                      className='exit'>
                    </Button>
                  ) : (
                    <Popconfirm placement="top"
                      title='确认退出该机器人？'
                      onConfirm={this.handleExitOk.bind(this, v)}
                      okText="确定" cancelText="取消">
                        <Button type="danger" icon='logout' shape='circle' title='退出登录' className='exit'></Button>
                    </Popconfirm>
                  )
                }
              </div>
            );
          }
        }
      ],
      robotLoading: false,
      robotDetailType: 'none',    // edit '编辑机器人信息', login '机器人登陆', none '全部隐藏'
      scoket: null
    }
  } 

  componentWillReceiveProps (nextProps) {
    this.setState({
      robotData: nextProps.groupDetail.robotList,
      groupDetail: nextProps.groupDetail
    })
  }

  showModal = id => {
    this.setState({ visible: true, confirmLoading: false });
    const groupId = (parseInt(id, 10) > 0) ? +id : 0;
    this.props.getGroupDetail(groupId);
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
      socket.on('bind-success', robots => {
          console.log(robots)
      })
    } else {
      message.error('服务器链接异常，无法获取二维码!');
    }
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

  handleLoginOk = () => {
    this.state.socket.emit('update-bind', {
      robotId: this.state.robotId,
      avatar: this.state.groupDetail.avatar,
      groupName: this.state.groupDetail.name,
      addMemberReply: this.state.addMemberReply,
      groupId: this.state.groupDetail.id,
      groupQrcodeUrl: this.state.groupDetail.qrcodeUrl,
      memberMaxNum: this.state.groupDetail.memberMaxNum,
      invalidDate: this.state.groupDetail.invalidDate,
      tagName: this.state.groupDetail.tagName
    });
    this.setState({
      robotDetailType: 'none',
      layerClassName: 'layer',
      uuid: '',
      isLogin: false,
      avatar: '',
      step: 0,
      onedayMaxPullNum: 0,
      robotCode: [],
      wxAccount: '',
      addMemberReply: '',
      bindGroupId: '',
      wxId: '',
      name: '',
      groupName: '',
    });
    this.props.getGroupDetail(this.props.groupId)
  }

  handleUpdateBindRobotOK = () => {
    let params = {
      wxId: this.state.wxId,
      wxAccount: this.state.wxAccount,
      addMemberReply: this.state.addMemberReply,
      onedayMaxPullNum: this.state.onedayMaxPullNum,
      name: this.state.name,
      robotId: this.state.robotId,
      bind: true,
      qrcodeUrl: (this.state.robotCode[0] && this.state.robotCode[0].url) || '',
      bindGroupId: this.props.groupId,
      avatar: this.state.avatar
    };
    this.setState({
      robotDetailType: 'none',
      layerClassName: 'layer',
      uuid: '',
      isLogin: false,
      avatar: '',
      step: 0,
      onedayMaxPullNum: 0,
      robotCode: [],
      wxAccount: '',
      addMemberReply: '',
      bindGroupId: '',
      wxId: '',
      name: '',
      groupName: '',
    });
    this.props.updateRobot4Group(params);
  };

  handleCancel = () => {
    this.setState({ 
      visible: false,
      robotDetailType: 'none',
      layerClassName: 'layer',
      tabsType: 'bind',                     // bind 绑定，select 选择
      uuid: '',
      isLogin: false,
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
      robotData: [],
    })
  }

  handleUpdate = (id) => {
    let robotDetailType = this.state.robotDetailType;
    robotDetailType = robotDetailType === 'edit' ? 'none' : 'edit'
    let robotData = this.state.robotData;
    let robotId = +id | 0;
    let viewRobot = robotData.filter(item => {
      return item.id === robotId;
    })
    viewRobot = viewRobot[0];
    this.setState({
      robotDetailType,
      wxId: viewRobot.wxId,
      wxAccount: viewRobot.wxAccount,
      name: viewRobot.name,
      avatar: viewRobot.avatar,
      robotCode: [{
        uid: -1,
        name: '机器人二维码.png',
        status: 'done',
        url: viewRobot.qrcodeUrl
      }],
      addMemberReply: viewRobot.addMemberReply,
      onedayMaxPullNum: viewRobot.onedayMaxPullNum,
      robotId,
    })
  }

  handleRmRobot = (id) => {
    let robotId = +id;
    let params = {};
    let robotData = this.state.robotData;
    // 先退出机器人
    this.state.socket.emit('exit-robot', {robotId: robotId});
    // 获取联系人信息
    robotData.forEach(robot => {
      if (robot.id === robotId) {
        params = {
          wxId: robot.wxId,
          wxAccount: robot.wxAccount,
          addMemberReply: robot.addMemberReply,
          onedayMaxPullNum: robot.onedayMaxPullNum,
          name: robot.name,
          robotId: robotId,
          bind: false,
          qrcodeUrl: robot.qrcodeUrl,
          bindGroupId: this.props.groupId,
          avatar: robot.avatar
        };
      }
    });
    this.setState({ robotDetailType: 'none' })
    this.props.updateRobot4Group(params);
  }

  robotLogin = (id) => {
    !this.state.socket || this.state.socket.close()
    let socket = io(`${location.protocol}//${location.hostname}`)
    this.setState({ socket });
    let robotDetailType = this.state.robotDetailType;
    robotDetailType = robotDetailType === 'login' ? 'none' : 'login';
    this.bindRobot(this.state.groupDetail)
    let robotData = this.state.robotData;
    let robotId = +id | 0;
    let viewRobot = robotData.filter(item => {
      return item.id === robotId;
    })
    viewRobot = viewRobot[0];
    this.setState({
      robotDetailType,
      wxId: viewRobot.wxId,
      wxAccount: viewRobot.wxAccount,
      name: viewRobot.name,
      avatar: viewRobot.avatar,
      robotCode: [{
        uid: -1,
        name: '机器人二维码.png',
        status: 'done',
        url: viewRobot.qrcodeUrl
      }],
      addMemberReply: viewRobot.addMemberReply,
      onedayMaxPullNum: viewRobot.onedayMaxPullNum,
      robotId,
    })
  }

  handleExitOk = (id) => {
    let robotId = +id; 
    this.state.socket.emit('exit-robot', { robotId });
    this.setState({ robotDetailType: 'none'})
    message.success('退出机器人成功')
    this.props.getGroupDetail(this.props.groupId)
  };

  onCancelRobotUpdate =() => {
    this.setState({ 
      robotDetailType: 'none',
      layerClassName: 'layer',
      tabsType: 'bind',                     // bind 绑定，select 选择
      uuid: '',
      isLogin: false,
      avatar: '',
      step: 0,
      onedayMaxPullNum: 0,
      robotCode: [],
      wxAccount: '',
      addMemberReply: '',
      bindGroupId: '',
      wxId: '',
      name: '',
      groupName: this.props.groupName,
      robotLoading: false
    })
  }

  render () {
    let { groupId } = this.props;
    return (
      <div style={{display: 'inline-block', margin: '0 3px 0 3px'}}>
        <Button 
          size="small" 
          title='群绑定机器人查看'
          onClick={this.showModal.bind(this, groupId)}>
          查看机器人
        </Button>
        <Modal
        title='绑定机器人查看'
        onCancel={this.handleCancel}
        width={1000}
        footer={null}
        visible={this.state.visible}>
        <Row gutter={40}>
          <Col span={12}>
            <Table
              pagination={false}
              dataSource={this.state.robotData}
              columns={this.state.robotColumns}
              onChange={this.handleRobotTableChange}
              loading={this.state.robotLoading}
              rowKey="id"
              bordered/>
          </Col>
          <Col span={11} style={{ 
              display: this.state.robotDetailType === 'none' ? 'none' : '', 
              border: '1px solid #eee', 
              minHeight: '200px'}}>
             {
                this.state.robotDetailType === 'login' ? (
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
                        disabled={true}
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
                          </div>)
                        }
                      </Upload>
                    </FormItem>
                  </Row>
                  <Row>
                    <FormItem label='微信号'>
                      <Input
                      disabled={true}
                        placeholder='请输入微信号，用来标识绑定微信机器人'
                        value={this.state.wxAccount}
                        onChange={this.handleWxAccChange}></Input>
                    </FormItem>
                  </Row>
                  <Row>
                    <FormItem>
                      <Input
                        disabled={true}
                        type='textarea'
                        rows={8}
                        value={this.state.addMemberReply}
                        onChange={this.handleAddRepChange}
                        placeholder='成功添加好友默认回复'></Input>
                    </FormItem>
                  </Row>
                  <Row>
                    <FormItem>
                    <Button size='small' onClick={this.onCancelRobotUpdate}>取消</Button>,
                    <Button 
                      size='small' 
                      type='primary' 
                      loading={this.state.step !== 2}
                      onClick={this.handleLoginOk}>
                      确定
                    </Button>
                    </FormItem>
                  </Row>
                </Form>
               ) : (
                  <Form>
                  <p className='robotDetailHeader'>{this.state.name}</p>
                  <Row>
                    <div className='img-wrapper avatar'>
                      <img src={this.state.avatar} alt=''/>
                    </div>
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
                        disabled></Input>
                    </FormItem>
                  </Row>
                  <Row>
                    <FormItem>
                      <Input
                        type='textarea'
                        rows={6}
                        value={this.state.addMemberReply}
                        onChange={this.handleAddRepChange}
                        placeholder='成功添加好友默认回复'></Input>
                    </FormItem>
                  </Row>
                  <Row>
                    <FormItem>
                    <Button size='small' onClick={this.onCancelRobotUpdate}>取消</Button>,
                    <Button 
                      size='small' 
                      type='primary'
                      onClick={this.handleUpdateBindRobotOK}>
                      确定
                    </Button>
                    </FormItem>
                  </Row>
                </Form>
               )
             }
          </Col>
        </Row>
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
  bingRobot2Group: (lists) => {
    dispatch(bingRobot2Group(lists))
  },
  updateRobot4Group: (lists) => {
    dispatch(updateRobot4Group(lists))
  },
  getGroupDetail:  (lists) => {
    dispatch(getGroupDetail(lists))
  }
} 
}

export default connect(mapStateToProps, mapDispatchToProps)(RobotOperate);