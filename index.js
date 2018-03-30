const fs = require('fs');
const Robot = require('./dependencies/node_modules/wechat4u');
const http = require('http');
const express = require('./dependencies/node_modules/express');
const app = express();
const server = http.createServer(app);
const bodyParser = require('./dependencies/node_modules/body-parser');
const socket = require('./dependencies/node_modules/socket.io');
const axios = require('./dependencies/node_modules/axios');
const async = require('./dependencies/node_modules/async');
const io = socket(server);
const config = {
  baseUrl: 'http://api-gp-sys.xuanwonainiu.com',
  port: 80
};

let robots = [];

// 代理静态资源
app.use(express.static('./build'));
app.use('/static', express.static('./build/static'));
// 引入bodyparser
// conen-type for application/json
app.use(bodyParser.json());
// content-type for application/x-www-form-urlencode
app.use(bodyParser.urlencoded({extended: false}));

// 跨域支持
app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'content-type')
  res.header('Access-Control-Request-Headers', 'X-Requested-with');
  res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
})

app.get('/robots', (req, res) => {
  res.send({robots: robots.length})
});

app.post('/getRobotsStatus', (req, res) => {
  let { clientRobots } = req.body;
  let result = [];
  robots.forEach(robot => {
    clientRobots.forEach(clientRobot => {
      if ((clientRobot.id | 0) === (robot.robotId | 0)) {
        clientRobot.status = robot.taskStatus;
        result.push(clientRobot);
      }
    })
  });
  res.send({result});
});

app.post('/updateAddReply', (req, res) => {
  let { addMemberReply, robotId } = req.body;
  robots.forEach(robot => {
    if (robot.robotId === robotId) {
      robot.addMemberReply = addMemberReply;
    }
  });
  res.send({data: true});
});

app.get('/log', (req, res) => {
  let { account } = req.query;
  res.sendFile(`${__dirname}/src/log/${account}.log`);
});

app.get(/^\/(groups|robot|activities|signUp.*|h5\/\d*)/, (req, res) => {
  res.sendFile(`${__dirname}/build/index.html`);
});

function pushMemberCount (robot, memberNum) {
  axios.post(
    // `${devUrl}/group/update`,
    `${config.baseUrl}:${config.port}/group/update`,
    {
      id: robot.groupId,
      avatar: robot.avatar,
      memberNum,
      memberMaxNum: robot.memberMaxNum,
      qrcodeUrl: robot.groupQrcodeUrl,
      invalidDate: robot.invalidDate,
      tagName: robot.tagName
    }
  ).then(res => {
    if (res.data.status === 1) {
      console.log('更新群信息成功');
    } else {
      console.log(res.data.details);
    }
  }).catch(e => {
    console.log('更新群信息失败');
    console.log(e.message);
  });
};

