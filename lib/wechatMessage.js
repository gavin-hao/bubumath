
var wechat = require('wechat');
var config = require('../config').wechat_mp||{};
var domain = require('../config').domain;
var co = require('co');
var userStore = require('./userStore');
// var wechatApi=require('../lib/wechatApi');
var WECHAT_EVENT_TYPE = {
    subscribe: 'subscribe',
    unsubscribe: 'unsubscribe',
    location: 'location',
    click: 'click',
    view: 'view',
    scan: 'scan',
    scancode_waitmsg: 'scancode_waitmsg',
    scancode_push: 'scancode_push'
};
var qrscene_prefix = 'qrscene_';//qrscene_123123

var wechat_text = function (message, req, res, next) {
    // message为文本内容
    // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
    // CreateTime: '1359125035',
    // MsgType: 'text',
    // Content: 'http',
    // MsgId: '5837397576500011341' }
    var keyArray = ['你好', '约吗'];
    var content = message.Content;
    var keyIndex = keyArray.indexOf(content);
    switch (keyIndex) {
        case 0:
            {
                res.reply({
                    type: "text",
                    content: '您好，大家好才是真的好！'
                });

            }
            break;
        case 1:
            {
                res.reply({
                    type: "text",
                    content: '不约，不约，叔叔我们不约！'
                });

            }
            break;
        default:
            res.reply({
                type: "text",
                content: '你的要求暂时无法满足……'
            });
            break;
    }
};

var wechat_image = function (message, req, res, next) {
    // message为图片内容
    // { ToUserName: 'gh_d3e07d51b513',
    // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
    // CreateTime: '1359124971',
    // MsgType: 'image',
    // PicUrl: 'http://mmsns.qpic.cn/mmsns/bfc815ygvIWcaaZlEXJV7NzhmA3Y2fc4eBOxLjpPI60Q1Q6ibYicwg/0',
    // MediaId: 'media_id',
    // MsgId: '5837397301622104395' }}).voice(function(message, req, res, next) {
    // TODO
    res.send('success');
};

var wechat_voice = function (message, req, res, next) {
    // message为音频内容
    // { ToUserName: 'gh_d3e07d51b513',
    // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
    // CreateTime: '1359125022',
    // MsgType: 'voice',
    // MediaId: 'OMYnpghh8fRfzHL8obuboDN9rmLig4s0xdpoNT6a5BoFZWufbE6srbCKc_bxduzS',
    // Format: 'amr',
    // MsgId: '5837397520665436492' }
    res.send('success');
};

