import React from 'react';
import { Row, Col, Select, Form, Icon, Input, Button, Tag, Table, Modal, Switch, message, Radio } from 'antd';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

const Option = Select.Option;
const RadioGroup = Radio.Group;

import { addActivity, editActivity, getActivityById as getActivitYDetail } from '../services/apis';
import { 
  getGroupsLists, 
  getActivityById, 
  pageChange, 
  getGroupTag, 
  getActivityTag,
  getUnbindGroup 
} from '../reducers/actionCreater';

// import moment from 'moment';

class ActivityEdit extends React.Component {
    constructor (props) {
      super(props);
      const activityId = this.props.match.params.id || -1;
      this.state = {
        activityId,
        data: {},
        btnLoading: false,
        visible: false,
        groupColumns: [
          {
            title: '#',
            dataIndex: 'id',
            key: 'index',
            render: (v, r, i) => {
             return i+1;
            }
          }, {
            title: '所有群',
            dataIndex: 'name',
            key: 'name'
          }, {
            title: '启用',
            dataIndex: 'enabled',
            key: 'enabled',
            render: (value, record) => {
              return (
                <Switch
                  disabled={this.state.pageType === 'gr'}
                  onChange={this.onSwitchChange.bind(this, record.id)}
                  defaultChecked={!!value}
                  checkedChildren={<Icon type="check" />}
                  unCheckedChildren={<Icon type="cross" />}/>
              );
            }
          }
        ],
        groupColumnsSelect: [
          {
            title: '#',
            dataIndex: 'id',
            key: 'index',
            render: (v, r, i) => {
             return i+1;
            }
          }, {
            title: '所有群',
            dataIndex: 'name',
            key: 'name'
          }, {
            title: '启用',
            dataIndex: 'enabled',
            key: 'enabled',
            render: (value, record) => {
              return (
                <Switch
                  disabled={this.state.pageType === 'gr'}
                  onChange={this.onSwitchChange.bind(this, record.id)}
                  defaultChecked={!!value}
                  checkedChildren={<Icon type="check" />}
                  unCheckedChildren={<Icon type="cross" />}/>
              );
            }
          }, {
            title: '操作',
            dataIndex: 'id',
            key: 'cancel_id',
            render: (value, record) => {
              return (
                <Button
                  disabled={this.state.pageType === 'gr'}
                  size="small" 
                  type="danger"
                  onClick={this.onCancelSelect.bind(this, value)}>删除</Button>
              );
            }
          }
        ],
        dataSource: [],
        pagination: {
          current: 1,
          pageSize: 10
        },
        pageSize: 10,
        selectKey: [],
        groupsLists: [],
        groupsList: [],
        activityDetail: {
          activityName: '',
          activityDesc: '',
          lastPullNum: 0,
          pullGroupGuide: '',
          tagName: '',
          documentType: 'YIYOU',      // YIYOU 已加人, JUQUNMAN  距群满
          addGroupType: 'RANDOM',     // 加群顺序 SEQUENCE:顺序，RANDOM:随机,
          changeGroupType: 'MEMBERNUM',   //判断群满条件  (MEMBERNUM:按入群人数，SCANNUM:按扫描人数)
          maxScanNum: null,
        },
        groupTag: [],
        activityTag: [],
        tagName: 'ALL',
        sGroupName: null,
        sCreatedAt: [],
        sUpdatedAt: [],
        tagNameOptions: [],
        selectGroupKey: [],
        pageType: 'ac',             // ac 编辑 ，  gr  查看,
        pageTypeStatic: 'ac',
        refreshOk: false
      }
    }

    componentWillMount() {
      if (this.props.match.params.type === 'ac') {
        this.setState({ pageType: 'ac', pageTypeStatic: 'ac' })
      } else {
        this.setState({ pageType: 'gr', pageTypeStatic: 'gr' })
      }
      const activityId = this.state.activityId;
      if (activityId > 0) this.props.pageChange('activitiesEdit')
      else this.props.pageChange('activitiesAdd')

      this.props.getGroupTag()
      this.props.getActivityTag()

      if (activityId > 0) this.props.getActivityById(activityId);
      else this.props.getActivityById()
      this.getSelectGroups(activityId)
    }

