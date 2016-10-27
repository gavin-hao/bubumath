var express = require('express');
var router = express.Router();

var passport = require('../middlewares/passport');
// var AV = require('leanengine');
var auth = require('../middlewares/auth');
var config = require('../config');

var userStore = require('../lib/userStore');
var wrap = require('../middlewares/express_co');
var co = require('co');
// var Promise = require("bluebird");
var utils = require('../lib/utils');
var signIn = require('./signInManager');
router.get('/auth/wechat', function (req, res, next) {
    var returnUrl = req.query.returnTo || '/';
    var state = new Buffer(returnUrl, 'utf8').toString('base64');
    passport.authenticate('wechat', {
        state: state,
        callbackURL: config.domain + '/auth/wechat/callback',
        scope: 'snsapi_userinfo'
    })(req, res, next);
});



router.get('/auth/wechat/callback', function (req, res, next) {

    passport.authenticate('wechat', function (err, user, info) {
        if (err) { return next(err) }
        if (!user) { return res.redirect('/auth/fail') }
        // console.log('wechat callback--->', user, info);
        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }
            return res.redirect('/auth/wechat/connect');
        });

    })(req, res, next);
});





router.get('/auth/wechat/connect', wrap(function* (req, res, next) {
    var currentUser = req.user;
    // console.log('currentUser--->', currentUser);
    if (!currentUser.loginProvider) {
        throw new Error('login error,denied!');
    }
    var logininfo = yield userStore.findLogin(currentUser.loginProvider, currentUser.id);
    console.log('externalloginInfo--->', logininfo);

    if (!logininfo || !logininfo.get('userId')) {
        return res.redirect('/bind/wechat');
    }
    var uid = logininfo.get('userId');
    var AVUser = yield userStore.findUserById(uid);
    if (!AVUser) {
        throw new Error('login error,user not exist!');
    }
    var user = { id: AVUser.id };
    user.username = AVUser.getUsername();
    user.email = AVUser.getEmail();
    user.phone = AVUser.get('phone');
    // console.log('user--->', user);

    req.logout();
    var success = yield signIn.logIn(req, user);
    if (!success) {
        throw new Error('login error!');
    }
    return res.redirect('/wx/manage');
}));

router.get('/link/wechat',auth.authorize(), function (req, res, next) {
    var returnUrl = req.query.returnTo || '/';
    var state = new Buffer(returnUrl, 'utf8').toString('base64');
    passport.authenticate('wechat', {
        state: state,
        callbackURL: config.domain + '/link/wechat/callback',
        scope: 'snsapi_userinfo'
    })(req, res, next);
});
router.get('/link/wechat/callback',auth.authorize(), function (req, res, next) {

    passport.authenticate('wechat', function (err, user, info) {
        if (err) { return next(err) }
        if (!user) { return res.redirect('/auth/fail') }
        // console.log('wechat callback--->', user, info);
        // req.logIn(user, function (err) {
        //     if (err) {
        //         return next(err);
        //     }
        //     return res.redirect('/auth/wechat/connect');
        // });
        // console.log('link wechat callback-->', err, user, info)
        co(function* () {
            if (err) {

                return res.redirect('/auth/fail');
            }
            if (!user) { return res.redirect('/auth/fail') }
            var loginInfo = user;
            if (!loginInfo.loginProvider) {
                return res.redirect('/auth/fail');
            }
            // console.log('bind--->currentuser-->', req.user);
            var o = yield userStore.findLogin(loginInfo.loginProvider, loginInfo.id);
            if (o && o.id) {
                return res.redirect('/wx/manage');
            }
            var login = yield userStore.addLogin(loginInfo.loginProvider, loginInfo.id, req.user.id, loginInfo.unionid);
            return res.redirect('/wx/manage');
        }).catch(err=>next(err));
    })(req, res, next);
});

router.get('/auth/fail', function (req, res, next) {

    res.render('./account/oauth_fail.html', { layout: 'layout_wx.html', title: '登录失败', error: '' })
});


router.get('/bind/wechat', auth.authorize(), wrap(function* (req, res, next) {
    var loginInfo = req.user;
    // if (!loginInfo || loginInfo.loginProvider) {
    //     return res.redirect('/login');
    // }
    res.render('./account/bind_wechat.html', { layout: 'layout_wx.html', title: '绑定帐号', error: '' })
}));

router.post('/bind/wechat', auth.authorize(), function (req, res, next) {
    var loginInfo = req.user;
    // if (!loginInfo || loginInfo.loginProvider) {
    //     return res.redirect('/login');
    // }
    // console.log('bind_wechat--->', loginInfo);
    passport.authenticate('local', function (err, user, info) {
        co(function* () {
            if (err) {
                var model = {
                    layout: 'layout_wx.html',
                    title: '绑定帐号',
                    error: mapError(err.code),
                    wechatConnect: '/auth/wechat'
                }
                return res.render('./account/bind_wechat.html', model);
            }
            if (!user) { return res.redirect('/auth/fail') }
            console.log('bind wechat callback--->', err, user, info);
            if (!loginInfo.loginProvider) {
                return res.redirect('/auth/fail');
            }
            // console.log('bind--->currentuser-->', req.user);
            var login = yield userStore.addLogin(loginInfo.loginProvider, loginInfo.id, user.id, loginInfo.unionid);
            // console.log('add logininfo-->', login);
            var success = yield signIn.logIn(req, user);
            if (!success) {
                throw new Error('login error!');
            }
            return res.redirect('/wx/manage');

        }).catch(function (err) {
            return next(err);
        });
    })(req, res, next);
});

