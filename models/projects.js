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


var projectSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    create_at: {
        type: Date,
        required: true
    },
    pic: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    start_at: {
        type: Date,
        required: true
    },
    complete_at: {
        type: Date,
        required: true
    },
    funds: {
        type: String,
        required: true
    },
    manpower: {
        type: String,
        required: true
    },
    remark: {
        type: String
    },
    belong_to: {
        type: Schema.Types.ObjectId,
        required: true
    },
    // 分组
    parts: [{
        type: Schema.Types.ObjectId,
        ref: 'Parts'
    }],
    // 成员
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'Members'
    }],
    // 计划
    plans: [{
        type: Schema.Types.ObjectId,
        ref: 'Plans'
    }]
}, {
    collection: 'projects'
});

module.exports = mongoose.model('Projects', projectSchema);
