const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { requireAdmin } = require('../middleware/auth');

// Get all announcements
router.get('/', async (req, res) => {
    try {
        const { active } = req.query;
        const query = active === 'true' ? { isActive: true } : {};
        const announcements = await Announcement.find(query).sort({ createdAt: -1 });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create announcement
router.post('/', requireAdmin, async (req, res) => {
    try {
        const announcementData = req.body;
        announcementData.id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
        
        const announcement = new Announcement(announcementData);
        await announcement.save();
        
        res.json({ success: true, announcement });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update announcement
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const announcement = await Announcement.findOneAndUpdate(
            { id: req.params.id },
            { ...req.body, updatedAt: new Date() },
            { new: true }
        );
        
        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }
        
        res.json({ success: true, announcement });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete announcement
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const announcement = await Announcement.findOneAndDelete({ id: req.params.id });
        if (!announcement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;




