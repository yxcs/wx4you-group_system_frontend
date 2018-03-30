import React from 'react';
import {message} from 'antd';
import {getH5Page} from '../interface';
import moment from 'moment';
// images;
import '../assets/bg.png';
import header from  '../assets/header1.png'
import activityPicture from '../assets/activity_nongyao.jpg'
import '../style/h5Page.css';

export default class H5Page extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            data: {},
            groupAvatar: header
        };
    }

    componentWillMount() {
        let id = this.props.params.id;
        getH5Page(id).then(data => {
            let myData = data.data.data;
            if(myData === null) {
                message.warn('无该活动数据');
                return
            }
            let activityDesc = myData.activityDesc;
            let activityName = myData.activityName;

            if(activityDesc.length > 30) {
                activityDesc = activityDesc.substring(0,30);
                activityDesc += '...';
                myData.activityDesc = activityDesc;
            }
            if(activityName.length > 13) {
                activityName = activityName.substring(0,13) + '...' + activityName.substr(-3,3);
                myData.activityName = activityName;
            }
            myData.invalidDate = moment(myData.invalidDate).format("M月D日");
            myData.groupAvatar = myData.groupAvatar || header;
            this.setState({
                data: myData,
                groupAvatar: myData.groupAvatar
            });
        });
    }

    render () {

        // 活动id为12的是王者荣耀拉粉专用
        if (+this.props.params.id !== 12) {
            if (+this.props.params.id === 22 || +this.props.params.id === 23) {
              return (
                <div className="h5-wrap bg_mpdg">
                    <div className="mar"></div>
                    <div className="h5-header" style={{backgroundImage: `url(${this.state.groupAvatar})`}}></div>
                    <div className="group-name">{this.state.data.activityName}</div>
                    <div style={{display:(this.state.data.lastPullNum)>0?'none':'block'}}>
                        <div style={{display:(this.state.data.groupMemberNum)>=0?'block':'none'}} className="group-person-num">已有<span>{this.state.data.groupMemberNum}</span>人入群</div>
                        <div style={{display:(this.state.data.groupMemberNum)>=0?'none':'block'}} className="group-person-num">入群人数获取中...</div>
                    </div>
                    <div style={{display:(this.state.data.lastPullNum)>0?'block':'none'}} className="group-person-num">距群满还有<span>{this.state.data.lastPullNum}</span>人</div>
                    <div className="mar2"></div>
                    <div className="mar3" style={{display: 'none'}}> </div>
                    <div className="group-qrcode"><img alt='' src={this.state.data.qrcodeUrl}/></div>
                    <div className="mar4"></div>
                    <div className="group-validity" style={{display: 'none'}}>该二维码七天内{`(${this.state.data.invalidDate})`}有效</div>
                    
                    <div className="group-des"><p>{this.state.data.activityDesc}</p></div>
                    <div className="group-tips">长按识别二维码进群学习</div>
                </div>
              )
            } else {
              return (
                <div className="h5-wrap bg_main">
                    <div className="mar"></div>
                    <div className="h5-header" style={{backgroundImage: `url(${this.state.groupAvatar})`}}></div>
                    <div className="group-name">{this.state.data.activityName}</div>
                    <div style={{display:(this.state.data.lastPullNum)>0?'none':'block'}}>
                        <div style={{display:(this.state.data.groupMemberNum)>=0?'block':'none'}} className="group-person-num">已有<span>{this.state.data.groupMemberNum}</span>人入群</div>
                        <div style={{display:(this.state.data.groupMemberNum)>=0?'none':'block'}} className="group-person-num">入群人数获取中...</div>
                    </div>
                    <div style={{display:(this.state.data.lastPullNum)>0?'block':'none'}} className="group-person-num">距群满还有<span>{this.state.data.lastPullNum}</span>人</div>
                    <div className="mar2"></div>
                    <div className="mar3" style={{display: 'none'}}> </div>
                    <div className="group-qrcode"><img alt='' src={this.state.data.qrcodeUrl}/></div>
                    <div className="mar4"></div>
                    <div className="group-validity" style={{display: 'none'}}>该二维码七天内{`(${this.state.data.invalidDate})`}有效</div>
                    
                    <div className="group-des"><p>{this.state.data.activityDesc}</p></div>
                    <div className="group-tips">长按识别二维码进群学习</div>
                </div>
              )
            }
        } else {
            document.title = '五美开黑，燃爆最强王者';
            return (
                <div className='activity-nongyao'>
                    <div className='activity-bg'>
                        <img class='' src={activityPicture} alt=""/>
                    </div>
                    <div className="group-qrcode">
                        <img alt='' src={this.state.data.qrcodeUrl}/>
                    </div>
                </div>
            )
        }
    }

};

