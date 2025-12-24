const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    createdBy: {
        type: String,
        default: 'admin'
    },
    used: {
        type: Boolean,
        default: false
    },
    usedBy: {
        type: String,
        default: null
    },
    usedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Invite', inviteSchema);




