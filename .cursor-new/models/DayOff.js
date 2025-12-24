const mongoose = require('mongoose');

const dayOffSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    driverId: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('DayOff', dayOffSchema);




