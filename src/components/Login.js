import {
    Button,
    Icon,
    message,
    Form,
    Input
  } from 'antd';
  import React from 'react';
  import { connect } from 'react-redux';

  import { userLogin } from '../services/apis';
  import { pageChange } from '../reducers/actionCreater';
  
  class Login extends React.Component {
    constructor (props) {
      super(props);
      this.state = {
        username: null,
        password: null,
        isLogin: false
      }
    }

    componentWillMount() {
      this.props.pageChange('login')
    }

    onUserNameChange = e => {
      this.setState({ username: e.target.value })
    }
    
    onPasswordChange = e => {
      this.setState({ password: e.target.value })
    }

    onLoginClick = () => {
      this.props.form.validateFields((err, values) => {
        if (!err) {
          var redirect_uri = '/groups';
          var search = this.props.location.search;
          if (!!search) {
            search = search.substring(1);
            if(search.indexOf('redirect_uri') === 0) {
              search = search.split('&')[0];
              redirect_uri = search.split('=')[1];
              redirect_uri = decodeURIComponent(redirect_uri);
            }
          }

          let params = `loginname=${this.state.username}&pass=${this.state.password}`
          userLogin(params).then(data => {
            if (data.data.status === 1) {
              var userName = data.data.data.name
              localStorage.setItem("userName", userName);
              this.props.history.replace(redirect_uri);
              message.success('登陆成功！')
            } else {
              message.error('登陆失败！' + data.data.details)
            }
          })
        }
      });
    }

    render () {
      const { getFieldDecorator } = this.props.form;
      return (
        <div className="loginWrap">
          <div className="title"><span>群裂变系统登陆</span></div>
          <Form onSubmit={this.handleSubmit} className="login-form">
            <Form.Item>
              {getFieldDecorator('Username', {
                rules: [{ required: true, message: '请填写用户名' }],
              })(
                <Input 
                  name="Username"
                  prefix={<Icon type="user" style={{ fontSize: 13 }} />} 
                  placeholder="Username"
                  onChange={this.onUserNameChange} />
              )}
            </Form.Item>
            <Form.Item>
            {getFieldDecorator('Password', {
                rules: [{ required: true, message: '请填写密码' }],
              })(
                <Input 
                  name="password"
                  prefix={<Icon type="lock" style={{ fontSize: 13 }} />} 
                  type="password" 
                  placeholder="Password"
                  onChange={this.onPasswordChange} />
              )}
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={this.onLoginClick} className="login-form-button">登陆</Button>
            </Form.Item>
          </Form>
        </div>
      )
    }
  }

const FormChcekLogin = Form.create()(Login);

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
  
export default connect(mapStateToProps, mapDispatchToProps)(FormChcekLogin);