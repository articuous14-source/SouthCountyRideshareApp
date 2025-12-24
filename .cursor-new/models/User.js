const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['driver', 'admin'],
        required: true
    },
    // Driver-specific fields
    age: {
        type: Number,
        default: null
    },
    address: {
        type: String,
        default: ''
    },
    vehicle: {
        type: String,
        default: 'Vehicle TBD'
    },
    vehicles: [{
        type: {
            type: String,
            enum: ['Sedan', 'SUV', 'XL SUV']
        },
        make: String,
        model: String,
        color: String
    }],
    photo: {
        type: String,
        default: ''
    },
    // Admin-specific settings
    textNotificationsEnabled: {
        type: Boolean,
        default: true
    },
    // Driver-specific service fee (as percentage, e.g., 15 for 15%)
    serviceFee: {
        type: Number,
        default: 15,
        min: 0,
        max: 100
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);