    componentWillReceiveProps(nextProps) {
      let activityDetail = this.state.activityDetail
      let dataSource = nextProps.unindGroups.data;
      let data = nextProps.activityDetail.data
      let groupInfoList = !!data ? data.groupInfoList : [];
      if (data !== undefined) {
        activityDetail = {
          activityName: data.activityName,
          activityDesc: data.activityDesc,
          lastPullNum: data.lastPullNum,
          pullGroupGuide: data.pullGroupGuide,
          tagName: data.tagName,
          documentType: data.documentType,
          addGroupType: data.addGroupType,
          changeGroupType: data.changeGroupType,
          maxScanNum: data.maxScanNum,
        }
      }

      dataSource = dataSource.map(item => {
        item.enabled = 1;
        groupInfoList.forEach(item1 => {
          if (item.id === item1.id && !item1.enabled) item.enabled = 0;
        })
        return item;
      })

      let selectGroupKey = [];
      groupInfoList.forEach(group => {
        selectGroupKey.push(group.id)
      })

      let tagNameOptions = this.state.tagNameOptions;
      tagNameOptions = nextProps.activityTag.map(tag => {
        return <Option key={tag.name}>{tag.name}</Option>
      });

      this.setState({
        pagination: {
          current: nextProps.unindGroups.page+1,
          pageSize: this.state.pageSize,
          total: nextProps.unindGroups.total
        },
        dataSource,
        loading: false,
        data,
        activityDetail,
        groupTag: nextProps.groupTag,
        activityTag: nextProps.activityTag,
        selectGroupKey,
        tagNameOptions
      })
    }

    getSelectGroups = id => {
      const activityId = +id;
      if (activityId > 0) {
        getActivitYDetail(activityId).then(data => {
          let groupsLists = this.state.groupsLists;
          if (data.data.status === 1) {
            const groupInfoList = data.data.data.groupInfoList;
            if (!!groupInfoList && groupInfoList.length > 0) {
              groupsLists = groupInfoList;
            }
          } else {
            groupsLists = [];
          }
          this.setState({ groupsLists })
        })
      }
    }

    onDeleteGrops = id => {
      const groupId = +id;
      var groupsLists = this.state.groupsLists;
      groupsLists = groupsLists.filter(item => {
        return item.id !== groupId;
      })
      this.setState({ groupsLists })
    }

    onShowModel = () => {
      var groupsLists = this.state.groupsLists;
      var groupsList = this.state.groupsList;
      var selectKey = this.state.selectKey;
      groupsLists.forEach(item => {
        selectKey.push(item.id)
        groupsList.push(item)
      })
      this.setState({ visible: true, selectKey, groupsList })
      var params = {
        page: 0, 
        size: 10
      }
      if (this.state.activityId > 0) {
        params.activityId = this.state.activityId
      }
      this.props.getUnbindGroup(params)
    }

    onModelCancel = () => {
      this.setState({ visible: false, selectKey: [], groupsList: [] })
    }

    onModelOK = () => {
      var groupsLists = this.state.groupsLists;
      var groupsList = this.state.groupsList;
      groupsLists = groupsList;

      let selectGroupKey = [];
      groupsLists.forEach(group => {
        selectGroupKey.push(group.id)
      })

      this.setState({ 
        groupsLists, 
        visible: false, 
        selectKey: [], 
        groupsList: [], 
        selectGroupKey 
      })
    }

    onSelectChange = (selectedRowKeys, selectedRows) => {
      this.setState({ selectKey: selectedRowKeys })
    }

    onSelectRow = (record, selected, selectedRows) => {
      let groupsList = this.state.groupsList;
      if (selected) {
        groupsList.push(record)
      } else {
        groupsList = groupsList.filter(item => {
          return record.id !== item.id
        })
      }
      this.setState({ groupsList })
    }