function bind (currentSocket) {
  console.log('----------bind--------------')
  let robot = currentSocket.robot;
  // 客户端主动退出机器人
  robot.task = [];
  // 开始定时扫任务表
  robot.intervalId = setInterval(_ => {
    setTimeout(_ => {
      // 通过申请
      if (robot === null) {
        return -1;
      }
      let len = robot.task.length;
      let taskIndex = Math.floor(Math.random() * len);
      let currentTask = robot.task[taskIndex];
      if (robot.taskStatus === 'RUNNING' && len > 0) {
        robot.verifyUser(currentTask.userKey, currentTask.userTicket)
        .then(_ => {
          // 调接口获取机器人拉群情况
          fs.appendFileSync(
            `./src/log/${robot.user.NickName}.log`,
            `${new Date(Date.now()).toLocaleString()} ----调用接口${config.baseUrl}/robot/checkAddMember/${robot.robotId}----\r\n`
          );
          try {
            axios({
              method: 'get',
              // url: `${devUrl}/robot/checkAddMember/${robot.robotId}`
              url: `${config.baseUrl}/robot/checkAddMember/${robot.robotId}`
            }).then(res => {
              if (res.data.status === 1) {
                if (res.data.data) {
                  // 发送消息
                  robot.sendMsg(robot.addMemberReply ,currentTask.userKey)
                  .then(_ => {
                    console.log('消息发送成功');
                    fs.appendFileSync(
                      `./src/log/${robot.user.NickName}.log`,
                      `${new Date(Date.now()).toLocaleString()} ----发送消息给好友${currentTask.userNick}成功----\r\n`
                    );
                  })
                  .catch(e => {
                    fs.appendFileSync(
                      `./src/log/${robot.user.NickName}.log`,
                      `${new Date(Date.now()).toLocaleString()} ----发送消息给好友${currentTask.userNick}失败：${e}----\r\n`
                    );
                  });
                  // 尝试直接拉入群
                  robot.updateChatroom(
                    robot.groupKey,
                    [currentTask.userKey],
                    'addmember'
                  ).then(_ => {
                    fs.appendFileSync(
                      `./src/log/${robot.user.NickName}.log`,
                      `${new Date(Date.now()).toLocaleString()} ----执行操作：尝试把好友${currentTask.userNick}直接拉入群----\r\n`
                    );
                    axios.post(
                      `${config.baseUrl}/robot/addMemberSuccess`, {
                      // `${devUrl}/robot/addMemberSuccess`, {
                      robotId: robot.robotId,
                      name: currentTask.userNick
                    }).then(res => {
                      if (res.data.status === 1) {
                        let newRemark = `${new Date().toLocaleDateString()}--${new Date().toLocaleTimeString()}_${currentTask.userNick}`;
                        console.log('----上报拉人成功----');
                        // 拉人成功之后，从任务列表删除任务
                        robot.task.splice(taskIndex, 1);
                        fs.appendFileSync(
                          `./src/log/${robot.user.NickName}.log`,
                          `${new Date(Date.now()).toLocaleString()} ----成功将好友${currentTask.userNick}拉入群${robot.groupName}，该好友发送的认证信息是：${currentTask.content}----\r\n`
                        );
                        robot.updateRemarkName(currentTask.userKey, newRemark)
                        .then(_ => {
                          fs.appendFileSync(
                            `./src/log/${robot.user.NickName}.log`,
                            `${new Date(Date.now()).toLocaleString()} ----成功将好友${currentTask.userNick}的昵称更新为：${newRemark}----\r\n`
                          );
                        });
                      } else {
                        console.log(res.details);
                        fs.appendFileSync(
                          `./src/log/${robot.user.NickName}.log`,
                          `${new Date(Date.now()).toLocaleString()} ----上报拉人${currentTask.userNick}失败 ${res.details}----\r\n`
                        );
                      }
                    });
                  }).catch(e => {

                    // 10s后尝试发送入群邀请
                    setTimeout(_ => {
                      console.log('----直接拉入群失败，尝试发送入群邀请----');
                      fs.appendFileSync(
                        `./src/log/${robot.user.NickName}.log`,
                        `${new Date(Date.now()).toLocaleString()} ----直接将好友${currentTask.userNick}拉入群失败，开始发送入群邀请----\r\n`
                      );
                      robot.updateChatroom(
                        robot.groupKey,
                        [currentTask.userKey],
                        'invitemember'
                      ).then(_ => {
                        console.log('----入群邀请发送成功----');
                        fs.appendFileSync(
                          `./src/log/${robot.user.NickName}.log`,
                          `${new Date(Date.now()).toLocaleString()} ----入群邀请发送成功----\r\n`
                        );
                        axios.post(`${config.baseUrl}/robot/addMemberSuccess`, {
                        // axios.post(`${devUrl}/robot/addMemberSuccess`, {
                          robotId: robot.robotId,
                          name: currentTask.userNick
                        }).then(res => {
                          if (res.data.status === 1) {
                            let newRemark = `${new Date().toLocaleDateString()}--${new Date().toLocaleTimeString()}_${currentTask.userNick}`;
                            console.log('----上报拉人成功----');
                            // 拉人成功之后，从任务列表删除任务
                            robot.task.splice(taskIndex, 1);
                            fs.appendFileSync(
                              `./src/log/${robot.user.NickName}.log`,
                              `${new Date(Date.now()).toLocaleString()} ----成功向好友${currentTask.userNick}发送群${robot.groupName}的入群邀请，该好友发送的认证信息是：${currentTask.content}----\r\n`
                            );
                            robot.updateRemarkName(currentTask.userKey, newRemark)
                            .then(_ => {
                              fs.appendFileSync(
                                `./src/log/${robot.user.NickName}.log`,
                                `${new Date(Date.now()).toLocaleString()} ----成功将好友${currentTask.userNick}的昵称更新为：${newRemark}----\r\n`
                              );
                            });
                          } else {
                            console.log(res.details);
                            fs.appendFileSync(
                              `./src/log/${robot.user.NickName}.log`,
                              `${new Date(Date.now()).toLocaleString()} ----上报拉人${currentTask.userNick}失败 ${res.details}----\r\n`
                            );
                          }
                        });
                      }).catch(e => {

                        // 邀请入群失败，尝试修改好友昵称
                        robot.updateRemarkName(currentTask.userKey, `【邀请入群失败】${new Date().toLocaleDateString()}--${new Date().toLocaleTimeString()}_${currentTask.userNick}`)
                        if (e.toString().indexOf('-2') >= 0) {

                          // 群主开启了群验证，直接删除该任务
                          robot.task.splice(taskIndex, 1);

                          // 发送微信预警消息
                          robot.sendMsg(
                            `向好友【${currentTask.userNick}】发送群【${robot.groupName}】的入群邀请失败：群主开启了群验证`,
                            'filehelper'
                          )
                          fs.appendFileSync(
                            `./src/log/${robot.user.NickName}.log`,
                            `${new Date(Date.now()).toLocaleString()} ----邀请好友${currentTask.userNick}入群失败，很可能是群主开启了群验证----\r\n
                            ${new Date(Date.now()).toLocaleString()} ----${e}----\r\n`
                          );
                        } else if (e.toString().indexOf('1205') >= 0) {

                          // 发送微信预警消息
                          robot.sendMsg(
                            `向好友【${currentTask.userNick}】发送群【${robot.groupName}】的入群邀请失败：操作频繁，接口被腾讯限制，自动暂停一小时后继续任务`,
                            'filehelper'
                          )
                          // 接口频繁
                          fs.appendFileSync(
                            `./src/log/${robot.user.NickName}.log`,
                            `${new Date(Date.now()).toLocaleString()} ----邀请好友${currentTask.userNick}入群失败，操作频繁----\r\n\r\n`
                          );
                          robot.taskStatus = 'FORBIDDEN';
                          setTimeout(_ => {
                            if (robot.taskStatus === 'FORBIDDEN') {
                              robot.taskStatus = 'RUNNING';
                            }
                          }, 60 * 1000 * 60);
                        } else {

                          // 发送微信预警消息
                          robot.sendMsg(
                            `向好友【${currentTask.userNick}】发送群【${robot.groupName}】的入群邀请失败：未知原因，时间：${new Date(Date.now()).toLocaleString()}`,
                            'filehelper'
                          )
                          fs.appendFileSync(
                            `./src/log/${robot.user.NickName}.log`,
                            `${new Date(Date.now()).toLocaleString()} ----邀请好友${currentTask.userNick}入群失败，未知错误：${e.toString()}\r\n`
                          )
                        }
                      });
                    }, 10 * 1000)
                  });
                } else {
                  console.log('----被限制拉群----');

                  fs.appendFileSync(
                    `./src/log/${robot.user.NickName}.log`,
                    `${new Date(Date.now()).toLocaleString()} ----被限制将好友${currentTask.userNick}拉群，限额已用完----\r\n`
                  );
                }
              } else {
                fs.appendFileSync(
                  `./src/log/${robot.user.NickName}.log`,
                  `${new Date(Date.now()).toLocaleString()} ----接口调用失败${res.data.details}----\r\n`
                );
              }
            }).catch( e => {
              fs.appendFileSync(
              `./src/log/${robot.user.NickName}.log`,
                `${new Date(Date.now()).toLocaleString()} ----${e}----`
              );
            });
          } catch (error) {
            fs.appendFileSync(
            `./src/log/${robot.user.NickName}.log`,
              `${new Date(Date.now()).toLocaleString()} ----${error}----`
            );
          }
        }).catch(e => {
          if (e.toString().indexOf('1205') >= 0) {
            console.log('----通过好友${currentTask.userNick}请求失败，频繁操作，任务暂停，1h后重启任务--------');
            fs.appendFileSync(
              `./src/log/${robot.user.NickName}.log`,
              `${new Date(Date.now()).toLocaleString()} 请求频繁：${e}\r\n----通过好友${currentTask.userNick}请求失败，频繁操作，任务暂停，1h后重启任务--------\r\n`
            );
            robot.taskStatus = 'FORBIDDEN';
            setTimeout(_ => {
              if (robot.taskStatus === 'FORBIDDEN') {
                robot.taskStatus = 'RUNNING';
              }
            }, 60 * 1000 * 60);
          } else if (e.toString().indexOf('1101') >= 0) {
            // 尝试3次
            if (currentTask.retry < 3) {
              fs.appendFileSync(
                `./src/log/${robot.user.NickName}.log`,
                `${new Date(Date.now()).toLocaleString()} 重启中。。。\r\n`
              );
              currentTask.retry++;
            } else {
              robot.task.splice(taskIndex, 1);
            }
          } else {
            if (currentTask.retry < 3) {
              currentTask.retry++;
            } else {
              robot.task.splice(taskIndex, 1);
            }
          }
          fs.appendFileSync(
            `./src/log/${robot.user.NickName}.log`,
            `${new Date(Date.now()).toLocaleString()} ----通过好友${currentTask.userNick}请求失败\r\n`
          );
        });
      } else if (robot.taskStatus !== 'RUNNING' && len > 0) {
        if (len > 0) {
          fs.appendFileSync(
            `./src/log/${robot.user.NickName}.log`,
            `${new Date(Date.now()).toLocaleString()} ----任务状态异常:${robot.taskStatus}----\r\n`
          );
        }
      }
    }, Math.floor(Math.random() * 30) * 1000);
  }, 90 * 1000);
  robot.taskStatus = 'PAUSE';
  robot.on('uuid', uuid => {
    console.log('--------------getuuid-----------------------');
    currentSocket.emit('send-uuid', {uuid});
  });
  robot.on('user-avatar', avatar => {
    currentSocket.emit('avatar', {avatar});
    fs.appendFileSync(
      `./src/log/admin.log`,
      `${new Date(Date.now()).toLocaleString()} ---获取头像----\r\n`
    );
  });
  robot.on('login', _ => {
    fs.appendFileSync(
      `./src/log/admin.log`,
      `${new Date(Date.now()).toLocaleString()} ---登录成功----\r\n`
    );
    currentSocket.emit(
      'login',
      {
        name: robot.user.NickName,
        Uin: robot.user.Uin
      }
    );
    // 登录之后轮询联系人列表
    async.whilst(
      _ => {
        return robot && robot.state !== robot.CONF.STATE.logout && robot.syncStatus !== 'STOP';
      },
      cb => {
        setTimeout(_ => {
          robot && robot
          .getContact(robot.Seq ? robot.Seq : null)
          .then(res => {
            console.log(res.Seq)
            robot.Seq = res.Seq;
            cb(null, Date.now())
          })
        }, 10000)
      },
      (err, n) => {
        console.log(n)
      }
    )
  });
  robot.on('logout', _ => {
    console.log('退出登录');
    let robotIndex = -1;
    robots.some((item, index) => {
      if (item.robotId === robot.robotId) {
        robotIndex = index;
        return true;
      } else {
        return false;
      }
    });
    if (robotIndex >= 0) {
      let deleteRobot = robots.splice(robotIndex, 1);
      // 注销任务
      deleteRobot[0] && deleteRobot[0].removeAllListeners && deleteRobot[0].removeAllListeners();
      clearInterval(deleteRobot[0].intervalId);
      deleteRobot = null;
    } else {
      clearInterval(robot.robotId)
      robot.removeAllListeners && robot.removeAllListeners()
      robot = null;
    }
    console.log('logout trigger');
    currentSocket.emit('exit-succeed', {robotId: robot ? robot.robotId : null});
  });
  robot.on('error', e => {
    // console.log(e);
    fs.appendFileSync(
      `./src/log/admin.log`,
      `${new Date(Date.now()).toLocaleString()} ErrorContent: ${e}\r\n`
    );
  });

  // 更新群信息
  robot.on('contacts-updated', contacts => {
    Object.keys(robot.contacts).forEach(key => {
      if (robot.contacts[key].getDisplayName() === `[群] ${robot.groupName}`) {
        // 每次更新群信息，下发信息到client，由client发送到服务端
        pushMemberCount(robot, robot.contacts[key].MemberCount);
      }
    });
  });
  robot.on('message', msg => {
    switch (msg.MsgType) {
      case robot.CONF.MSGTYPE_VERIFYMSG:
        console.log('----好友添加认证----');
        let userKey = msg.RecommendInfo.UserName;
        let userNick = robot.Contact.getDisplayName(msg.RecommendInfo);
        let userTicket = msg.RecommendInfo.Ticket;
        let isInTask = false;
        fs.appendFileSync(
          `./src/log/${robot.user.NickName}.log`,
          `${new Date(Date.now()).toLocaleString()} ----收到好友${userNick}的添加请求----\r\n`
        );
        // 去重处理
        robot.task.some(item => {
          if (item.userKey === userKey) {
            isInTask = true;
            return true;
          } else {
            return false;
          }
        });
        if (!isInTask) {
          // 获取验证消息内容
          let paramsObj = {};
          let originalContent = msg.OriginalContent;
          originalContent.split(' ').forEach(item => {
            if (item.split('=').length === 2) {
              paramsObj[item.split('=')[0]] = item.split('=')[1];
            }
          });
          robot.task.push({
            retry: 0,
            userKey,
            userNick,
            content: paramsObj.content || '',
            userTicket
          });
        }
        break;
      default:
        break;
    }
  });
  robot.start();
}

