const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    customerName: {
        type: String,
        required: true
    },
    customerEmail: {
        type: String,
        required: true
    },
    customerPhone: {
        type: String,
        required: true
    },
    pickup: {
        type: String,
        required: true
    },
    pickupAddress: {
        street: String,
        city: String,
        state: String,
        zip: String
    },
    destination: {
        type: String,
        required: true
    },
    destinationAddress: {
        street: String,
        city: String,
        state: String,
        zip: String
    },
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    passengers: {
        type: Number,
        required: true,
        min: 1,
        max: 6
    },
    vehicleType: {
        type: String,
        enum: ['Sedan', 'SUV', 'XL SUV'],
        required: true
    },
    flightNumber: {
        type: String,
        default: ''
    },
    airline: {
        type: String,
        default: ''
    },
    baggageClaim: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'completed', 'cancelled', 'cancelled_by_customer', 'rescheduled'],
        default: 'pending'
    },
    cancelledByCustomer: {
        type: Boolean,
        default: false
    },
    cancellationToken: {
        type: String,
        default: null
    },
    driverId: {
        type: String,
        default: null
    },
    driverName: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        default: 0
    },
    recalculatedPrice: {
        type: Number,
        default: null
    },
    priceBreakdown: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    confirmed: {
        type: Boolean,
        default: false
    },
    confirmedAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    rescheduledFrom: {
        type: String,
        default: null
    },
    cancellationFee: {
        type: Number,
        default: 0
    },
    previousDriverId: {
        type: String,
        default: null
    },
    previousDriverName: {
        type: String,
        default: null
    },
    wasGivenUp: {
        type: Boolean,
        default: false
    },
    givenUpAt: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model('Ride', rideSchema);