    onSelectAllRow = (selected, selectedRows, changeRows) => {
      let groupsList = this.state.groupsList;
      if (selected) {
        groupsList.push(...changeRows)
      } else {
        groupsList = groupsList.filter(item => {
          let flag = true;
          changeRows.forEach(item1 => {
            if (item.id === item1.id) flag = false;
          })
          return flag;
        })
      }
      this.setState({ groupsList })
    }

    onSwitchChange = (id, switched) => {
      let dataSource = this.state.dataSource;
      let groupsLists = this.state.groupsLists;

      dataSource = dataSource.map(item => {
        if (item.id === id) {
          if (switched) item.enabled = 1;
          if (!switched) item.enabled = 0;
        }
        return item;
      })

      groupsLists = groupsLists.map(item => {
        if (item.id === id) {
          if (switched) item.enabled = 1;
          else item.enabled = 0;
        }
        return item;
      })

      this.setState({ groupsLists, dataSource })
    }

    handleTableChange = (pagination) => {
      const pager = this.state.pagination;
      pager.current = pagination.current;
      this.setState({
        pagination: pager,
        loading: true
      });
      pagination.current--;
      let params = {
        page: pagination.current,
        size: 10
      };
      if (this.state.activityId > 0) {
        params.activityId = this.state.activityId
      }
      this.props.getUnbindGroup(params);
    };

    onActivityNameChange = e => {
      const value = e.target.value;
      let activityDetail = this.state.activityDetail;
      activityDetail.activityName = value;
      this.setState({ activityDetail })
    }

    onActivityTagNameChange = e => {
      const value = e.target.value;
      let activityDetail = this.state.activityDetail;
      activityDetail.tagName = value;
      this.setState({ activityDetail })
    }

    onActivityTagChange = value => {
      let tagNameOptions = [];
      let tags = this.state.activityTag;
      let activityDetail = this.state.activityDetail;
      if (!value) {
        tagNameOptions = tags.map(tag => {
          return <Option key={tag.name}>{tag.name}</Option>
        });
      } else {
        tags = tags.filter(tag => {
          return (tag.name).indexOf(value) >= 0;
        })
        tagNameOptions = tags.map(tag => {
          return <Option key={tag.name}>{tag.name}</Option>
        });
      }
      activityDetail.tagName = value;
      this.setState({ tagNameOptions, activityDetail })
    }

    onTagTypeChange = e => {
      this.setState({ activityTagType: e.target.value })
    }

    onActivityDescChange = e => {
      const value = e.target.value;
      let activityDetail = this.state.activityDetail;
      activityDetail.activityDesc = value;
      this.setState({ activityDetail })
    }

    onTextTypeChange = value => {
      let activityDetail = this.state.activityDetail;
      activityDetail.documentType = value;
      this.setState({ activityDetail })
    }

    onLastPullNumChange = e => {
      const value = e.target.value;
      let activityDetail = this.state.activityDetail;
      activityDetail.lastPullNum = value;
      this.setState({ activityDetail })
    }

    onPullGroupGuideChange = e => {
      const value = e.target.value;
      let activityDetail = this.state.activityDetail;
      activityDetail.pullGroupGuide = value;
      this.setState({ activityDetail })
    }

    onAddGroupTypeChange = e => {
      const value = e.target.value;
      let activityDetail = this.state.activityDetail;
      activityDetail.addGroupType = value;
      this.setState({ activityDetail })
    }

    onGroupFullTypeChange = e => {
      const value = e.target.value;
      let activityDetail = this.state.activityDetail;
      activityDetail.changeGroupType = value;
      this.setState({ activityDetail })
    }

    onGroupFullNumChange = e => {
      const value = e.target.value;
      let activityDetail = this.state.activityDetail;
      activityDetail.maxScanNum = value;
      this.setState({ activityDetail })
    }

