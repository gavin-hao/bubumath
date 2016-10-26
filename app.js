var express = require('express');
var expressLayouts = require('express-ejs-layouts');
var expressValidator = require('express-validator');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session')
var bodyParser = require('body-parser');
var timeout = require('connect-timeout');
var passport=require('passport');
//leancloud SDK
var AV = require('leanengine');
var routes = require('./routes/index');
var users = require('./routes/users');
var wechat=require('./routes/wechat');
var account=require('./routes/account');
var wx=require('./routes/wx');

var app = express();
app.enable('trust proxy');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
//app.set('view engine', 'ejs');
// load the expressLayouts middleware
app.use(expressLayouts);
app.set("layout extractScripts", true)
app.set("layout extractStyles", true);

// uncomment after placing your favicon in /public

app.use(favicon(__dirname + '/views/favicon.ico'));
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator({
  errorFormatter: function (param, msg, value) {
        var namespace = param.split('.')
            , root = namespace.shift()
            , formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        };
    }
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'dist')));
app.use(timeout('60s'));
app.use(cookieSession({
  name: 'bubumath.sess',
  keys: ['bubumath:05XgTktKPMkU']
}))

//leancloud middleware
app.use(AV.express());
app.use(AV.Cloud.CookieSession({name:'bubumath.sess', secret: 'bubumath:05XgTktKPMkU', maxAge: 3600000, fetchUser: true }));

//passport 
app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);
app.use('/', account);
app.use('/wx', wx);
app.use('/users', users);
app.use('/wechat',wechat);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  // 如果任何一个路由都没有返回响应，则抛出一个 404 异常给后续的异常处理器
  if (!res.headersSent) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  }
});

// error handlers
app.use(function(err, req, res, next) { // jshint ignore:line
  if (req.timedout && req.headers.upgrade === 'websocket') {
    // 忽略 websocket 的超时
    return;
  }

  var statusCode = err.status || 500;
  if(statusCode === 500) {
    console.error(err.stack || err);
  }
  if(req.timedout) {
    console.error('请求超时: url=%s, timeout=%d, 请确认方法执行耗时很长，或没有正确的 response 回调。', req.originalUrl, err.timeout);
  }
  res.status(statusCode);
  // 默认不输出异常详情
  var error = {}
  if (app.get('env') === 'development'||(req.query.debug)) {
    // 如果是开发环境，则将异常堆栈输出到页面，方便开发调试
    error = err;
  }
  res.render('error', {
    title:'出错了～',
    message: err.message,
    error: error
  });
});



module.exports = app;
