const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    driverId: {
        type: String,
        default: null
    },
    type: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    rideId: {
        type: String,
        default: null
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', notificationSchema);




