import types from './types'
import { combineReducers } from 'redux'
import { Map, List } from 'immutable'

const page = (state = 'groups', action) => {
  switch (action.type) {
    case types.PAGE_CHANGE_SUCCEED:
      return action.payload
    case types.PAGE_CHANGE_ERROR:
      return state
    default:
      return state
  }
}

const tagLists = (state = {}, action) => {
  switch (action.type) {
    case types.TEST_SAGA_SUCCEED:
      return action.payload.data
    case types.TEST_SAGA_ERROR:
      return state
    default:
      return state
  }
}

const activities = (state = {}, action) => {
  switch (action.type) {
    case types.GET_ACTIVITIES_SUCCEED:
      return action.payload
    case types.GET_ACTIVITIES_ERROR:
      return state
    default:
      return state
  }
}

const groups = (state = {data: []}, action) => {
  switch (action.type) {
    case types.GET_GROUPS_SUCCEED:
      return action.payload
    case types.GET_GROUPS_ERROR:
      return state
    default:
      return state
  }
}

const activityDetail = (state = {activityName: '',
  activityDesc: '',
  lastPullNum: '',
  pullGroupGuide: '',
  tagName: '',
  documentType: 'YIYOU'}, action) => {
  switch (action.type) {
    case types.GET_ACTIVITY_BY_ID_SUCCEED:
      return action.payload
    case types.GET_ACTIVITY_BY_ID_ERROR:
      return state
    default:
      return state
  }
}

const socket = (state = {}, action) => {
  switch (action.type) {
    case types.SOCKET_CONNECT_SUCCEED:
      return action.payload
    case types.SOCKET_CONNECT_ERROR:
      return state
   default:
      return state
  }
}

const groupDetail = (state = {robotList: []}, action) => {
  switch (action.type) {
    case types.GET_GROUP_DETAIL_SUCCEED:
      return action.payload
    case types.GET_GROUP_DETAIL_ERROR:
      return state
   default:
      return state
  }
}

const robots = (state = {data: [], page: 0, total: 0}, action) => {
  switch (action.type) {
    case types.GET_ROBOTS_LIST_SUCCEED:
      return action.payload
    case types.GET_ROBOTS_LIST_ERROR:
      return state
    default:
      return state
  }
}

const activityTag = (state = [], action) => {
  switch (action.type) {
    case types.GET_ACTIVITY_TAG_SUCCEED:
      return action.payload
    case types.GET_ACTIVITY_TAG_ERROR:
      return state
    default:
      return state
  }
}

const groupTag = (state = [], action) => {
  switch (action.type) {
    case types.GET_GROUP_TAG_SUCCEED:
      return action.payload
    case types.GET_GROUP_TAG_ERROR:
      return state
    default:
      return state
  }
}

const unindGroups = (state = {data: []}, action) => {
  switch (action.type) {
    case types.GET_UNBIND_GROUP_SUCCEED:
      return action.payload
    case types.GET_UNBIND_GROUP_ERROR:
      return state
    default:
      return state
  }
}

const reducer = combineReducers({
  page,
  tagLists,
  activities,
  groups,
  activityDetail,
  socket,
  groupDetail,
  robots,
  activityTag,
  groupTag,
  unindGroups,
})

export default reducer 