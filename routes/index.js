var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var _ = require('underscore');

mongoose.connect('mongodb://localhost/project');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.on('open', function(callback) {
  console.log('connection success:');
});


var crypto = require('crypto');

var Users = require('../models/users'),
  Projects = require('../models/projects');

/* 注册介面 */
router.get('/signin', function(req, res, next) {
  res.render('user/signin', {
    title: '用户注册'
  });
});

/* 注册请求 */
router.post('/signin', function(req, res, next) {
  var username = req.body.username,
    password = req.body.password;

  // 判断用户名密码 为不为空
  if (!username || !password) {
    return res.render('user/signup', {
      title: title,
      error_tip: '用户名或密码不能为空'
    });
  }

  // 检测是否已存在此用户
  Users.findOne({
    username: username
  }, function(err, user) {
    if (err) return console.error(err);
    // 已存在
    if (user) {
      return res.render('user/signin', {
        title: '用户注册',
        error_tip: '已存在此用户名'
      });
    }
    shasum = crypto.createHash('sha1');
    shasum.update(password);
    password = shasum.digest('hex');
    var newUser = new Users({
      username: username,
      password: password
    });
    newUser.save(function(err, user, numAffected) {
      if (err) {
        var errorMsg = [];
        _.each(err.errors, function(val, key, list) {
          errorMsg.push(val.message)
        });
        return res.render('user/signin', {
          title: '用户注册',
          error_tip: '注册失败\n' + errorMsg.join('\n')
        });
      }
      // 注册成功，添加_id到session
      req.session.user_id = user._id;
      req.session.username = user.username;
      return res.redirect('/index');
    });
  });
});

/* 登录介面 */
router.get('/', function(req, res, next) {
  if (req.session.user_id) {
    return res.redirect('/index');
  }
  res.render('user/signup', {
    title: '软件项目监控系统'
  });
});

// 登录请求
router.post('/signup', function(req, res, next) {
  var title = '软件项目监控系统',
    username = req.body.username,
    password = req.body.password;

  // 判断用户名密码 为不为空
  if (!username || !password) {
    return res.render('user/signup', {
      title: title,
      error_tip: '用户名或密码不能为空'
    });
  }
  Users.findOne({
    username: username
  }, function(err, user) {
    var shasum;
    if (err) return console.error(err);
    if (user) {
      shasum = crypto.createHash('sha1');
      shasum.update(password);
      if (shasum.digest('hex') === user.password) {
        // 验证通过，添加_id到session
        req.session.user_id = user._id;
        req.session.username = user.username;
        return res.redirect('/index');
      }
    }
    // 用户名/密码错误
    return res.render('user/signup', {
      title: title,
      error_tip: '用户名或密码不正确'
    });
  });
});


// 退出请求
router.get('/signout', function(req, res, next) {
  // console.log(req.session);
  if (req.session.user_id) {
    req.session.user_id = undefined;
    req.session.username = undefined;
  }
  return res.redirect('/index');
});

// 拦截请求
router.use(/[^css|js|imgs].*/, function(req, res, next) {
  if (!req.session.user_id) {
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      // 如果是 ajax 请求 则返回401
      res.status(401)
        .send();
    } else {
      // 普通整页请求直接重定向
      res.redirect('/');
    }
  } else {
    next();
  }
});


// 项目列表首页请求
router.get('/index', function(req, res, next) {
  Projects.where({
      belong_to: req.session.user_id,
      delete: false
    })
    .populate({
      path: 'members',
      select: {
        name: 1
      }
    })
    .sort({
      create_at: -1
    })
    .exec(function(err, projects) {
      if (err) return console.error(err);
      res.render('index', {
        title: '软件项目监控系统',
        username: req.session.username,
        projects: projects
      });
    });
});



module.exports = router;
