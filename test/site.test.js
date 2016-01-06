var fs = require('fs');
var app = require('../app');
// var request = require('supertest')(app);
var session = require('supertest-session');
var should = require('should');
var Q = require('q');

var request;

var Users = require('../models/users');

before(function() {
  request = session(app);
});

describe('site/test.js', function() {
  var username = 'admin888';
  var password = 'admin888';
  var signupUsername = username + 'test';

  // 注册功能
  describe('sign up', function() {
    it('should not sign up an user when username is empty', function(done) {
      request.post('/signup')
        .send({
          username: '',
          password: password
        })
        .expect(200, function(err, res) {
          should.not.exist(err);
          res.text.should.containEql('用户名或密码不能为空');
          done();
        });
    });
    it('should not sign up an user when password is empty', function(done) {
      request.post('/signup')
        .send({
          username: username,
          password: ''
        })
        .expect(200, function(err, res) {
          should.not.exist(err);
          res.text.should.containEql('用户名或密码不能为空');
          done();
        });
    });
    it('should not sign up an user when username is exist', function(done) {
      request.post('/signup')
        .send({
          username: username,
          password: password
        })
        .expect(200, function(err, res) {
          should.not.exist(err);
          res.text.should.containEql('已存在此用户名');
          done();
        });
    });
    it('should not sign up an user when username length is less than 6 and great than 18', function(done) {
      request.post('/signup')
        .send({
          username: 'ad888',
          password: password
        })
        .expect(200, function(err, res) {
          should.not.exist(err);
          res.text.should.containEql('用户名应为6-18个字符');
          done();
        });
    });
    it('should sign up ' + signupUsername + ' without error and contain username', function(done) {
      request.post('/signup')
        .send({
          username: signupUsername,
          password: password
        })
        .expect(302)
        .expect('Location', '/index')
        .end(function(err, res) {
          should.not.exist(err);
          res.text.should.containEql('Redirect');
          done();
        });
    });
    after(function() {
      // 删除测试用户
      Users.findOneAndRemove({
        username: signupUsername
      }).exec();
    });
  });

  // 登录功能
  describe('sign in', function() {
    it('should not sign in when username is empty', function(done) {
      request.post('/signin')
        .send({
          username: '',
          password: password
        })
        .expect(200, function(err, res) {
          should.not.exist(err);
          res.text.should.containEql('用户名或密码不能为空');
          done();
        });
    });
    it('should not sign in when password is empty', function(done) {
      request.post('/signin')
        .send({
          username: username,
          password: ''
        })
        .expect(200, function(err, res) {
          should.not.exist(err);
          res.text.should.containEql('用户名或密码不能为空');
          done();
        });
    });
    it('should not sign in when password is not valid', function(done) {
      request.post('/signin')
        .send({
          username: username,
          password: password + Math.random()
        })
        .expect(200, function(err, res) {
          should.not.exist(err);
          res.text.should.containEql('用户名或密码不正确');
          done();
        });
    });
    it('should not sign in when username is not exist', function(done) {
      request.post('/signin')
        .send({
          username: username + Math.random(),
          password: password
        })
        .expect(200, function(err, res) {
          should.not.exist(err);
          res.text.should.containEql('用户名或密码不正确');
          done();
        });
    });
    it('should sign in when username & password is correct and without error', function(done) {
      request.post('/signin')
        .send({
          username: username,
          password: password
        })
        .expect(302)
        .expect('Location', '/index')
        .end(function(err, res) {
          should.not.exist(err);
          done();
        });
    });
  });

  // 项目添加
  describe('project adding', function() {
    var complete_at = new Date(); // now
    var start_at = new Date(complete_at.valueOf() - 1000 * 60 * 60 * 24 * 30).toLocaleDateString(); // now + 30d
    complete_at = complete_at.toLocaleDateString();

    function ProjectData() {
      var data = {
        name: '测试项目',
        pic: 'TestPic',
        contact: 18888888888,
        start_at: start_at,
        complete_at: complete_at,
        funds: 40000,
        manpower: 'UI工程师一枚',
      };
      for (var name in data) {
        this[name] = data[name];
      }
      return this;
    }

    it('should get /projects/add when login', function(done) {
      request.get('/projects/add')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .end(function(err, res) {
          should.not.exist(err);
          res.text.should.containEql('添加项目');
          done();
        });
    });
    it('should add a normal project and redirect to parts manage interface without error', function(done) {
      request.post('/projects/add')
        .send(new ProjectData())
        .expect(302)
        .end(function(err, res) {
          should.not.exist(err);
          res.text.should.containEql('Found. Redirecting to /projects/');
          done();
        })
    });
    it('should not add a project when name are not set', function(done) {
      var lackNameData = new ProjectData();
      delete lackNameData.name;
      request.post('/projects/add')
        .send(lackNameData)
        .expect(200)
        .end(function(err, res) {
          should.not.exist(err);
          res.text.should.containEql('添加项目出错');
          done();
        });
    });
    it('should not add a project when start_at & complete_at are not set', function(done) {
      var lackDateData = new ProjectData();
      delete lackDateData.start_at;
      delete lackDateData.complete_at;
      request.post('/projects/add')
        .send(lackDateData)
        .expect(200)
        .end(function(err, res) {
          should.not.exist(err);
          res.text.should.containEql('添加项目出错');
          done();
        });
    });
    it('should not add a project when manpower is not set', function(done) {
      var fakePhoneNumberData = new ProjectData();
      delete  fakePhoneNumberData.manpower;
      request.post('/projects/add')
        .send(fakePhoneNumberData)
        .expect(200)
        .end(function(err, res) {
          should.not.exist(err);
          res.text.should.containEql('添加项目出错');
          done();
        });
    });
    it('should not add a project when contact is not a phone number', function(done) {
      var fakePhoneNumberData = new ProjectData();
      fakePhoneNumberData.contact = 123456;
      request.post('/projects/add')
        .send(fakePhoneNumberData)
        .expect(200)
        .end(function(err, res) {
          should.not.exist(err);
          res.text.should.containEql('添加项目出错');
          done();
        });
    });
    it('should not add a project when funds is too large (Infinity)', function(done) {
      var fakePhoneNumberData = new ProjectData();
      fakePhoneNumberData.funds = Infinity;
      request.post('/projects/add')
        .send(fakePhoneNumberData)
        .expect(200)
        .end(function(err, res) {
          should.not.exist(err);
          res.text.should.containEql('添加项目出错');
          done();
        });
    });
    it('should not add a project when string is too long', function(done) {
      var longStringData = new ProjectData();
      longStringData.pic = fs.readFileSync('./test/longText').toString();
      request.post('/projects/add')
        .send(longStringData)
        .expect(200)
        .end(function(err, res) {
          should.not.exist(err);
          res.text.should.containEql('添加项目出错');
          done();
        });
    });
  });

});
