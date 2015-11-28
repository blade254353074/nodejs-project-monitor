var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  validate = require('mongoose-validator');

var userValidator = [
  validate({
    validator: 'isLength',
    arguments: [6, 18],
    message: '用户名应为{ARGS[0]}-{ARGS[1]}个字符'
  })
];


var userSchema = new Schema({
  username: {
    type: String,
    required: true,
    validate: userValidator
  },
  password: {
    type: String,
    required: true
  },
  sign_at: Date
}, {
  collection: 'users'
});

module.exports = mongoose.model('Users', userSchema);
