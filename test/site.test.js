var app = require('../app');
var request = require('supertest')(app);
var should = require('should');

describe('site/test.js', function() {
  var username = 'admin888';
  var password = 'admin888';

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
    var signupUsername = username + 'test';
    var Users = require('../models/users');
    it('should sign up without error and contain username', function(done) {
      Users.findOneAndRemove({
        username: signupUsername
      }, function(error, user) {
        request.post('/signup')
        .send({
          username: signupUsername,
          password: password
        })
        .expect(302, function(err, res) {
          console.log(res);
          should.not.exist(err);
          res.text.should.containEql(signupUsername);
          done();
        });
      });
    });
  });


});