var wechat_video = function (message, req, res, next) {
    // message为视频内容
    // { ToUserName: 'gh_d3e07d51b513',
    // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
    // CreateTime: '1359125022',
    // MsgType: 'video',
    // MediaId: 'OMYnpghh8fRfzHL8obuboDN9rmLig4s0xdpoNT6a5BoFZWufbE6srbCKc_bxduzS',
    // ThumbMediaId: 'media_id',
    // MsgId: '5837397520665436492' }
    // TODO

    res.send('success');
};
var wechat_shortvideo = function (message, req, res, next) {
    // message为短视频内容
    // { ToUserName: 'gh_d3e07d51b513',
    // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
    // CreateTime: '1359125022',
    // MsgType: 'shortvideo',
    // MediaId: 'OMYnpghh8fRfzHL8obuboDN9rmLig4s0xdpoNT6a5BoFZWufbE6srbCKc_bxduzS',
    // ThumbMediaId: 'media_id',
    // MsgId: '5837397520665436492' }
    // TODO
    res.send('success');
};
var wechat_location = function (message, req, res, next) {

    // message为链接内容
    // { ToUserName: 'gh_d3e07d51b513',
    // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
    // CreateTime: '1359125022',
    // MsgType: 'link',
    // Title: '公众平台官网链接',
    // Description: '公众平台官网链接',
    // Url: 'http://1024.com/',
    // MsgId: '5837397520665436492' }
    // TODO
    res.send('success');
};
var wechat_link = function (message, req, res, next) {
    res.send('success');
};
var wechat_device_text = function (message, req, res, next) {
    // message为设备文本消息内容
    // { ToUserName: 'gh_d3e07d51b513',
    // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
    // CreateTime: '1359125022',
    // MsgType: 'device_text',
    // DeviceType: 'gh_d3e07d51b513'
    // DeviceID: 'dev1234abcd',
    // Content: 'd2hvc3lvdXJkYWRkeQ==',
    // SessionID: '9394',
    // MsgId: '5837397520665436492',
    // OpenID: 'oPKu7jgOibOA-De4u8J2RuNKpZRw' }
    // TODO

    res.send('success');
};
var wechat_device_event = function (message, req, res, next) {
    // message为设备事件内容
    // { ToUserName: 'gh_d3e07d51b513',
    // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
    // CreateTime: '1359125022',
    // MsgType: 'device_event',
    // Event: 'bind'
    // DeviceType: 'gh_d3e07d51b513'
    // DeviceID: 'dev1234abcd',
    // OpType : 0, //Event为subscribe_status/unsubscribe_status时存在
    // Content: 'd2hvc3lvdXJkYWRkeQ==', //Event不为subscribe_status/unsubscribe_status时存在
    // SessionID: '9394',
    // MsgId: '5837397520665436492',
    // OpenID: 'oPKu7jgOibOA-De4u8J2RuNKpZRw' }
    // TODO
    res.send('success');
};
var wechat_event = function (message, req, res, next) {
    // message为事件内容
    // { ToUserName: 'gh_d3e07d51b513',
    // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
    // CreateTime: '1359125022',
    // MsgType: 'event',
    // Event: 'LOCATION',scancode_waitmsg
    // Latitude: '23.137466',
    // Longitude: '113.352425',
    // Precision: '119.385040',
    // MsgId: '5837397520665436492' }
    // TODO

    var rep_message = [{
        title: '感谢关注bubumath!',
        description: '绑定学习帐号，查看孩子学习报告',
        picurl: 'http://mxc.leanapp.cn/login/assets/qrcode.jpg',
        url: domain + '/users/profile'
    }];
    var scan_rep_message = [
        {
            title: '绑定学习帐号,实时掌握孩子学习状况！',
            description: '绑定学习帐号，查看孩子学习报告',
            picurl: 'http://mxc.leanapp.cn/login/assets/qrcode.jpg',
            url: domain + '/users/profile'
        },
        {
            title: '感谢关注bubumath!',
            description: '绑定学习帐号，查看孩子学习报告',
            // picurl: 'http://mxc.leanapp.cn/login/assets/qrcode.jpg',
            url: domain + '/users/profile'
        }
    ];
    console.log(message);
    co(function* () {
        var event_type = message.Event.toLowerCase();

        switch (event_type) {

            case WECHAT_EVENT_TYPE.subscribe://订阅公众号事件 
                var user_id = '';
                if (message.EventKey && message.EventKey.slice(0, qrscene_prefix.length) == qrscene_prefix) {
                    user_id = message.EventKey.slice(qrscene_prefix.length);
                }

                if (user_id) {
                    var user = yield userStore.findUserById(user_id);
                    if (user) {
                        console.log('用户关注了公众号：user_id: ', user)

                        var loginInfo = yield userStore.findLogin('wechat', message.FromUserName);
                        if (!loginInfo) {
                            yield userStore.addLogin('wechat', message.FromUserName, user.id);
                        }
                    }
                }
                res.reply(rep_message);
                break;
            case WECHAT_EVENT_TYPE.scancode_waitmsg:
            case WECHAT_EVENT_TYPE.scancode_push:
                res.reply(rep_message);
                break;
            case WECHAT_EVENT_TYPE.scan:
                var user_id2 = message.EventKey;
                if (user_id2) {
                    var user2 = yield userStore.findUserById(user_id2);
                    if (user2) {
                        console.log('用户关注了公众号：user_id: ', user)

                        var loginInfo2 = yield userStore.findLogin('wechat', message.FromUserName);
                        if (!loginInfo2) {
                            yield userStore.addLogin('wechat', message.FromUserName, user2.id);
                        }
                    }
                }
                res.reply(scan_rep_message);
                break;
            case WECHAT_EVENT_TYPE.unsubscribe:
                //todo: unbind user
                var loginInfo = yield userStore.findLogin('wechat', message.FromUserName);
                if (loginInfo) {
                    yield userStore.removeLogin(loginInfo.id);
                }
                res.reply('success');
                break;

            case WECHAT_EVENT_TYPE.click:
            case WECHAT_EVENT_TYPE.location:
            case WECHAT_EVENT_TYPE.view:
            default:
                res.reply();
                break;
        }
    });




}

var token=require('./wechatApi').mptoken;
function wechatBot() {
    return wechat(token).text(wechat_text)
        .event(wechat_event)
        //.image(wechat_image).voice(wechat_voice)
        //.video(wechat_video).shortvideo(wechat_shortvideo)
        //.location(wechat_location).link(wechat_link)
        //.device_text(wechat_device_text).device_event(wechat_device_event)
        .middlewarify();
}

module.exports = wechatBot;




