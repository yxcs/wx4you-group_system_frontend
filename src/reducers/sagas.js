import { take, fork, put, call, takeLatest } from 'redux-saga/effects';
import types from './types';
import * as services from '../services/apis';
import { Message } from 'antd';
import io from '../../dependencies/node_modules/socket.io-client';
import * as config from '../config.js';

function *pageChange () {
  while(true) {
    try {
      let action = yield take(types.PAGE_CHANGE)
      yield put({
        type: types.PAGE_CHANGE_SUCCEED,
        payload: action.payload
      })
    } catch (error) {
      Message.error('服务器异常，请稍后重试！')
      console.log(error)
      yield put({
        type: types.PAGE_CHANGE_ERROR
      })
    }
  }
}

function *getActivitiesLists () {
  while(true) {
    try {
      let action = yield take(types.GET_ACTIVITIES)
      let page = action.payload.page
      let res = yield call(services.getAllActivity, action.payload)
      if (res.data.status === 1) {
        // Message.success('获取活动数据成功');
        yield put({
          type: types.GET_ACTIVITIES_SUCCEED,
          payload: { data: res.data.data.data, total: res.data.data.totalItem, page }
        })
      } else {
        Message.error(res.data.details || res.data.msg)
        yield put({
          type: types.GET_ACTIVITIES_ERROR
        })
      }
    } catch (error) {
      Message.error('服务器异常，请稍后重试！')
      console.log(error)
      yield put({
        type: types.GET_ACTIVITIES_ERROR
      })
    }
  }
}

function *getGroupsLists () {
  while(true) {
    try {
      let action = yield take(types.GET_GROUPS)
      let page = action.payload.page
      let res = yield call(services.getAllGroups, action.payload)
      if (res.data.status === 1) {
        // Message.success('获取活动数据成功');
        yield put({
          type: types.GET_GROUPS_SUCCEED,
          payload: { data: res.data.data.data, total: res.data.data.totalItem, page }
        })
      } else {
        Message.error(res.data.details || res.data.msg)
        yield put({
          type: types.GET_GROUPS_ERROR
        })
      }
    } catch (error) {
      Message.error('服务器异常，请稍后重试！')
      console.log(error)
      yield put({
        type: types.GET_GROUPS_ERROR
      })
    }
  }
}

function *addActivity () {
  while(true) {
    try {
      let action = yield take(types.ADD_ACTIVITY)
      let res = yield call(services.addActivity, action.payload)
      if (res.data.status === 1) {
        // Message.success('获取活动数据成功');
        yield put({
          type: types.ADD_ACTIVITY_SUCCEED,
          payload: { data: res.data.data.data }
        })
      } else {
        Message.error(res.data.details || res.data.msg)
        yield put({
          type: types.ADD_ACTIVITY_ERROR
        })
      }
    } catch (error) {
      Message.error('服务器异常，请稍后重试！')
      console.log(error)
      yield put({
        type: types.ADD_ACTIVITY_ERROR
      })
    }
  }
}

function *getActivityById () {
  while(true) {
    try {
      let action = yield take(types.GET_ACTIVITY_BY_ID)
      if (!!action.payload) {
        let res = yield call(services.getActivityById, action.payload)
        if (res.data.status === 1) {
          // Message.success('获取活动数据成功');
          yield put({
            type: types.GET_ACTIVITY_BY_ID_SUCCEED,
            payload: { data: res.data.data }
          })
        } else {
          Message.error(res.data.details || res.data.msg)
          yield put({
            type: types.GET_ACTIVITY_BY_ID_ERROR
          })
        }
      } else {
        yield put({
          type: types.GET_ACTIVITY_BY_ID_SUCCEED,
          payload: {
            activityName: '',
            activityDesc: '',
            lastPullNum: '',
            pullGroupGuide: '',
            tagName: '',
            documentType: 'YIYOU'
          }
        })
      }
    } catch (error) {
      Message.error('服务器异常，请稍后重试！')
      console.log(error)
      yield put({
        type: types.GET_ACTIVITY_BY_ID_ERROR
      })
    }
  }
}

function *addGroup () {
  while(true) {
    try {
      let action = yield take(types.ADD_GROUP)
      let res = yield call(services.addGroup, action.payload.params)
      if (res.data.status === 1) {
        Message.success('添加群成功')
        yield put({
          type: types.GET_GROUPS,
          payload: { page: action.payload.pagination.current, size: action.payload.pagination.pageSize }
        })
      } else {
        Message.error(res.data.details || res.data.msg)
        yield put({
          type: types.ADD_GROUP_ERROR
        })
      }
    } catch (error) {
      Message.error('服务器异常，请稍后重试！')
      console.log(error)
      yield put({
        type: types.ADD_GROUP_ERROR
      })
    }
  }
}

