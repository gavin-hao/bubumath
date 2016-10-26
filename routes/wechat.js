var express = require('express');
var router = express.Router();

// var wechat = require('wechat');
var wechatMessage = require('../lib/wechatMessage');


//var wechatApi=require('../lib/wechatApi').api;

router.use('/', wechatMessage());



module.exports = router;