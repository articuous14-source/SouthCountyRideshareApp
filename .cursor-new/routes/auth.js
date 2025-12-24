const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Driver login
router.post('/driver/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username, role: 'driver' });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        req.session.driver = {
            username: user.username,
            name: user.name,
            email: user.email
        };
        
        res.json({ success: true, driver: req.session.driver });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin login
router.post('/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username, role: 'admin' });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        req.session.admin = {
            username: user.username,
            name: user.name,
            email: user.email
        };
        
        res.json({ success: true, admin: req.session.admin });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Driver registration
router.post('/driver/register', async (req, res) => {
    try {
        const { inviteCode, ...driverData } = req.body;
        
        // Validate invite code (you'll need to implement this)
        // For now, we'll skip validation
        
        // Check if username or email already exists
        const existingUser = await User.findOne({
            $or: [
                { username: driverData.username },
                { email: driverData.email }
            ]
        });
        
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        
        // Create new driver
        const newDriver = new User({
            ...driverData,
            role: 'driver',
            vehicle: driverData.vehicle || 'Vehicle TBD'
        });
        
        await newDriver.save();
        
        // Mark invite as used (implement this)
        
        res.json({ success: true, message: 'Driver registered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Error logging out' });
        }
        res.json({ success: true });
    });
});

// Get current user
router.get('/current', async (req, res) => {
    try {
        if (req.session.driver) {
            // Get full driver object from database to include serviceFee
            const driver = await User.findOne({ username: req.session.driver.username, role: 'driver' });
            if (driver) {
                return res.json({ 
                    user: {
                        username: driver.username,
                        name: driver.name,
                        email: driver.email,
                        phone: driver.phone,
                        vehicle: driver.vehicle,
                        vehicles: driver.vehicles,
                        photo: driver.photo,
                        serviceFee: driver.serviceFee
                    }, 
                    role: 'driver' 
                });
            }
            // Fallback to session data if not found
            return res.json({ user: req.session.driver, role: 'driver' });
        }
        if (req.session.admin) {
            // Get full admin object from database
            const admin = await User.findOne({ username: req.session.admin.username, role: 'admin' });
            if (admin) {
                return res.json({ 
                    user: {
                        username: admin.username,
                        name: admin.name,
                        email: admin.email,
                        phone: admin.phone,
                        textNotificationsEnabled: admin.textNotificationsEnabled
                    }, 
                    role: 'admin' 
                });
            }
            // Fallback to session data if not found
            return res.json({ user: req.session.admin, role: 'admin' });
        }
        res.status(401).json({ error: 'Not authenticated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;