    handleSubmit = () => {
      this.setState({ btnLoading: true })
      let activityId = this.state.activityId;
      let groupsLists = this.state.groupsLists;
      let initData = this.state.data;

      let {activityDetail} = this.state;
      if(activityId > 0) {
        activityDetail.id = +activityId;
      }
      let paramsEdit = {
        bindInfos: []
      };

      let text = (activityId > 0) ? '更新' : '添加';

      // if(groupsLists.length === 0){
      //   message.error("绑定群不可为空!");
      //   this.setState({ btnLoading: false})
      //   return
      // }

      if (activityDetail.changeGroupType === 'SCANNUM' && 
          (parseInt(activityDetail.maxScanNum, 10) !== parseInt(activityDetail.maxScanNum, 10) ||
          parseInt(activityDetail.maxScanNum, 10) <= 0 ||
          !activityDetail.maxScanNum)) {

          message.warning('群满人数有误，人数应大于0！')
          this.setState({ btnLoading: false})
          return
      }

      if (activityDetail.changeGroupType === 'MEMBERNUM') {
        activityDetail.maxScanNum = null;
      }

      if (!activityDetail.tagName) delete activityDetail.tagName;
      if (activityDetail.documentType === 'YIYOU') activityDetail.lastPullNum = 0;
      
      addActivity(activityDetail).then(data => {

        if (data.data.status !== 1) {
          message.error(data.data.details)
          this.setState({ btnLoading: false})
          return ;
        }

        const id = data.data.data.id;
        
        groupsLists.forEach(item => {
          paramsEdit.bindInfos.push({groupId: item.id, enabled: item.enabled, activityId: id, bind: 1});
        })

        var initGroups = [];
        if (!!initData && initData.groupInfoList !== null && initData.groupInfoList !== '') {
          initGroups = initData.groupInfoList
        }

        initGroups.forEach(item => {
          let flag = groupsLists.some(item1 => {
            return item.id === item1.id
          })
          if (!flag) {
            paramsEdit.bindInfos.push({groupId: item.id, enabled: item.enabled, activityId: id, bind: 0});
          }
        })

        if (paramsEdit.bindInfos.length > 0) {
          editActivity(paramsEdit).then(data => {
            if (data.data.status !== 1) {
              message.error(data.data.details);
            } else {
              message.success(`活动${text}成功，群绑定成功`);
            }
            setTimeout(_ => {
              this.setState({ btnLoading: false })
              if (this.state.activityId > 0) {
                location.reload();
              } else {
                this.props.history.push('/activities')
              }
            }, 500);
          }).catch(e => {
            message.warn(`活动${text}成功，群绑定失败`);
            this.setState({ btnLoading: false})
          })
        } else {
          setTimeout(_ => {
            this.setState({ btnLoading: false })
            if (this.state.activityId > 0) {
              location.reload();
            } else {
              this.props.history.push('/activities')
            }
          }, 500);
        }

      }).catch(e => {
        message.error(`活动${text}失败`);
        this.setState({ btnLoading: false})
      });
    }

    onCancelSelect = (id) => {
      const groupId = +id;
      let groupsLists = this.state.groupsLists;
      groupsLists = groupsLists.filter(item => {
        return groupId !== item.id
      })
      this.setState({ groupsLists })
    }

    onGrEditActivity = () => {
      this.setState({ pageType: 'ac' })
    }

    onGrEditActivityCancel = () => {
      this.setState({ pageType: 'gr' })
    }

