var app = require('../app');
var request = require('supertest')(app);
var should = require('should');
var Q = require('q');

var userCookie;

var Users = require('../models/users');

describe('site/test.js', function () {
  var username = 'admin888';
  var password = 'admin888';
  var signupUsername = username + 'test';

  // 注册功能
  describe('sign up', function () {
    it('should not sign up an user when username is empty', function (done) {
      request.post('/signup')
        .send({
          username: '',
          password: password
        })
        .expect(200, function (err, res) {
          should.not.exist(err);
          res.text.should.containEql('用户名或密码不能为空');
          done();
        });
    });
    it('should not sign up an user when password is empty', function (done) {
      request.post('/signup')
        .send({
          username: username,
          password: ''
        })
        .expect(200, function (err, res) {
          should.not.exist(err);
          res.text.should.containEql('用户名或密码不能为空');
          done();
        });
    });
    it('should not sign up an user when username is exist', function (done) {
      request.post('/signup')
        .send({
          username: username,
          password: password
        })
        .expect(200, function (err, res) {
          should.not.exist(err);
          res.text.should.containEql('已存在此用户名');
          done();
        });
    });
    it('should not sign up an user when username length is less than 6 and great than 18', function (done) {
      request.post('/signup')
        .send({
          username: 'ad888',
          password: password
        })
        .expect(200, function (err, res) {
          should.not.exist(err);
          res.text.should.containEql('用户名应为6-18个字符');
          done();
        });
    });
    it('should sign up ' + signupUsername + ' without error and contain username', function (done) {
      request.post('/signup')
        .send({
          username: signupUsername,
          password: password
        })
        .end(function (err, res) {
          should.not.exist(err);
          res.text.should.containEql('Redirect');
          done();
        });
    });
    after(function() {
      // 删除测试用户
      Users.findOneAndRemove({
          username: signupUsername
        }).exec(function(err, user) {
          console.log('Deleted user: ' + signupUsername + '\n');
        });
    });
  });

  // 登录功能
  describe('sign in', function () {
    it('should not sign in when username is empty', function (done) {
      request.post('/signin')
        .send({
          username: '',
          password: password
        })
        .expect(200, function (err, res) {
          should.not.exist(err);
          res.text.should.containEql('用户名或密码不能为空');
          done();
        });
    });
    it('should not sign in when password is empty', function (done) {
      request.post('/signin')
        .send({
          username: username,
          password: ''
        })
        .expect(200, function (err, res) {
          should.not.exist(err);
          res.text.should.containEql('用户名或密码不能为空');
          done();
        });
    });
    it('should not sign in when password is not valid', function (done) {
      request.post('/signin')
        .send({
          username: username,
          password: password + Math.random()
        })
        .expect(200, function (err, res) {
          should.not.exist(err);
          res.text.should.containEql('用户名或密码不正确');
          done();
        });
    });
    it('should not sign in when username is not exist', function (done) {
      request.post('/signin')
        .send({
          username: username + Math.random(),
          password: password
        })
        .expect(200, function (err, res) {
          should.not.exist(err);
          res.text.should.containEql('用户名或密码不正确');
          done();
        });
    });
    it('should sign in when username & password is correct and without error', function (done) {
      request.post('/signin')
        .send({
          username: username,
          password: password
        })
        .expect(302)
        .expect('Location', '/index')
        .end(function (err, res) {
          userCookie = res.headers['set-cookie'];
          should.not.exist(err);
          done();
        });
    });
  });

  // 项目添加
  describe('project adding', function() {
    it('should add a normal project and redirect to parts manage interface without error', function (done) {
      var start_at = new Date();
      var complete_at = new Date(start_at - 1000 * 60 * 60 * 24 * 30);
      console.log(userCookie);
      request.post('/add')
        .set('cookie', userCookie)
        .send({
          name: '测试项目' + Math.random(),
          pic: 'TestPic',
          contact: 18888888888,
          start_at: start_at,
          complete_at: complete_at,
          funds: 40000,
          manpower: 'UI工程师一枚'
        })
        .expect(302)
        .end(function(err, res) {
          // console.log(res.headers);
          should.not.exist(err);
          // res.text.should.containEql('分组管理');
          done();
        })
    });
  });

});
