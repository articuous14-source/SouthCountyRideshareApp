const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Ride = require('../models/Ride');
const { requireAdmin } = require('../middleware/auth');

// Get admin dashboard overview
router.get('/overview', requireAdmin, async (req, res) => {
    try {
        const rides = await Ride.find();
        const drivers = await User.find({ role: 'driver' });
        
        const pendingRides = rides.filter(r => r.status === 'pending').length;
        const acceptedRides = rides.filter(r => r.status === 'accepted').length;
        const completedRides = rides.filter(r => r.status === 'completed').length;
        
        // Calculate service fees
        let totalServiceFee = 0;
        rides.forEach(ride => {
            if (ride.status === 'completed' && ride.price) {
                totalServiceFee += ride.price * 0.15;
            }
        });
        
        res.json({
            pendingRides,
            acceptedRides,
            completedRides,
            totalDrivers: drivers.length,
            totalServiceFee
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete driver
router.delete('/drivers/:username', requireAdmin, async (req, res) => {
    try {
        // Set driver's rides back to pending
        await Ride.updateMany(
            { driverId: req.params.username, status: 'accepted' },
            { 
                status: 'pending',
                driverId: null,
                driverName: '',
                confirmed: false,
                confirmedAt: null
            }
        );
        
        const driver = await User.findOneAndDelete({ 
            username: req.params.username, 
            role: 'driver' 
        });
        
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reset driver password
router.post('/drivers/:username/reset-password', requireAdmin, async (req, res) => {
    try {
        const { newPassword } = req.body;
        const driver = await User.findOne({ username: req.params.username, role: 'driver' });
        
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }
        
        driver.password = newPassword;
        await driver.save();
        
        res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update admin settings
router.put('/settings', requireAdmin, async (req, res) => {
    try {
        const admin = req.session.admin;
        if (!admin) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const user = await User.findOne({ username: admin.username, role: 'admin' });
        if (!user) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        
        // Update allowed fields
        if (req.body.name !== undefined) user.name = req.body.name;
        if (req.body.email !== undefined) user.email = req.body.email;
        if (req.body.phone !== undefined) user.phone = req.body.phone;
        if (req.body.textNotificationsEnabled !== undefined) {
            user.textNotificationsEnabled = req.body.textNotificationsEnabled;
        }
        
        await user.save();
        
        // Update session
        req.session.admin = {
            username: user.username,
            name: user.name,
            email: user.email,
            phone: user.phone,
            textNotificationsEnabled: user.textNotificationsEnabled
        };
        
        res.json({ success: true, admin: user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;



