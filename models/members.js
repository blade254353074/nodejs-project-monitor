var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    validate = require('mongoose-validator');

var memberSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    // 属于哪个project
    belong_to: {
        type: Schema.Types.ObjectId,
        required: true
    }
}, {
    collection: 'members'
});

module.exports = mongoose.model('Members', memberSchema);