router.get('/login', function (req, res, next) {
    if (req.isAuthenticated() && !req.user.loginProvider) {
        res.redirect('/wx/manage');
    }
    var returnUrl = req.query.returnTo || '/';
    var authUrl = '/auth/wechat?returnTo=' + returnUrl;
    console.log('user-agent---->', req.headers["user-agent"]);
    var ua = req.headers["user-agent"];
    if (utils.isWeixin(ua)) {
        return res.redirect(authUrl);
    }
    res.render('./account/login.html', { title: '欢迎回来', error: '', wechatConnect: authUrl, returnTo: returnUrl })
});

function mapError(code) {
    var loginErrors = {
        'usernotexist': '用户不存在',
        'invalidpassword': '用户名与密码不匹配',
        'servererror': '登录错误'
    };
    var login_state = code || 1;
    var errorCode = 'servererror';
    switch (login_state) {
        case 211:
            errorCode = 'usernotexist';
            break;
        case 210:
            errorCode = 'invalidpassword';
            break;
        default:
            errorCode = 'servererror';
            break;
    }
    return loginErrors[errorCode];
}


router.post('/login', function (req, res, next) {
    req.checkBody('username', '学习账号不能为空').notEmpty();
    req.checkBody('password', '密码不能为空').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        var msg = errors[0].msg;
        return res.render('./account/login.html', { title: '欢迎回来', error: msg, wechatConnect: '/auth/wechat' });
    }
    passport.authenticate('local', { failureRedirect: '/login' }, function (err, user, info) {
        // console.log(err, user, info);

        if (err) {
            return res.render('./account/login.html', { title: '欢迎回来', error: mapError(err.code), wechatConnect: '/auth/wechat' });
        }
        if (!user) {
            var errmessage = '';
            if (info && typeof info.code != 'undefined') {
                errmessage = mapError(info.code);
            } else {
                errmessage = info.message;
            }
            return res.render('./account/login.html', { title: '欢迎回来', error: errmessage || '出错了', wechatConnect: '/auth/wechat' });
        }
        co(function* () {
            var l = yield signIn.logIn(req, user);
            if (user.AVUser) {
                res.saveCurrentUser(user);
            }

            if (l) {
                return res.redirect('/wx/manage');
            } else {
                throw new Error('login error!');
            }
        }).catch(err => next(err));


    })(req, res, next);
});
router.get('/wxlogin', function (req, res, next) {
    res.render('./account/signup.html', { layout: 'layout_wx.html', title: '登录学习账号', error: '' })
});
router.post('/wxlogin', function (req, res, next) {
    req.checkBody('username', '学习账号不能为空').notEmpty();
    req.checkBody('password', '密码不能为空').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        var msg = errors[0].msg;
        return res.render('./account/wxlogin.html', { layout: 'layout_wx.html', title: '登录学习账号', error: msg });
    }
    passport.authenticate('local', { failureRedirect: '/login' }, function (err, user, info) {
        if (err) {
            return res.render('./account/wxlogin.html', { layout: 'layout_wx.html', title: '登录学习账号', error: mapError(err.code) });
        }
        if (!user) {
            var errmessage = '';
            if (info && typeof info.code != 'undefined') {
                errmessage = mapError(info.code);
            } else {
                errmessage = info.message;
            }
            return res.render('./account/wxlogin.html', { layout: 'layout_wx.html', title: '欢迎回来', error: errmessage || '出错了', wechatConnect: '/auth/wechat' });
        }
        co(function* () {
            var l = yield signIn.logIn(req, user);
            if (user.AVUser) {
                res.saveCurrentUser(user);
            }

            if (l) {
                return res.redirect('/wx/manage');
            } else {
                throw new Error('login error!');
            }
        }).catch(err => next(err));


    })(req, res, next);
});

router.get('/signup', function (req, res, next) {
    res.render('./account/signup.html', { title: '创建帐号' })
});

router.post('/signup', wrap(function* (req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    if (!username || username.trim().length == 0
        || !password || password.trim().length == 0) {
        return res.redirect('/signup?errMsg=用户名或密码不能为空');
    }
    var loginUser = {};
    var errormessage = '';
    try {
        loginUser = yield userStore.AVUser.signUp(username, password);
        var _u = { id: loginUser.id };
        _u.username = loginUser.getUsername();
        _u.email = loginUser.getEmail();
        _u.phone = loginUser.get('mobilePhoneNumber');
        _u._sessionToken = loginUser._sessionToken;
        _u.AVUser = loginUser;
        var l = yield signIn.logIn(req, _u);
        res.saveCurrentUser(loginUser);
        res.redirect('/wx/manage');
    } catch (error) {
        if (error.code && error.code == 202)//username existed
        {
            errormessage = error.message || '用户名已存在';
            return res.render('./account/signup.html', { title: '创建帐号', error: errormessage });
        } else {
            throw error;
        }
    }
}));

router.get('/logout', function (req, res, next) {
    // req.currentUser.logOut();
    // res.clearCurrentUser();
    req.logout();
    if (req.currentUser && res.clearCurrentUser) {
        req.currentUser.logOut();
        res.clearCurrentUser();
    }
    var redirect = '/login';
    if (req.query && req.query.returnTo) {
        redirect = '/wxlogin';
    }
    return res.redirect(redirect);
})



module.exports = router;