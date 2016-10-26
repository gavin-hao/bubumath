var AV = require('leanengine');
var Promise = require("bluebird");
// var passport = require('../middlewares/passport');
// exports.logIn = function logIn(req, res, next, user, redirect) {
//     return req.logIn(user, function (err) {
//         if (err) {
//             return next(err);
//         }
//         return res.redirect(redirect || '/');
//     });
// }

exports.logIn=function(req,user){
    return new Promise((resolver,reject)=>{
        req.logIn(user,function(err){
            if(err){return reject(err);}
            return resolver(true);
        })
    });
    // return function(callback){
    //     req.logIn(req,user,callback);
    // }
}
// function AVLogin(name, pass) {
//     return new Promise((resolver, reject) => {
//         AV.User.logIn(name, pass).then(resolver, reject);
//     })
// }

// exports.passwordSignIn = function (name, pass) {
// return passport.authenticate('local',function(err, user, info){

// })
// }