const mongoose = require('mongoose');

const groupMessageSchema = new mongoose.Schema({
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
    fromRole: {
        type: String,
        enum: ['admin', 'driver'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    readBy: [{
        username: String,
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('GroupMessage', groupMessageSchema);

