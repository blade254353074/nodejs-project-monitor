var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    validate = require('mongoose-validator');

var planSchema = new Schema({
    pic: {
        _id: {
            type: Schema.Types.ObjectId,
            ref: 'Members',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        contact: {
            type: String,
            required: true
        }
    },
    charge_part: {
        _id: {
            type: Schema.Types.ObjectId,
            ref: 'Parts',
            required: true
        },
        name: {
            type: String,
            required: true
        }
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
        type: Number,
        required: true
    },
    manpower: {
        type: String,
        required: true
    },
    remark: {
        type: String
    },
    // 属于哪个project
    belong_to: {
        type: Schema.Types.ObjectId,
        required: true
    },
    complete: {
        type: Boolean,
        default: false
    },
    reality: {
        start_at: {
            type: Date,
            required: true
        },
        complete_at: {
            type: Date,
            required: true
        },
        // 提前/延误
        time_diff: {
            type: Number,
            required: true
        },
        funds: {
            type: Number,
            required: true
        },
        // 盈利/亏损
        funds_diff: {
            type: Number,
            required: true
        },
        manpower: {
            type: String,
            required: true
        }
    }
}, {
    collection: 'plans'
});

module.exports = mongoose.model('Plans', planSchema);
