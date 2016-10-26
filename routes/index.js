var express = require('express');
var router = express.Router();
var AV = require('leanengine');
var auth = require('../middlewares/auth');
var wechatApi = require('../lib/wechatApi').api;
/* GET home page. */
router.get('/', function (req, res) {
  res.render('index', { title: 'Express', qrcode: '' });
});

router.get('/qrcode', auth.authorize(), function (req, res, next) {
  var currentUser = req.user;
  wechatApi.createLimitQRCode(currentUser.id, function (err, result) {
    if (req.timedout) return;
    if (err) {
      return res.render('qrcode', { title: 'Express', qrcode: '' });
    }
    var qrcodeUrl = wechatApi.showQRCodeURL(result.ticket)+'?uid='+currentUser.id;
    return res.render('qrcode', { title: 'Express', qrcode: qrcodeUrl })
  });

});

router.get('/setting/menu', function (req, res, next) {
  wechatApi.getMenu(function (err, result) {
    var model = '';
    if (err)
      model = ''
    else {
      model = result.menu;
    }
    res.render('set_wechat_menu', { title: '设置微信菜单', model: model })
  });
});
router.post('/setting/menu', function (req, res, next) {
  if (!req.body.menu) {
    return res.render('set_wechat_menu', { title: '设置微信菜单', message: '菜单不能为空' })
  }
  var menu = JSON.parse(req.body.menu);
  wechatApi.createMenu(menu, function (err, result) {
    res.render('set_wechat_menu', { title: '设置微信菜单', model: menu });
  });
});
router.get('/setting/remove_menu', function (req, res, next) {
  wechatApi.removeMenu(function (err, result) {
    res.redirect('/setting/menu');
  });
});
module.exports = router;
