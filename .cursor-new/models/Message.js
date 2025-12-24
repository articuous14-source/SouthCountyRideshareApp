const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    fromUsername: {
        type: String,
        required: true
    },
    fromName: {
        type: String,
        required: true
    },
    toUsername: {
        type: String,
        required: true
    },
    toName: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', messageSchema);




