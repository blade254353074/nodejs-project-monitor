var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    validate = require('mongoose-validator');

var partSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    // 属于哪个project
    belong_to: {
        type: Schema.Types.ObjectId,
        required: true
    }
}, {
    collection: 'parts'
});

module.exports = mongoose.model('Parts', partSchema);
