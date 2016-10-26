var express = require('express');
var router = express.Router();
var userStore = require('../lib/userStore');
var auth = require('../middlewares/auth');
var wrap = require('../middlewares/express_co');
// var AV = require('leanengine');
var moment = require('moment');
var util = require('../lib/utils');
var signIn = require('./signInManager');

router.use(auth.authorize());//{ redirectTo: '/auth/wechat' }
var Model = { layout: 'layout_wx.html', title: '布布亲子数学', error: '' }
router.get('/manage', wrap(function* (req, res, next) {

    // /link/wechat
    var wechatLogin = yield userStore.getLoginByUserId('wechat', req.user.id);
    var wechat = null;
    if (wechatLogin) {
        wechat = { provider: 'wechat', id: wechatLogin.id };
    }
    var model = Object.assign(Model, {
        title: '账号管理',
        username: req.user.username,
        wechatAuth: wechat
    });
    res.render('./wx/manage.html', model)
}));
router.post('/updateusername', wrap(function* (req, res, next) {
    req.assert('username', '请填写原密码').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        return res.send({ error: errors[0], success: false, message: errors[0].message, action: null })
    }
    try {
        var user = yield userStore.findUserById(req.user.id);
        user.setUsername(req.body.username)
        var result = yield userStore.updateUserInfo(user);
        if (result) {
            var loginUser = result;//yield userStore.AVUser.logIn(req.user.username, req.body.newpassword);
            res.saveCurrentUser(result);
            var _u = req.user;
            _u._sessionToken = loginUser._sessionToken;
            _u.AVUser = loginUser;
            yield signIn.logIn(req, _u);
            return res.send({ error: '', success: true, message: 'success', action: 'reload', redirect_uri: '/wx/manage' })
        } else {
            throw new Error('服务器错误')
        }
    } catch (error) {
        if (error.code && error.code == 202) {
            return res.send({ error: error, success: false, message: error.message })
        } else {
            throw error;
        }
    }
}));
router.post('/updatepassword', wrap(function* (req, res, next) {
    req.assert('oldpassword', '请填写原密码').notEmpty();
    req.assert('newpassword', '请填写新密码').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        return res.send({ error: errors[0], success: false, message: errors[0].message, action: null })
    }
    try {
        var AVUser = yield userStore.findUserById(req.user.id);
        var result = yield userStore.updatePassword(AVUser, req.body.oldpassword, req.body.newpassword);
        if (result) {
            var loginUser = yield userStore.AVUser.logIn(req.user.username, req.body.newpassword);
            res.saveCurrentUser(loginUser);
            var _u = req.user;
            _u._sessionToken = loginUser._sessionToken;
            _u.AVUser = loginUser;
            yield signIn.logIn(req, _u);
        }
        return res.send({ error: '', success: true, message: 'success', action: 'reload', redirect_uri: '/wx/manage' })

    } catch (error) {
        if (error.code && error.code == 210) {
            errors = [{ code: error.code, message: error.message || '用户名与密码不匹配' }];
            return res.send({ error: errors[0], success: false, message: errors[0].message })

        }
        else {
            throw error;
        }
    }
}));

router.get('/profile', wrap(function* (req, res, next) {
    var uid = req.user.id;
    var user = yield userStore.findUserById(uid);
    var userInfo = {};
    userInfo.id = uid;
    userInfo.childname = user.get('childname') || '';
    userInfo.birthday = user.get('birthday') || '1900-01-01';
    userInfo.mobilePhoneNumber = user.get('mobilePhoneNumber') || '';
    userInfo.email = user.getEmail() || '';
    var birthday = (userInfo.birthday instanceof Date) ? userInfo.birthday : new Date(userInfo.birthday);
    // userInfo.age = util.birthdayToAge(birthday.getFullYear(), birthday.getMonth(), birthday.getDate(), 'years', 0, 'roundup');
    userInfo.age = util.birthday2Age(birthday);
    userInfo.age = userInfo.age >= 5 ? 5 : (userInfo.age <= 3 ? 3 : userInfo.age);
    var model = Object.assign(Model, {
        title: '宝宝资料',
        userInfo: userInfo
    })
    res.render('./wx/profile.html', model)
}));


router.get('/disassociate', wrap(function* (req, res, next) {
    var uid = req.user.id;
    var loginInfo = yield userStore.getLoginByUserId('wechat', uid);
    yield userStore.removeLogin(loginInfo.id);
    var redirect = '/wx/manage';
    if (req.query && req.query.returnTo) {
        redirect = req.query.returnTo;
    }
    return res.redirect(redirect);
}));

router.post('/profile', wrap(function* (req, res, next) {
    if (req.body.email) {
        req.assert('email', '邮箱格式不正确').optional().isEmail();
    }
    var errors = req.validationErrors();
    if (errors) {
        return res.send({ error: errors[0], success: false, message: errors[0].message, action: null })
        // return res.redirect('/wx/profile');
    }
    var model = req.body;
    var uid = req.user.id;
    var user = yield userStore.findUserById(uid);
    user.setEmail(model.email)
    user.set('mobilePhoneNumber', model.mobilePhoneNumber);
    user.set('childname', model.childname);
    user.setEmail(model.email || null);
    var b = moment().startOf('month').startOf('days').subtract(parseInt(model.age), "years").toDate();
    user.set('birthday', b);
    var result;
    var userInfo = {};
    // var message = '';
    try {
        result = yield userStore.updateUserInfo(user);
        userInfo.id = uid;
        userInfo.childname = result.get('childname') || '';
        userInfo.birthday = result.get('birthday') || '1900-01-01';
        userInfo.mobilePhoneNumber = result.get('mobilePhoneNumber') || '';
        userInfo.email = result.getEmail() || '';
        var birthday = (userInfo.birthday instanceof Date) ? userInfo.birthday : new Date(userInfo.birthday);
        var tt = util.birthday2Age(birthday);
        userInfo.age = tt;
        return res.send({ error: null, success: true, message: '修改成功', action: null })
    } catch (error) {
        //214:手机号被占用，203:邮箱被占用
        if (error.code && (error.code == 214 || error.code == 203)) {
            // message = error.message;
            // userInfo = model;
            // userInfo.id = uid;
            return res.send({ error: error, success: false, message: error.message, action: null })
        } else {
            throw error;
            // return res.send({ error: error, success: false, message: error.message, action: null })
        }
    }


    // var newModel = Object.assign(Model, {
    //     title: '宝宝资料',
    //     error: message,
    //     userInfo: userInfo
    // })
    // res.render('./wx/profile.html', newModel)
}));
module.exports = router;