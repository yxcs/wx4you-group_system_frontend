import {
  Button,
  Icon,
  Table,
  Row,
  Col,
  Form,
  Input,
  DatePicker,
  Popconfirm,
  Select,
  Tooltip
} from 'antd';
import React from 'react';
import moment from 'moment';
import {
  getGroupsLists,
  addGroup,
  editGroup,
  pageChange,
  bingRobot2Group,
  getGroupDetail,
  updateRobot4Group,
  getGroupTag,
  deleteGroup,
  getRobotsList
} from '../reducers/actionCreater';

import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import GroupEdit from './GroupEdit';
import RobotBind from './RobotBind';
import RobotOperate from './RobotOperate';

const { RangePicker } = DatePicker

class Groups extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      pagination: {
        current: 1,
        pageSize: 20
      },
      pageSize: 20,
      dataSource: [],
      loading: false,
      columns: [
        {
          title: '#',
          dataIndex: 'id',
          key: 'id',
          render: (v, r, i) => {
            return i+1;
          }
        }, {
          title: '群名称',
          key: 'name',
          dataIndex: 'name'
        }, {
          title: '群人数',
          key: 'memberNum',
          dataIndex: 'memberNum'
        }, {
          title: '人数上限',
          key: 'memberMaxNum',
          dataIndex: 'memberMaxNum'
        }, {
          title: '标签',
          key: 'tagName',
          dataIndex: 'tagName',
          render: (v, r, i) => {
            return !!v ? v : '--';
          }
        }, {
          title: '参加活动',
          dataIndex: 'activityInfo',
          key: 'activityInfo',
          render:(value, record) => {
            return !!value ? <Link to={'/activities/edit/gr/'+value.id}>{value.activityName}</Link> : '--';
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
            title: '操作',
            dataIndex: 'id',
            key: 'operation',
            render: (v, r, i) => {
              return (<div>
                <GroupEdit type='edit' groupId={v} current={this.state.pagination.current} pageSize={this.state.pagination.pageSize} />
                <RobotBind type='bind' groupId={v} groupName={r.name} />
                <RobotOperate type='operate' groupId={v} groupName={r.name} />
                <Popconfirm onConfirm={this.deleteGroup.bind(this, v)} title="确定删除该群？">
                  <Button disabled={r.activityInfo && !!r.activityInfo.id} style={{marginLeft: '10px'}} size='small' title='删除群' type='danger'>删除群</Button>
                </Popconfirm>
                    </div>)
            }
        }
      ],
      tagName: 'ALL',
      sGroupName: null,
      sCreatedAt: [],
      sUpdatedAt: [],
      groupTag: [],
      sActivityName: null,
    }
  }

  componentWillMount () {
    this.props.pageChange('groups')
    this.setState({ loading: true })
    this.props.getGroupsLists({page: 0, size: this.state.pageSize})
    this.props.getGroupTag();
  }

  componentWillReceiveProps (nextProps) {
    this.setState({
      pagination: {
        current: nextProps.groups.page+1,
        pageSize: this.state.pageSize,
        total: nextProps.groups.total
      },
      dataSource: nextProps.groups.data,
      loading: false,
      groupTag: nextProps.groupTag
    })
  }

  /* 群搜索 */

  handleTableChange = pagination => {
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

    if (!!this.state.sActivityName) {
      params.activityName = this.state.sActivityName;
      this.setState({
        tagName: 'ALL',
        sGroupName: null,
        sCreatedAt: [],
        sUpdatedAt: [],
      })
    } else {
      this.setState({ sActivityName: null })
      if (this.state.tagName !== 'ALL') {
        params.tagName = this.state.tagName;
      }

      if (!!this.state.sGroupName) {
        params.groupName = this.state.sGroupName;
      }

      if (this.state.sCreatedAt.length > 0) {
        params.createdAtBegin = this.state.sCreatedAt[0];
        params.createdAtEnd = this.state.sCreatedAt[1];
      }

      if (this.state.sUpdatedAt.length > 0) {
        params.updatedAtBegin = this.state.sUpdatedAt[0];
        params.updatedAtEnd = this.state.sUpdatedAt[1];
      }
    }

    this.props.getGroupsLists(params)
  }

  onGroupTagChange = (tagName) => {
    this.setState({ tagName, loading: true, sActivityName: null })
    let params = {
      page: 0,
      size: this.state.pageSize
    }

    if (tagName !== 'ALL') {
      params.tagName = tagName;
    }

    if (!!this.state.sGroupName) {
      params.groupName = this.state.sGroupName;
    }

    if (this.state.sCreatedAt.length > 0) {
      params.createdAtBegin = this.state.sCreatedAt[0];
      params.createdAtEnd = this.state.sCreatedAt[1];
    }

    if (this.state.sUpdatedAt.length > 0) {
      params.updatedAtBegin = this.state.sUpdatedAt[0];
      params.updatedAtEnd = this.state.sUpdatedAt[1];
    }

    this.props.getGroupsLists(params);
  }

  onSearchGroupNameChange = (e) => {
    this.setState({ sGroupName: e.target.value })
  }

  onGroupNameSearch = () => {
    this.setState({loading: true, sActivityName: null})
    let params = {
      page: 0,
      size: this.state.pageSize
    }

    if (this.state.tagName !== 'ALL') {
      params.tagName = this.state.tagName;
    }

    if (!!this.state.sGroupName) {
      params.groupName = this.state.sGroupName;
    }

    if (this.state.sCreatedAt.length > 0) {
      params.createdAtBegin = this.state.sCreatedAt[0];
      params.createdAtEnd = this.state.sCreatedAt[1];
    }

    if (this.state.sUpdatedAt.length > 0) {
      params.updatedAtBegin = this.state.sUpdatedAt[0];
      params.updatedAtEnd = this.state.sUpdatedAt[1];
    }

    this.props.getGroupsLists(params);
  }

  onCreateTimeChange = (timeString, time) => {

    if (!time[0]) {
      time = [];
      this.setState({ sCreatedAt: [], loading: true, sActivityName: null })
    } else {
      this.setState({ sCreatedAt: time, loading: true, sActivityName: null })
    }

    let params = {
      page: 0,
      size: this.state.pageSize
    }

    if (this.state.tagName !== 'ALL') {
      params.tagName = this.state.tagName;
    }

    if (!!this.state.sGroupName) {
      params.groupName = this.state.sGroupName;
    }

    if (time.length > 0) {
      params.createdAtBegin = time[0];
      params.createdAtEnd = time[1];
    }

    if (this.state.sUpdatedAt.length > 0) {
      params.updatedAtBegin = this.state.sUpdatedAt[0];
      params.updatedAtEnd = this.state.sUpdatedAt[1];
    }

    this.props.getGroupsLists(params);
  }

  onUpdateTimeChange = (timeString, time) => {
    if (!time[0]) {
      time = [];
      this.setState({ sUpdatedAt: [], loading: true, sActivityName: null })
    } else {
      this.setState({ sUpdatedAt: time, loading: true, sActivityName: null })
    }
    let params = {
      page: 0,
      size: this.state.pageSize
    }

    if (this.state.tagName !== 'ALL') {
      params.tagName = this.state.tagName;
    }

    if (!!this.state.sGroupName) {
      params.groupName = this.state.sGroupName;
    }

    if (this.state.sCreatedAt.length > 0) {
      params.createdAtBegin = this.state.sCreatedAt[0];
      params.createdAtEnd = this.state.sCreatedAt[1];
    }

    if (time.length > 0) {
      params.updatedAtBegin = time[0];
      params.updatedAtEnd = time[1];
    }

    this.props.getGroupsLists(params);
  }

  onClearParams = () => {
    this.setState({
      tagName: 'ALL',
      sGroupName: null,
      sCreatedAt: [],
      sUpdatedAt: [],
      loading: true,
      sActivityName: null
    })

    let params = {
      page: 0,
      size: this.state.pageSize
    }

    this.props.getGroupsLists(params);
  }

  onSearchActivityNameChange = e => {
    this.setState({ sActivityName: e.target.value })
  }

  onActivityNameSearch = () => {
    this.setState({
      tagName: 'ALL',
      sGroupName: null,
      sCreatedAt: [],
      sUpdatedAt: [],
      loading: true
    })

    let params = {
      page: 0,
      size: this.state.pageSize
    }

    if (!!this.state.sActivityName) {
      params.activityName = this.state.sActivityName
    }

    this.props.getGroupsLists(params);
  }

  /* 群删除 **/
  deleteGroup = id => {
    let groupId = +id | 0;
    let pagination = this.state.pagination;
    pagination.current--;
    this.props.deleteGroup({ groupId, pagination });
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
                  onChange={this.onGroupTagChange}
                  value={this.state.tagName}>
                    <Select.Option value="ALL">全部</Select.Option>
                    {
                      this.state.groupTag.map(item => {
                        return <Select.Option key={'key_'+item.id} value={item.name}>{item.name}</Select.Option>
                      })
                    }
                </Select>
              </Form.Item>
              <Form.Item label="名称">
                <Input.Search
                  size="small"
                  style={{ width: 120}}
                  onSearch={this.onGroupNameSearch}
                  onChange={this.onSearchGroupNameChange}
                  value={this.state.sGroupName}
                  placeholder="群名称"/>
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

              <Form.Item label="活动">
                <Input.Search
                  size="small"
                  style={{ width: 120}}
                  onSearch={this.onActivityNameSearch}
                  onChange={this.onSearchActivityNameChange}
                  value={this.state.sActivityName}
                  placeholder="活动名称"/>
                <Tooltip placement="top" title="以活动名获取群，单一条件搜索">
                  <Icon style={{cursor: 'pointer', marginLeft: '5px', fontSize: '14px', color: '#F7BA2A'}} type="question-circle" />
                </Tooltip>
              </Form.Item>

              <Form.Item>
                <Button type="default" size="small" onClick={this.onClearParams} >重置</Button>
              </Form.Item>
            </Form>
          </Col>
          <Col span={4} style={{textAlign: 'right'}}>
            <GroupEdit type='add' groupId={-1}  current={this.state.pagination.current} pageSize={this.state.pagination.pageSize} />
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
    },
    pageChange: (lists) => {
      dispatch(pageChange(lists))
    },
    bingRobot2Group: (lists) => {
      dispatch(bingRobot2Group(lists))
    },
    getGroupDetail: (lists) => {
      dispatch(getGroupDetail(lists))
    },
    updateRobot4Group: (lists) => {
      dispatch(updateRobot4Group(lists))
    },
    getGroupTag: (lists) => {
      dispatch(getGroupTag(lists))
    },
    deleteGroup: (lists) => {
      dispatch(deleteGroup(lists))
    },
    getRobotsList: (lists) => {
      dispatch(getRobotsList(lists))
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Groups);