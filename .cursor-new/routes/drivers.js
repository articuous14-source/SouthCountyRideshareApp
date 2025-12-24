const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Ride = require('../models/Ride');
const DayOff = require('../models/DayOff');
const { requireAuth } = require('../middleware/auth');

// Get all drivers
router.get('/', requireAuth, async (req, res) => {
    try {
        const drivers = await User.find({ role: 'driver' });
        res.json(drivers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get driver by username
router.get('/:username', requireAuth, async (req, res) => {
    try {
        const driver = await User.findOne({ username: req.params.username, role: 'driver' });
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }
        res.json(driver);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get driver's rides
router.get('/:username/rides', requireAuth, async (req, res) => {
    try {
        const rides = await Ride.find({ driverId: req.params.username });
        res.json(rides);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update driver profile
router.put('/:username', requireAuth, async (req, res) => {
    try {
        const user = req.session.driver || req.session.admin;
        
        // Only allow drivers to update their own profile, or admin to update any
        if (req.session.driver && user.username !== req.params.username) {
            return res.status(403).json({ error: 'You can only update your own profile' });
        }
        
        const driver = await User.findOneAndUpdate(
            { username: req.params.username, role: 'driver' },
            req.body,
            { new: true }
        );
        
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }
        
        res.json({ success: true, driver });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get driver's days off
router.get('/:username/days-off', requireAuth, async (req, res) => {
    try {
        const daysOff = await DayOff.find({ driverId: req.params.username });
        res.json(daysOff);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add day off
router.post('/:username/days-off', requireAuth, async (req, res) => {
    try {
        const { date } = req.body;
        const dayOff = new DayOff({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
            driverId: req.params.username,
            date
        });
        await dayOff.save();
        res.json({ success: true, dayOff });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove day off
router.delete('/:username/days-off/:id', requireAuth, async (req, res) => {
    try {
        const dayOff = await DayOff.findOneAndDelete({ 
            id: req.params.id, 
            driverId: req.params.username 
        });
        if (!dayOff) {
            return res.status(404).json({ error: 'Day off not found' });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;