function *editGroup () {
  while(true) {
    try {
      let action = yield take(types.EDIT_GROUP)
      let res = yield call(services.updateGroup, action.payload.params)
      if (res.data.status === 1) {
        if (action.payload.pagination.current === -1) {
          Message.success('群信息更新成功!');
        } else {
          yield put({
            type: types.GET_GROUPS,
            payload: { page: action.payload.pagination.current, size: action.payload.pagination.pageSize }
          })
          Message.success('群信息更新成功!');
        }
      } else {
        Message.error(res.data.details || res.data.msg)
        yield put({
          type: types.EDIT_GROUP_ERROR
        })
      }
    } catch (error) {
      Message.error('服务器异常，请稍后重试！')
      console.log(error)
      yield put({
        type: types.EDIT_GROUP_ERROR
      })
    }
  }
}

function *deleteGroup () {
  while(true) {
    try {
      let action = yield take(types.DELETE_GROUP)
      let res = yield call(services.deleteGroup, action.payload.groupId)
      if (res.data.status === 1) {
        Message.success('该群已成功删除')
        yield put({
          type: types.GET_GROUPS,
          payload: { page: action.payload.pagination.current, size: action.payload.pagination.pageSize }
        })
      } else {
        Message.error(res.data.details || res.data.msg)
        yield put({
          type: types.DELETE_GROUP_ERROR
        })
      }
    } catch (error) {
      Message.error('服务器异常，请稍后重试！')
      console.log(error)
      yield put({
        type: types.DELETE_GROUP_ERROR
      })
    }
  }
}

function *socketConnect () {
  while(true) {
    try {
      yield take(types.SOCKET_CONNECT)
      // let socket = io.connect(`${config.formalUrl}:${config.formalPort}`);
      // let socket = io(`${location.protocol}//${location.hostname}:3000`);
      let socket = io(`${location.protocol}//${location.hostname}`)
      yield put({
        type: types.SOCKET_CONNECT_SUCCEED,
        payload: socket
      })
    } catch (error) {
      Message.error('scoket连接失败')
      console.log(error)
      yield put({
        type: types.SOCKET_CONNECT_ERROR
      })
    }
  }
}

function *bingRobot2Group () {
  while(true) {
    try {
      let action = yield take(types.BIND_ROBOT_2_GROUP)
      let params = action.payload;
      if (params.editType === 'bind') {
        let res = yield call(services.uploadAvatar, action.payload.avatar)
        params.avatar = res;
        // params.avatar = res.url | res;
        let addParams = {
          wxId: params.wxId,
          wxAccount: params.wxAccount,
          name: params.name,
          avatar: params.avatar,
          qrcodeUrl: params.qrcodeUrl,
          addMemberReply: params.addMemberReply
        };

        let addRes =  yield call(services.addRobot, addParams)
        if (addRes.data.status === 1) {
          params.robotId = addRes.data.data.id;
          // 这里发socket event, 告知node更新robotid

          params.socket.emit('update-bind', {
            robotId: params.robotId,
            groupId: params.bindGroupId,
            avatar: params.avatar,
            groupAvatar: params.currentGroup.avatar,
            memberMaxNum: params.currentGroup.memberMaxNum,
            groupQrcodeUrl: params.currentGroup.qrcodeUrl,
            invalidDate: params.currentGroup.invalidDate,
            groupName: params.groupName,
            addMemberReply: params.addMemberReply,
            tagName: params.currentGroup.tagName
          });

          let bindParams = {
            robotId: params.robotId,
            groupId: params.bindGroupId,
            onedayMaxPullNum: params.onedayMaxPullNum,
            enabled: true,
            bind: true
          };

          let bindRes = yield call(services.bindRobot, bindParams);
          if (bindRes.data.status === 1) {
              // viewRobot(bindParams.groupId);
              Message.success('群机器人绑定成功', 3)
          } else {
            Message.error(bindRes.data.details, 10);
          }
        }
      } else {
        params.socket.emit('update-bind', {
          robotId: params.robotId,
          groupId: params.bindGroupId,
          avatar: params.avatar,
          groupAvatar: params.currentGroup.avatar,
          memberMaxNum: params.currentGroup.memberMaxNum,
          groupQrcodeUrl: params.currentGroup.qrcodeUrl,
          invalidDate: params.currentGroup.invalidDate,
          groupName: params.groupName,
          addMemberReply: params.addMemberReply
        });

        let bindParams = {
          robotId: params.robotId,
          groupId: params.bindGroupId,
          onedayMaxPullNum: params.onedayMaxPullNum,
          enabled: true,
          bind: true
        };

        let bindRes = yield call(services.bindRobot, bindParams);
        if (bindRes.data.status === 1) {
            // viewRobot(bindParams.groupId);
            Message.success('群机器人绑定成功', 3)
        } else {
          Message.error(bindRes.data.details, 10);
        }
      }
    } catch (error) {
      Message.error('服务器异常，请稍后重试！')
      console.log(error)
      yield put({
        type: types.GET_GROUP_DETAIL_ERROR
      })
    }
  }
}

