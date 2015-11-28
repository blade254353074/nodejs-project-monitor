var express = require('express'),
  router = express.Router();

var crypto = require('crypto');

var Users = require('../models/users');

// 登录请求
router.post('/login', function(req, res, next) {
  var title = '软件项目监控系统',
    username = req.body.username,
    password = req.body.password;

  // 判断用户名密码 为不为空
  if (!username || !password) {
    return res.render('login', {
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
        req.session.user_id = user._id
        return res.redirect('/index');
      }
    }
    // 用户名/密码错误
    return res.render('login', {
      title: title,
      error_tip: '用户名或密码不正确'
    });
  });
});

router.get('/logout', function(req, res, next) {
  req.session.user_id && (req.session.user_id = undefined);
  return res.redirect('/index');
});

module.exports = router;
