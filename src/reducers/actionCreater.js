import types from './types.js';

export const pageChange = (payload) => {
  return {
    type: types.PAGE_CHANGE,
    payload
  }
}

export const myTestSaga = (payload) => {
  return {
    type: types.TEST_SAGA,
    payload
  }
}

export const getActivitiesLists = (payload) => {
  return {
    type: types.GET_ACTIVITIES,
    payload
  }
}

export const getGroupsLists = (payload) => {
  return {
    type: types.GET_GROUPS,
    payload
  }
}

export const addActivity = (payload) => {
  return {
    type: types.ADD_ACTIVITY,
    payload
  }
}

export const editActivity = (payload) => {
  return {
    type: types.EDIT_ACTIVITY,
    payload
  }
}

export const getActivityById = (payload) => {
  return {
    type: types.GET_ACTIVITY_BY_ID,
    payload
  }
}

export const addGroup = (payload) => {
  return {
    type: types.ADD_GROUP,
    payload
  }
}

export const editGroup = (payload) => {
  return {
    type: types.EDIT_GROUP,
    payload
  }
}

export const deleteGroup = (payload) => {
  return {
    type: types.DELETE_GROUP,
    payload
  }
}

export const socketConnect = (payload) => {
  return {
    type: types.SOCKET_CONNECT,
    payload
  }
}

export const bingRobot2Group = (payload) => {
  return {
    type: types.BIND_ROBOT_2_GROUP,
    payload
  }
}

export const getGroupDetail = (payload) => {
  return {
    type: types.GET_GROUP_DETAIL,
    payload
  }
}

export const updateRobot4Group = (payload) => {
  return {
    type: types.UPDATE_ROBOT_4_GROUP,
    payload
  }
}

export const getRobotsList = (payload) => {
  return {
    type: types.GET_ROBOTS_LIST,
    payload
  }
}

export const saveRobot = (payload) => {
  return {
    type: types.SAVE_ROBOT,
    payload
  }
}

export const getActivityTag = (payload) => {
  return {
    type: types.GET_ACTIVITY_TAG,
    payload
  }
}

export const getGroupTag = (payload) => {
  return {
    type: types.GET_GROUP_TAG,
    payload
  }
}

export const getUnbindGroup = (payload) => {
  return {
    type: types.GET_UNBIND_GROUP,
    payload
  }
}

export const updateRobot = (payload) => {
  return {
    type: types.UPDATE_ROBOT,
    payload
  }
}