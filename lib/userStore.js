
var AV = require('leanengine');
var UserExternalLogin = AV.Object.extend('UserExternalLogin');

var Promise = require('bluebird');


function AVLogin(name, pass) {
    return new Promise((resolver, reject) => {
        AV.User.logIn(name, pass).then(resolver, reject);
    })
}
function AVSignUp(username, password) {
    var user = new AV.User();
    user.set("username", username);
    user.set("password", password);
    return new Promise((resolve, reject) => {
        user.signUp().then(resolve, reject)
    })
}
exports.AVUser = {
    logIn: AVLogin,
    signUp: AVSignUp
}
exports.findLogin = function (provider, openId) {
    var query = new AV.Query('UserExternalLogin');
    // 查询 priority 是 0 的 Todo
    query.equalTo('loginProvider', provider);
    query.equalTo('openId', openId);
    return new Promise((resolve, reject) => {
        query.first().then(resolve, reject);
    })

};

exports.addLogin = function (provider, openId, userId, unionid) {
    provider = provider || 'wechat';
    var login = new UserExternalLogin();
    // 设置名称
    login.set('loginProvider', provider);
    login.set('openId', openId);
    login.set('userId', userId);
    if (unionid) {
        login.set('unionid', unionid);
    }
    return new Promise((resolve, reject) => {
        login.save().then(resolve, reject);
    });

};

exports.removeLogin = function (id) {

    var todo = AV.Object.createWithoutData('UserExternalLogin', id);
    return new Promise((resolve, reject) => {
        todo.destroy().then(resolve, reject);
    });

};

exports.findUserById = function (userId) {
    var todo = AV.Object.createWithoutData('_User', userId);
    return new Promise((resolve, reject) => {
        todo.fetch().then(resolve, reject);
    });


};

exports.findUserInfo = function (userId) {
    var query = new AV.Query('_User');
    return new Promise((resolve, reject) => {
        query.get(userId).then(resolve, reject);
    });
}
exports.updateUserInfo = function (user) {
    if (user instanceof AV.User) {
        return new Promise((resolver, reject) => {
            user.save().then(resolver, reject)
        });

    } else {
        var query = new AV.Query('_User');
        return new Promise((resolve, reject) => {

            query.get(user.id).then(function (loginUser) {
                for (var p in user) {
                    if (typeof (user[p]) != 'function' && p != 'id') {
                        loginUser.set(p, user[p]);
                    }
                }
                return loginUser.save().then(resolve, reject);
            }, reject);
        });
    }

}

exports.updatePassword = function (AVUser, oldPassword, newPassword) {

    return new Promise((resolve, reject) => {
        AVUser.updatePassword(oldPassword, newPassword).then(resolve, reject);
    });
}
exports.updateUsername = function (id, username) {
    var query = new AV.Query('_User');
    return new Promise((resolve, reject) => {

        query.get(id).then(function (loginUser) {
            loginUser.setUsername(username);
            return loginUser.save().then(resolve, reject);
        }, reject);
    });
}
exports.getLoginByUserId = function (provider,uid) {
    var query = new AV.Query('UserExternalLogin');
    query.equalTo('userId', uid);
    query.equalTo('loginProvider', provider);
    return new Promise((resolve, reject) => {
        query.first().then(resolve, reject);
    });
}