function *getGroupDetail () {
  while(true) {
    try {
      let action = yield take(types.GET_GROUP_DETAIL)
      let res = yield call(services.getGroupDetail, action.payload)
      if (res.data.status === 1) {
        let robots = res.data.data.robotList || [];
        let robotRes = robots.length > 0 ? yield call(services.getRobotsStatus, {clientRobots: robots}) : {data: {result: []} };

        let result = robotRes.data.result;
        robots.forEach((robot, index) => {
          robots[index].status = 'offline';
          result.forEach(item => {
            if (item.id === robot.id) {
              robots[index].status = 'online';
            }
          });
        });

        res.data.data.robotList = robots;

        yield put({
          type: types.GET_GROUP_DETAIL_SUCCEED,
          payload: res.data.data
        })
      } else {
        Message.error(res.data.details || res.data.msg)
        yield put({
          type: types.GET_GROUP_DETAIL_ERROR
        })
      }
    } catch (error) {
      Message.error('服务器异常，请稍后重试！')
      console.log(error)
      yield put({
        type: types.GET_GROUP_DETAIL_ERROR
      })
    }
  }
}

function *updateRobot4Group () {
  while(true) {
    try {
      let action = yield take(types.UPDATE_ROBOT_4_GROUP)
      let addParams = {
        wxId: action.payload.wxId,
        wxAccount: action.payload.wxAccount,
        name: action.payload.name,
        avatar: action.payload.avatar,
        qrcodeUrl: action.payload.qrcodeUrl,
        bind: action.payload.bind,
        addMemberReply: action.payload.addMemberReply,
        onedayMaxPullNum: action.payload.onedayMaxPullNum
      }

      let addRes =  yield call(services.addRobot, addParams)
      if (addRes.data.status === 1) {
        addParams.robotId = addRes.data.data.id;

        let bindParams = {
          robotId: addParams.robotId,
          groupId: action.payload.bindGroupId,
          onedayMaxPullNum: addParams.onedayMaxPullNum,
          addMemberReply: addParams.addMemberReply,
          enabled: true,
          bind: true
        };

        if (!addParams.bind) {
          bindParams.bind = false;
        }

        let bindRes = yield call(services.bindRobot, bindParams);
        if (true) {
            let bindRes = yield call(services.updateAddReply, {
              robotId: addParams.robotId,
              addMemberReply: addParams.addMemberReply
            });

            if (bindRes.data.data) {
              yield put({
                type: types.GET_GROUP_DETAIL,
                payload: action.payload.bindGroupId
              })
            }

            Message.success('群机器人更新成功', 3)
        } else {
          Message.error(bindRes.data.details, 10);
        }
      }
    } catch (error) {
      Message.error('服务器异常，请稍后重试！')
      console.log(error)
      yield put({
        type: types.GET_GROUP_DETAIL_ERROR
      })
    }
  }
}

function *getRobotsList () {
  while(true) {
    try {
      let action = yield take(types.GET_ROBOTS_LIST)
      let page = action.payload.page
      let res = yield call(services.getRobotsList, action.payload)
      if (res.data.status === 1) {
         let robotData = res.data.data.data;
         let robotRes = yield call(services.getRobotsStatus, {clientRobots: robotData})
         let robotStatus = robotRes.data.result;
         robotData = robotData.map(robot => {
          robot.status = 'offline';
          robotStatus.forEach(item => {
            if (robot.id === item.id) robot.status = 'online'
          })
          return robot;
         })

        yield put({
          type: types.GET_ROBOTS_LIST_SUCCEED,
          payload: { data: robotData, total: res.data.data.totalItem, page }
        })
      } else {
        Message.error(res.data.details || res.data.msg)
        yield put({
          type: types.GET_ROBOTS_LIST_ERROR
        })
      }
    } catch (error) {
      Message.error('服务器异常，请稍后重试！')
      console.log(error)
      yield put({
        type: types.GET_ROBOTS_LIST_ERROR
      })
    }
  }
}

