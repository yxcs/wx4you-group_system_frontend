import React from 'react';
import {Button, Modal, Icon} from 'antd';
import fs from 'fs';
import qr from 'qr-image';
import * as config from '../config';

export default class ShowCode extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            isShowCode: false,
            svg_string:''
        };
    }

    handleClick = () => {
        if(this.props.type === 'activity') {
            this.getUrl2Qrcode()
        }
        this.setState({
            isShowCode: !this.state.isShowCode
        })
    };

    getUrl2Qrcode = () => {
        const id = this.props.activityId;
        // let url = `http://10.8.185.34:3000/h5/${id}` ;
        let url = `${config.formalUrl}:${config.formalPort}/h5/${id}` ;
        let svg_string = qr.imageSync(url, { type: 'svg',size:8 });
        const startPos = svg_string.indexOf('d=') + 3;
        const endPos = svg_string.indexOf('/></svg>') - 1;
        svg_string = svg_string.substring(startPos, endPos)

        this.setState({
            svg_string
        })
    };

    render () {
        let {type, qrcode, name} = this.props;

        if(type === 'group') {
            return (
                <li style={{padding:"2px 0"}}>
                    <a href='javascript:void(0)' onClick={this.handleClick}>{name}</a>
                    <Modal
                        title={`${name}的二维码` }
                        onCancel={this.handleClick}
                        onOk={this.handleClick}
                        visible={this.state.isShowCode}>
                        <div style={{textAlign: 'center'}}><img alt="二维码" src={qrcode} width={'200px'} height={'200px'} /></div>
                    </Modal>
                </li>
            )
        }else if(type === 'activity') {
            return (
                    <span>
                        <Button size='small' onClick={this.handleClick}><Icon type="qrcode"/></Button>
                        <Modal
                            title='活动的二维码'
                            onCancel={this.handleClick}
                            onOk={this.handleClick}
                            visible={this.state.isShowCode}>
                            <div style={{textAlign: 'center'}}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="248" height="248" viewBox="0 0 31 31">
                                    <path d={this.state.svg_string}/>
                                </svg>
                            </div>
                        </Modal>
                    </span>
                   )
        }

    }

};