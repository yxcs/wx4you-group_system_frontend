import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
// import { Router, Route, Redirect } from 'react-router';
import Groups from './components/Groups';
import Robots from './components/Robots';
import Activities from './components/Activities';
import ActivityEdit from './components/ActivityEdit';
import H5Page from './components/H5Page';
import Login from './components/Login';

import browserHistory from 'react-router-redux';
import { Icon, Layout, Menu, Breadcrumb, Popconfirm } from 'antd';
const { Header, Content, Sider } = Layout;
import { connect } from 'react-redux';
import { pageChange } from './reducers/actionCreater';
import { userLogout } from './services/apis';

import {
  BrowserRouter as Router,
  Route,
  Redirect,
  Link
} from 'react-router-dom';

import logo from './assets/logo_mdscj.png';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pageType: {
        'groups': {key: ['1'], breadcrumb: [{text: '首页', link: '/'}, {text: '群管理', link: ''}]},
        'robots': {key: ['2'], breadcrumb: [{text: '首页', link: '/'}, {text: '机器人', link: ''}]},
        'activities': {key: ['3'], breadcrumb: [{text: '首页', link: '/'}, {text: '活动管理', link: ''}]},
        'activitiesAdd': {key: ['3'], breadcrumb: [{text: '首页', link: '/'}, {text: '活动管理', link: '/activities'}, {text: '添加', link: ''}]},
        'activitiesEdit': {key: ['3'], breadcrumb: [{text: '首页', link: '/'}, {text: '活动管理', link: '/activities'}, {text: '编辑', link: ''}]},
        'h5': {key: ['0'], breadcrumb: [{text: '首页', link: '/'}, {text: '活动页面', link: ''}]},
        'login': {key: ['0'], breadcrumb: [{text: '首页', link: '/'}, {text: '登录', link: ''}]},
      },
      page: 'groups',
      userName: ''
    }
  }

  componentWillReceiveProps (nextProps) {
    if (localStorage.getItem("userName")) {
      this.setState({
        userName: localStorage.getItem("userName")
      })
    }
    this.setState({
      page: nextProps.page
    })
  }

  onLogoutConfirm = () => {
    userLogout().then(data => {
      if (data.data.status === 1) {
        localStorage.removeItem('userName')
        location.reload()
      }
    })
  }

  render() {
    return (
      <Router history={browserHistory}>
        <div style={{height: '100%'}}>
          <Route exact path='/signUp' component={Login}></Route>
          <Route exact path='/h5/:id' component={H5Page}></Route>
          <Layout style={{height: '100%', display: (this.state.page === 'h5' || this.state.page === 'login') ? 'none' : ''}}>
            <Header className="header">
              <div className="logo App-logo"><img src={logo} /></div>
              <div className="userName">
                {/* 你好，
                <Popconfirm onConfirm={this.onLogoutConfirm} placement="bottomRight" title="确定要退出吗？" okText="是" cancelText="否">
                  <span>{this.state.userName}</span>
                </Popconfirm> */}
                <Popconfirm onConfirm={this.onLogoutConfirm} placement="bottomRight" title="确定要退出吗？" okText="是" cancelText="否">
                  <span> 退出 </span>
                </Popconfirm>
              </div>
            </Header>
            <Layout style={{height: '100%'}}>
              <Sider
                collapsible 
                width={140} 
                style={{ background: '#fff', height: '100%' }}>
                <Menu
                  mode="inline"
                  defaultSelectedKeys={['1']}
                  selectedKeys={this.state.pageType[this.state.page].key}
                  style={{ height: '100%', borderRight: 0 }}>
                
                  <Menu.Item key="1">
                    <Link to='/groups'>
                      <Icon type="windows-o" />
                      <span>群管理</span>
                    </Link>
                  </Menu.Item>

                  <Menu.Item key="2">
                    <Link to='/robot'>
                      <Icon type="android-o" />
                      <span>机器人</span>
                    </Link>
                  </Menu.Item>

                  <Menu.Item key="3">
                    <Link to='/activities'>
                      <Icon type="api" />
                      <span>活动管理</span>
                    </Link>
                  </Menu.Item>

                </Menu>
              </Sider>
              <Layout style={{padding: '0 24px 24px' }}>
                <Breadcrumb style={{ margin: '12px 0' }}>
                 {
                  this.state.pageType[this.state.page].breadcrumb.map((item, index) => {
                    return <Breadcrumb.Item key={'Breadcrumb'+index}>
                             {
                               !!item.link ? <Link to={item.link}>{item.text}</Link> : item.text
                             }
                           </Breadcrumb.Item>
                  })
                 }
                </Breadcrumb>
                <Content id="sidebar" style={{ background: '#fff', padding: 24, margin: 0, minHeight: '240px', overflowY: 'auto' }}>
                  <Route exact path='/' render={() => <Redirect to='/groups'/> }></Route>
                  <Route exact path='/groups' component={Groups}></Route>
                  <Route exact path='/robot' component={Robots}></Route>
                  <Route exact path='/activities' component={Activities}></Route>
                  <Route exact path='/activities/:type/add/' component={ActivityEdit}></Route>
                  <Route exact path='/activities/edit/:type/:id' component={ActivityEdit}></Route>
                </Content>
              </Layout>
            </Layout>
          </Layout>
        </div>
      </Router>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return state
}
  
const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    pageChange: (lists) => {
      dispatch(pageChange(lists))
    }
  }
}
  
export default connect(mapStateToProps, mapDispatchToProps)(App);