const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    rideId: {
        type: String,
        required: true,
        ref: 'Ride'
    },
    customerName: {
        type: String,
        required: true
    },
    customerEmail: {
        type: String,
        required: true
    },
    driverId: {
        type: String,
        default: null
    },
    driverName: {
        type: String,
        default: ''
    },
    // Survey responses
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    overallSatisfaction: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    driverRating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    vehicleRating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    punctuality: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    comments: {
        type: String,
        default: ''
    },
    wouldRecommend: {
        type: Boolean,
        default: false
    },
    surveyToken: {
        type: String,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Survey', surveySchema);


