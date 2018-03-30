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
    message
  } from 'antd';
  import React from 'react';
  import { connect } from 'react-redux';
  const Step = Steps.Step;

  import { getRobotById } from '../services/apis';
  import { socketConnect, saveRobot, updateRobot } from '../reducers/actionCreater';
  import io from '../../dependencies/node_modules/socket.io-client';

  import * as config from '../config.js';
  
  class RobotEdit extends React.Component {
    constructor (props) {
      super(props);
      this.state = {
        visible: false,
        robotCode: [],
        wxId: '',
        uuid: '',
        isLogin: false,
        layerClassName: '',
        avatar: '',
        step: 0,
        wxAccount: '',
        addMemberReply: '',
        name: '',
        fileList: []
      }
    }

    showModal = id => {
      this.setState({
        visible: true,
        layerClassName: 'layer'
      })
      let robotId = parseInt(id, 10);
      if (robotId > 0) {
        this.getRobotDetails(robotId)
      } else {
          // 发送请求，获取uuid
        !this.state.socket || this.state.socket.close()
        let socket = io(`${location.protocol}//${location.hostname}`)
        if (socket) {
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
              layerClassName: '',
              isLogin: true,
              step: 1,
              name: data.name
            });
          });
        } else {
          message.error('服务器链接异常，无法获取二维码!');
        }
      }
    }
    
    getRobotDetails = robotId => {
      getRobotById(robotId).then(data => {
        if (data.data.status === 1) {
          let myData = data.data.data;
          this.setState({
            addMemberReply: myData.addMemberReply,
            avatar: myData.avatar,
            name: myData.name,
            robotCode: [{
              uid: -1,
              name: '机器人二维码.png',
              status: 'done',
              url: myData.qrcodeUrl
            }],
            wxAccount: myData.wxAccount,
            wxId: myData.wxId,
          })
        }
      })
    }
    
    handleCancel = () => {
      this.setState({ 
        visible: false,
        robotCode: [],
        wxId: '',
        uuid: '',
        isLogin: false,
        layerClassName: '',
        avatar: '',
        step: 0,
        wxAccount: '',
        addMemberReply: '',
        name: '',
        fileList: []
      })
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
      let avatar = this.state.avatar;
      if (this.props.robotId <= 0) {
        // 将头像上传七牛云
        let decode = atob(this.state.avatar.split(',')[1]);
        // let mime = 'image/jpeg';
        let len = decode.length;
        let dataArr = new Int8Array(len);
        for (let i = 0; i < len; i++) {
          dataArr[i] = decode.charCodeAt(i);
        }
        avatar = dataArr;
      }
       
      let params = {
        params: {
          wxId: this.state.wxId,
          wxAccount: this.state.wxAccount,
          addMemberReply: this.state.addMemberReply,
          avatar,
          qrcodeUrl: this.state.robotCode[0].url,
          name: this.state.name
        },
        robotList: {
          page: this.props.current-1,
          size: this.props.size
        }
      };
      if (this.props.robotId > 0) {
        this.props.updateRobot(params);
      } else {
        this.props.saveRobot(params);
      }
      this.setState({
        visible: false,
        robotCode: [],
        wxId: '',
        uuid: '',
        isLogin: false,
        layerClassName: '',
        avatar: '',
        step: 0,
        wxAccount: '',
        addMemberReply: '',
        name: '',
        fileList: []
      });
    }

    render () {
      let { type, robotId } = this.props;
      return (
        <div style={{display: 'inline-block', margin: '0 3px 0 3px'}}>
          {
            type === 'add' ? (
              <Button 
                type="primary" 
                size="small" 
                title='添加群'
                onClick={this.showModal.bind(this, robotId)}>
                <Icon type="plus" />
                添加
              </Button>
            ) : (
              <Button 
                style={{marginLeft: '10px'}} 
                size='small'
                title='编辑机器人' 
                onClick={this.showModal.bind(this, robotId)}>
                编辑机器人
              </Button>
            )
        }
          <Modal
            title='绑定机器人'
            layout='horizontal'
            id='robotsForm'
            onCancel={this.handleCancel}
            visible={this.state.visible}
            footer={[
              <Button key='back' onClick={this.handleCancel}>取消</Button>,
              <Button
                key='submit'
                type='primary'
                loading={this.state.step !== 1 && type === 'add'}
                onClick={this.handleAddRobotOk}>
                确定
              </Button>
            ]}
          >
          <Form>
            {
              type === 'add' ? (
                <div>
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
                        <Step key='step-2' title='添加机器人'></Step>
                      </Steps>
                    </Col>
                  </Row>
                </div>
              ) : (
                <Row>
                  <p className='robotDetailHeader'>{this.state.name}</p>
                  <div className='img-wrapper' id='loginQdUrl'>
                    <img alt='' src={this.state.avatar} />
                  </div>
                </Row>
              )
            }
            <Row>
              <Form.Item label='机器人二维码'>
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
              </Form.Item>
            </Row>
            <Row>
              <Form.Item label='微信号'>
                <Input
                  disabled={type === 'edit'}
                  placeholder='请输入微信号，用来标识绑定微信机器人'
                  value={this.state.wxAccount}
                  onChange={this.handleWxAccChange}></Input>
              </Form.Item>
            </Row>
            <Row>
              <Form.Item>
                <Input
                  type='textarea'
                  rows={8}
                  value={this.state.addMemberReply}
                  onChange={this.handleAddRepChange}
                  placeholder='成功添加好友默认回复'></Input>
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
    socketConnect: (lists) => {
      dispatch(socketConnect(lists))
    },
    saveRobot: (lists) => {
      dispatch(saveRobot(lists))
    },
    updateRobot: (lists) => {
      dispatch(updateRobot(lists))
    },
  } 
}
  
export default connect(mapStateToProps, mapDispatchToProps)(RobotEdit);