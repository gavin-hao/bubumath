var express = require('express');
var router = express.Router();

var auth = require('../middlewares/auth');

router.use('/wx',auth.authorize({redirectTo:'/auth/wechat'}));
/* GET users listing. */

router.get('/profile', function (req, res, next) {
  res.send(req.user);
});

module.exports = router;
