var passport = require('passport')
    , WechatStrategy = require('passport-wechat').Strategy
    , LocalStrategy = require('passport-local').Strategy;
var config = require('../config').wechat;
var domain = require('../config').domain;
// var AV = require('leanengine');
// var Promise = require("bluebird");
var userStore = require('../lib/userStore');


passport.use('wechat',new WechatStrategy({
    appID: config.appid,
    name: 'wechat',
    appSecret: config.appsecret,
    client: 'wechat',
    callbackURL: domain + '/auth/wechat/callback',
    scope: 'snsapi_userinfo',
    state: '',
    // getToken: wechatApi.getToken,
    // saveToken: wechatApi.saveToken
},
    function (accessToken, refreshToken, profile, expires_in, done) {
        process.nextTick(function () {
            console.log('wechat login --->',profile);
            var user = {
                id: profile.openid,
                unionid: profile.unionid,
                loginProvider: 'wechat'
            }
            return done(null, user, 'success');
        });
    }
));

//LocalStrategy
passport.serializeUser(function (user, done) {
    //    var authData=user.id+''+
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
    // userStore.findUserById(user.id).then(
    //     function (u) {
    //         var _u = { id: u.id };
    //         _u.username = u.getUsername();
    //         _u.email = u.getEmail();
    //         _u.phone = u.get('mobilePhoneNumber');
    //         _u._sessionToken = u._sessionToken;
    //         _u.AVUser = u;

    //         return done(null, _u);
    //     },
    //     function (err) {
    //         console.log('fetch user error in passport---->', err);
    //         return done(false, user);
    //     })

});

passport.use(new LocalStrategy(
    {
        usernameField: 'username',
        passwordField: 'password'
    }, function (username, password, done) {
        // asynchronous verification, for effect...
        process.nextTick(function () {
            userStore.AVUser.logIn(username, password).then(function (user) {
                var _u = { id: user.id };
                _u.username = user.getUsername();
                _u.email = user.getEmail();
                _u.phone = user.get('mobilePhoneNumber');
                _u._sessionToken = user._sessionToken;
                _u.AVUser = user;
                return done(null, _u, { code: 0 });
            }).catch(err => done(err, false, { code: err.code }));

        });
    }
));



module.exports = passport;