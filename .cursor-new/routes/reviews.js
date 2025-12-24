const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const { requireAdmin } = require('../middleware/auth');

// Get all reviews
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};
        const reviews = await Review.find(query).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get approved reviews (for home page)
router.get('/approved', async (req, res) => {
    try {
        const reviews = await Review.find({ status: 'approved' })
            .sort({ createdAt: -1 })
            .limit(6);
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create review (from customer)
router.post('/', async (req, res) => {
    try {
        const reviewData = req.body;
        reviewData.id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
        reviewData.status = 'pending';
        
        const review = new Review(reviewData);
        await review.save();
        
        res.json({ success: true, review });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Approve review
router.post('/:id/approve', requireAdmin, async (req, res) => {
    try {
        const review = await Review.findOneAndUpdate(
            { id: req.params.id },
            { 
                status: 'approved',
                reviewedBy: req.session.admin.username,
                reviewedAt: new Date()
            },
            { new: true }
        );
        
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }
        
        res.json({ success: true, review });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reject review
router.post('/:id/reject', requireAdmin, async (req, res) => {
    try {
        const review = await Review.findOneAndUpdate(
            { id: req.params.id },
            { 
                status: 'rejected',
                reviewedBy: req.session.admin.username,
                reviewedAt: new Date()
            },
            { new: true }
        );
        
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }
        
        res.json({ success: true, review });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete review
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const review = await Review.findOneAndDelete({ id: req.params.id });
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;