function *saveRobot () {
  while(true) {
    try {
      let action = yield take(types.SAVE_ROBOT)
      let params = action.payload.params;
      let robotList = action.payload.robotList;
      let avatarRes = yield call(services.uploadAvatar, params.avatar)
      params.avatar = avatarRes;
      let res = yield call(services.addRobot, params)
      if (res.data.status === 1) {
        Message.success('机器人添加成功')
        yield put({
          type: types.GET_ROBOTS_LIST,
          payload: robotList
        })
      } else {
        Message.error(res.data.details || res.data.msg)
        yield put({
          type: types.SAVE_ROBOT_ERROR
        })
      }
    } catch (error) {
      Message.error('服务器异常，请稍后重试！')
      console.log(error)
      yield put({
        type: types.SAVE_ROBOT_ERROR
      })
    }
  }
}

function *getActivityTag () {
  while(true) {
    try {
      yield take(types.GET_ACTIVITY_TAG)
      let res = yield call(services.getActivityTag)
      if (res.data.status === 1) {
        yield put({
          type: types.GET_ACTIVITY_TAG_SUCCEED,
          payload: res.data.data
        })
      } else {
        Message.error(res.data.details || res.data.msg)
        yield put({
          type: types.GET_ACTIVITY_TAG_ERROR
        })
      }
    } catch (error) {
      Message.error('服务器异常，请稍后重试！')
      console.log(error)
      yield put({
        type: types.GET_ACTIVITY_TAG_ERROR
      })
    }
  }
}

function *getGroupTag () {
  while(true) {
    try {
      yield take(types.GET_GROUP_TAG)
      let res = yield call(services.getGroupTag)
      if (res.data.status === 1) {
        yield put({
          type: types.GET_GROUP_TAG_SUCCEED,
          payload: res.data.data
        })
      } else {
        Message.error(res.data.details || res.data.msg)
        yield put({
          type: types.GET_GROUP_TAG_ERROR
        })
      }
    } catch (error) {
      Message.error('服务器异常，请稍后重试！')
      console.log(error)
      yield put({
        type: types.GET_GROUP_TAG_ERROR
      })
    }
  }
}

function *getUnbindGroup () {
  while(true) {
    try {
      let action = yield take(types.GET_UNBIND_GROUP)
      let page = action.payload.page
      let res = yield call(services.getUnbindGroup, action.payload)
      if (res.data.status === 1) {
        yield put({
          type: types.GET_UNBIND_GROUP_SUCCEED,
          payload: { data: res.data.data.data, total: res.data.data.totalItem, page }
        })
      } else {
        Message.error(res.data.details || res.data.msg)
        yield put({
          type: types.GET_UNBIND_GROUP_ERROR
        })
      }
    } catch (error) {
      Message.error('服务器异常，请稍后重试！')
      console.log(error)
      yield put({
        type: types.GET_UNBIND_GROUP_ERROR
      })
    }
  }
}

function *updateRobot () {
  while(true) {
    try {
      let action = yield take(types.UPDATE_ROBOT)
      let params = action.payload.params;
      let robotList = action.payload.robotList;

      let res = yield call(services.addRobot, params)
      if (res.data.status === 1) {
        Message.success('机器人信息更新成功')
        yield put({
          type: types.GET_ROBOTS_LIST,
          payload: robotList
        })
      } else {
        Message.error(res.data.details || res.data.msg)
        yield put({
          type: types.UPDATE_ROBOTP_ERROR
        })
      }
    } catch (error) {
      Message.error('服务器异常，请稍后重试！')
      console.log(error)
      yield put({
        type: types.UPDATE_ROBOTP_ERROR
      })
    }
  }
}

export default function * () {
  yield fork(getActivitiesLists);
  yield fork(getGroupsLists);
  yield fork(addActivity);
  yield fork(getActivityById);
  yield fork(addGroup);
  yield fork(editGroup);
  yield fork(deleteGroup);
  yield fork(pageChange);
  yield fork(socketConnect);
  yield fork(bingRobot2Group);
  yield fork(getGroupDetail);
  yield fork(updateRobot4Group);
  yield fork(getRobotsList);
  yield fork(saveRobot);
  yield fork(getActivityTag);
  yield fork(getGroupTag);
  yield fork(getUnbindGroup);
  yield fork(updateRobot);
}