    render () {
      return (
        <Row>
          <Col span={12} offset={6}>
            <Form>

              <Form.Item
                label='活动名称*'
                labelCol={{span: 5}}
                wrapperCol={{span: 15}}>
                <Input type='text'
                   disabled={this.state.pageType === 'gr'}
                   name='activityName'
                   onChange={this.onActivityNameChange}
                   value={this.state.activityDetail.activityName}
                   id='activityName'/>
              </Form.Item>

              <Form.Item
                label="标签*"
                labelCol={{span: 5}}
                wrapperCol={{span: 15}}>
                <Select
                  disabled={this.state.pageType === 'gr'}
                  mode="combobox"
                  filterOption={false}
                  onChange={this.onActivityTagChange}
                  value={this.state.activityDetail.tagName}
                  >
                    { this.state.tagNameOptions }
                  </Select>
              </Form.Item>
              
              <Form.Item
                label='活动简介*'
                labelCol={{span: 5}}
                wrapperCol={{span: 15}}>
                <Input size='large'
                  disabled={this.state.pageType === 'gr'}
                  type='textarea' 
                  name='activityDesc'
                  value={this.state.activityDetail.activityDesc}
                  onChange={this.onActivityDescChange}
                  id='activityDesc'/>
              </Form.Item>
              <Form.Item
                label='文案选择*'
                labelCol={{span: 5}}
                wrapperCol={{span: 15}}>
                <Select showSearch
                  disabled={this.state.pageType === 'gr'}
                  defaultValue={this.state.activityDetail.documentType}
                  onChange={this.onTextTypeChange}
                  value={this.state.activityDetail.documentType}>
                  <Option value="JUQUNMAN">距群满还有 X 人</Option>
                  <Option value="YIYOU">已有 X 人入群</Option>
                </Select>
              </Form.Item>
              <Form.Item
                disabled={this.state.pageType === 'gr'}
                style={{display:(this.state.activityDetail.documentType === 'YIYOU' ? 'block' : 'none')}}
                label='入群人数*'
                labelCol={{span: 5}}
                wrapperCol={{span: 15}}>
                <Input type='text' value="自动获取" disabled={true}/>
              </Form.Item>
              <Form.Item
                style={{display:(this.state.activityDetail.documentType === 'JUQUNMAN' ? 'block' : 'none')}}
                label='仅剩名额*'
                labelCol={{span: 5}}
                wrapperCol={{span: 15}}>
                <Input type='text'
                  disabled={this.state.pageType === 'gr'}
                  value={this.state.activityDetail.lastPullNum}
                  name='lastPullNum'
                  onChange={this.onLastPullNumChange}
                  id='lastPullNum'/>
              </Form.Item>

              <Form.Item
                label='加群引导语'
                labelCol={{span: 5}}
                wrapperCol={{span: 15}}>
                <Input size='large'
                  disabled={this.state.pageType === 'gr'}
                  value={this.state.activityDetail.pullGroupGuide}
                  type='textarea'
                  name='pullGroupGuide'
                  onChange={this.onPullGroupGuideChange}
                  id='pullGroupGuide'/>
              </Form.Item>

              <Form.Item
                label='加群顺序'
                labelCol={{span: 5}}
                wrapperCol={{span: 15}}>
                <RadioGroup 
                  disabled={this.state.pageType === 'gr'}
                  defaultValue={this.state.activityDetail.addGroupType}
                  onChange={this.onAddGroupTypeChange} 
                  value={this.state.activityDetail.addGroupType}>
                  <Radio value="RANDOM">随机</Radio>
                  <Radio value="SEQUENCE">顺序</Radio>
                </RadioGroup>
              </Form.Item>

              <Form.Item
                label='群满条件'
                labelCol={{span: 5}}
                wrapperCol={{span: 15}}>
                <RadioGroup 
                  disabled={this.state.pageType === 'gr'}
                  defaultValue={this.state.activityDetail.changeGroupType}
                  onChange={this.onGroupFullTypeChange} 
                  value={this.state.activityDetail.changeGroupType}>
                  <Radio value="MEMBERNUM">入群人数</Radio>
                  <Radio value="SCANNUM">扫描次数</Radio>
                </RadioGroup>
              </Form.Item>

              <Form.Item
                style={{ display: this.state.activityDetail.changeGroupType === 'SCANNUM' ? '' : 'none'}}
                label='最大扫码次数*'
                labelCol={{span: 5}}
                wrapperCol={{span: 15}}>
                <Input type='text'
                  disabled={this.state.pageType === 'gr' || this.state.activityDetail.changeGroupType === 'MEMBERNUM'}
                  value={this.state.activityDetail.maxScanNum}
                  name='maxScanNum'
                  onChange={this.onGroupFullNumChange}
                  id='maxScanNum'/>
              </Form.Item>

              <Form.Item
                label='绑定群'
                labelCol={{span: 5}}
                wrapperCol={{span: 15}}>
                <Row>
                  <Col span={24}>
                    <Button 
                      disabled={this.state.pageType === 'gr'} 
                      onClick={this.onShowModel} 
                      type="primary" 
                      size="small" ghost>
                      <Icon type="lock" />绑定
                    </Button>
                  </Col>
                  {
                    this.state.groupsLists.length > 0 ? (
                      <Col span={24}>
                        <Table
                          pagination={false}
                          dataSource={this.state.groupsLists}
                          columns={this.state.groupColumnsSelect}
                          rowKey="id"
                          bordered
                          title={() => '已选群列表'}
                        />
                      </Col>
                    ) : ''
                  }
                </Row>
              </Form.Item>

              <Form.Item
                label='   '
                colon={false}
                labelCol={{span: 5}}
                wrapperCol={{span: 15}}>
                {
                  this.state.pageTypeStatic === 'gr' ? (
                    this.state.pageType === 'gr' ? (
                      <Row>
                        <Col span={5}>
                          <Button size="small">
                            <Link to="/groups">返回</Link>
                          </Button>
                        </Col>
                        <Col span={5} push={15} style={{textAlign: 'center'}}>
                          <Button 
                            size="small" 
                            onClick={this.onGrEditActivity}
                            type="primary">编辑</Button>
                        </Col>
                      </Row>
                    ) : (
                      <Row>
                        <Col span={5}>
                          <Button size="small" onClick={this.onGrEditActivityCancel}>取消</Button>
                        </Col>
                        <Col span={5} push={15} style={{textAlign: 'center'}}>
                          <Button 
                            size="small"
                            onClick={this.handleSubmit}
                            type="primary">更新</Button>
                        </Col>
                      </Row>
                    )
                  ) : (
                    <Row>
                      <Col span={5}>
                        <Button size="small">
                          <Link to="/activities">取消</Link>
                        </Button>
                      </Col>
                      <Col span={5} push={15} style={{textAlign: 'center'}}>
                        <Button 
                          size="small"
                          onClick={this.handleSubmit}
                          loading={this.state.btnLoading} 
                          type="primary">
                            {(this.state.activityId > 0) ? '更新' : '添加'}
                        </Button>
                      </Col>
                    </Row>
                  )
                }
              </Form.Item>

            </Form>

            <Modal
              title="微信机器人选择"
              className='modal-robot'
              visible={this.state.visible}
              onCancel={this.onModelCancel}
              width={600}
              onOk={this.onModelOK}>
              <Table
                size="small"
                columns={this.state.groupColumns}
                dataSource={this.state.dataSource}
                rowKey="id"
                pagination={this.state.pagination}
                onChange={this.handleTableChange}
                rowSelection={{
                  type: 'checkbox',
                  selectedRowKeys: this.state.selectKey,
                  onChange: this.onSelectChange,
                  onSelect: this.onSelectRow,
                  onSelectAll: this.onSelectAllRow
                }}/>
            </Modal>

          </Col>
        </Row>    
      );
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
    getActivityById: (lists) => {
      dispatch(getActivityById(lists))
    },
    pageChange: (lists) => {
      dispatch(pageChange(lists))
    },
    getGroupTag: (lists) => {
      dispatch(getGroupTag(lists))
    },
    getActivityTag: (lists) => {
      dispatch(getActivityTag(lists))
    },
    getUnbindGroup: (lists) => {
      dispatch(getUnbindGroup(lists))
    }
  }
}
  
export default connect(mapStateToProps, mapDispatchToProps)(ActivityEdit);