// websocket事件
io.on('connection', currentSocket => {
  console.log('新连接开启');
  // 客户端请求绑定或登录机器人时响应
  currentSocket.on('bind-robot', data => {
    currentSocket.robot = new Robot();
    currentSocket.robot.Seq = null;
    console.log('get bind event');
    bind(currentSocket);
  });
  currentSocket.on('check-group', data => {
    let {
      groupName
    } = data;
    let robot = currentSocket.robot;
    console.log(data)
    console.log(robot &&
          robot.state !== robot.CONF.STATE.logout &&
          robot.syncStatus !== 'STOP');
    // 开始批量获取联系人
    async.whilst(
      function () {
        return robot &&
          robot.state !== robot.CONF.STATE.logout &&
          robot.syncStatus !== 'STOP'
      },
      function (callback) {
        console.log('in');
        let find = false;
        Object.keys(robot.contacts).some(key => {
          console.log(robot.Contact.getDisplayName(robot.contacts[key]))
          if (robot.Contact.getDisplayName(robot.contacts[key]) ===
            `[群] ${groupName}`) {
            robot.syncStatus = 'STOP'
            console.log('find')
            find = true
            return true;
          } else {
            console.log('not-find');
            return false;
          }
        })
        setTimeout(_ => {
          callback(null, find)
        }, 10000)
      },
      function (err, n) {
        console.log(robot.syncStatus)

        // 已找到指定群
        currentSocket.emit('find-group-in-robot')
      }
    )
  });
  currentSocket.on('exit-robot', data => {
    console.log('----退出机器人----');
    robots.some((robot, index) => {
      console.log(robot.robotId);
      console.log(data.robotId);
      if (robot.robotId && robot.robotId === data.robotId) {
        robot.stop();
        fs.appendFileSync(
          `./src/log/${robot.user.NickName}.log`,
          `${new Date(Date.now()).toLocaleString()} ----机器人${robot.user.NickName}退出登录----\r\n`
        );
        return true;
      } else {
        return false;
      }
    });
  });
  currentSocket.on('update-bind', data => {
    let robot = currentSocket.robot;
    console.log('----绑定----');
    robot.robotId = data.robotId;
    robot.groupName = data.groupName;
    robot.addMemberReply = data.addMemberReply;
    robot.groupId = data.groupId;
    robot.avatar = data.avatar;
    robot.groupQrcodeUrl = data.groupQrcodeUrl;
    robot.memberMaxNum = data.memberMaxNum;
    robot.invalidDate = data.invalidDate;
    // 信息绑定成功之后，可以开始拉人
    Object.keys(robot.contacts).forEach(key => {
      if (robot.contacts[key].getDisplayName() === `[群] ${robot.groupName}`) {
        let hasRobot = false;
        robot.groupKey = key;
        robot.taskStatus = 'RUNNING';
        console.log('----绑定成功，任务开启----');
        fs.appendFileSync(
          `./src/log/${robot.user.NickName}.log`,
          `${new Date(Date.now()).toLocaleString()} ----机器人${robot.user.NickName}成功绑定群${robot.groupName}----\r\n`
        );
        robot.groupId && pushMemberCount(robot, robot.contacts[key].MemberCount);
        robots.some(item => {
          if (item.robotId === robot.robotId) {
            hasRobot = true;
            return true;
          } else {
            return false;
          }
        });
        if (!hasRobot) {
          robots.push(robot);
        } else {
          robot.taskStatus = 'RUNNING';
        }
        currentSocket.emit('bind-success', {robotId: robot.robotId});
      }
    });
    // 如果遍历完，没有群联系人，则在联系人更新事件中更改状态
    if (robot.taskStatus === 'PAUSE') {
      robot.taskStatus = 'WAITING';
    }
  });
  currentSocket.on('clear-no-task-robot', function () {

    // 绑定流程没有到第三步骤，需要把机器人实例给清除
    if (this.robot) {
      this.robot.syncStatus = 'STOP'
      this.robot.stop();
      delete this.robot;
    }
  });
});

server.listen(3000, _ => {
  console.log('server listen on port 3000');
});

process.on('uncaughtException', err => {
  console.log(err);
  fs.appendFileSync(
    `./src/log/admin.log`,
    `${new Date(Date.now()).toLocaleString()} ---获取头像----\r\n`
  );
})
