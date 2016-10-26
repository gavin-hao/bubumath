var WechatAPI = require('wechat-api');
var AV = require('leanengine');
// var wechatOauth=require('wechat-oauth');
// `AV.Object.extend` 方法一定要放在全局变量，否则会造成堆栈溢出。
// 详见： https://leancloud.cn/docs/js_guide.html#对象
var access_token = AV.Object.extend('AppSetting');
var wechatTokenKey = 'wechat_api_access_token';

var config = require('../config').wechat;
var wechat_mp_config = require('../config').wechat_mp || {}
var appid = process.env.WECHAT_APP_ID || config.appid;
var appsecret = process.env.WECHAT_APP_SECRET || config.appsecret;
var wechat_mp_token = process.env.WECHAT_MP_TOKEN || wechat_mp_config.token;

function fetchToken(key, callback) {
    var query = new AV.Query('AppSetting');
    // 查询 priority 是 0 的 Todo
    query.equalTo('key', key);
    query.first().then(function (results) {
        callback(null, results);
    }, function (error) {
        callback(error, null);
    });
}

function deleteToken(id, callback) {
    var todo = AV.Object.createWithoutData('AppSetting', id);
    todo.destroy().then(function (success) {
        // 删除成功
        callback(null, success)
    }, function (error) {
        // 删除失败
        callback(error, null)
    });

}


var _getToken = function (callback) {
    // 传入一个获取全局token的方法
    fetchToken(wechatTokenKey, function (err, data) {
        if (err || !data || !data.get('value')) { return callback(err, data); }
        callback(null, JSON.parse(data.get('value')));
    })
};
var _saveToken = function (_token, callback) {
    // 请将token存储到全局，跨进程、跨机器级别的全局，比如写到数据库、redis等
    // 这样才能在cluster模式及多机情况下使用，以下为写入到文件的示例
    var token = new access_token();
    token.set('value', JSON.stringify(_token));
    token.set('key', wechatTokenKey);
    fetchToken(wechatTokenKey, function (err, results) {
        if (!err && results) {
            deleteToken(results.id, function (err, success) {

            });
        }
        token.save().then(function (todo) {
            callback(null, todo);
        }).catch(callback);
    });

};


var api = new WechatAPI(appid, appsecret, function (callback) {
    // 传入一个获取全局token的方法
    _getToken(callback);
    // fetchToken(wechatTokenKey, function (err, data) {
    //     if (err||!data||!data.get('value')) { return callback(err,data); }
    //     callback(null, JSON.parse(data.get('value')));
    // })
}, function (_token, callback) {
    // 请将token存储到全局，跨进程、跨机器级别的全局，比如写到数据库、redis等
    // 这样才能在cluster模式及多机情况下使用，以下为写入到文件的示例
    _saveToken(_token, callback);

});

// var oauthApi = new wechatOauth(appid, appsecret, function (openid, callback) {
//   // 传入一个根据openid获取对应的全局token的方法
//   // 在getUser时会通过该方法来获取token
//   _getToken(callback);

// }, function (openid, token, callback) {
//   // 请将token存储到全局，跨进程、跨机器级别的全局，比如写到数据库、redis等
//   // 这样才能在cluster模式及多机情况下使用，以下为写入到文件的示例
//   // 持久化时请注意，每个openid都对应一个唯一的token!
//   _saveToken(token,callback);

// });

module.exports = {
    saveToken: _saveToken,
    getToken: _getToken,
    api: api,
    appid: appid,
    appsecret: appsecret,
    mptoken: wechat_mp_token
    // oauth:oauthApi
};