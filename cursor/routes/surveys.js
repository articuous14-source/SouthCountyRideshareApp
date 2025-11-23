const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const Ride = require('../models/Ride');
const { requireAdmin } = require('../middleware/auth');
const { sendNotificationsToCustomer } = require('../utils/notifications');
const crypto = require('crypto');

// Get survey by token (customer view - no auth required)
router.get('/:id', async (req, res) => {
    try {
        const { token } = req.query;
        const survey = await Survey.findOne({ id: req.params.id });
        
        if (!survey) {
            return res.status(404).send(`
                <html>
                    <head><title>Survey Not Found</title></head>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h1>Survey Not Found</h1>
                        <p>The survey you're looking for could not be found.</p>
                    </body>
                </html>
            `);
        }
        
        if (!token || survey.surveyToken !== token) {
            return res.status(401).send(`
                <html>
                    <head><title>Invalid Link</title></head>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h1>Invalid Survey Link</h1>
                        <p>This survey link is invalid. Please check your email or contact us.</p>
                    </body>
                </html>
            `);
        }
        
        if (survey.completed) {
            return res.status(400).send(`
                <html>
                    <head><title>Survey Already Completed</title></head>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h1>Survey Already Completed</h1>
                        <p>Thank you! This survey has already been completed.</p>
                    </body>
                </html>
            `);
        }
        
        // Get ride information
        const ride = await Ride.findOne({ id: survey.rideId });
        
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Ride Survey - South County Ride Share</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        background: #f5f5f5; 
                        color: #2c2c2c; 
                        line-height: 1.6;
                        padding: 20px;
                    }
                    .container { 
                        max-width: 700px; 
                        margin: 0 auto; 
                        background: white; 
                        border-radius: 10px; 
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        overflow: hidden;
                    }
                    .header {
                        background: linear-gradient(135deg, #2c2c2c 0%, #4a4a4a 100%);
                        color: white;
                        padding: 2rem;
                        text-align: center;
                    }
                    .header h1 { font-size: 2rem; margin-bottom: 0.5rem; }
                    .header p { font-size: 1.1rem; opacity: 0.9; }
                    .content { padding: 2rem; }
                    .form-group { margin-bottom: 1.5rem; }
                    .form-group label { 
                        display: block; 
                        color: #2c2c2c; 
                        font-weight: 600; 
                        margin-bottom: 0.5rem; 
                        font-size: 1rem;
                    }
                    .rating-group {
                        display: flex;
                        gap: 0.5rem;
                        margin-top: 0.5rem;
                        flex-wrap: wrap;
                    }
                    .rating-option {
                        flex: 1;
                        min-width: 60px;
                        text-align: center;
                    }
                    .rating-option input[type="radio"] {
                        display: none;
                    }
                    .rating-option label {
                        display: block;
                        padding: 0.75rem;
                        border: 2px solid #e0e0e0;
                        border-radius: 5px;
                        cursor: pointer;
                        transition: all 0.3s;
                        font-weight: normal;
                    }
                    .rating-option input[type="radio"]:checked + label {
                        background: #2c2c2c;
                        color: white;
                        border-color: #2c2c2c;
                    }
                    .rating-option label:hover {
                        border-color: #2c2c2c;
                    }
                    textarea {
                        width: 100%;
                        padding: 0.75rem;
                        border: 2px solid #e0e0e0;
                        border-radius: 5px;
                        font-size: 1rem;
                        font-family: inherit;
                        resize: vertical;
                        min-height: 100px;
                    }
                    .checkbox-group {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        margin-top: 0.5rem;
                    }
                    .checkbox-group input[type="checkbox"] {
                        width: 20px;
                        height: 20px;
                        cursor: pointer;
                    }
                    .submit-btn {
                        width: 100%;
                        padding: 1rem;
                        background: #2c2c2c;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        font-size: 1.1rem;
                        font-weight: bold;
                        cursor: pointer;
                        transition: background 0.3s;
                        margin-top: 1rem;
                    }
                    .submit-btn:hover {
                        background: #4a4a4a;
                    }
                    .submit-btn:disabled {
                        background: #ccc;
                        cursor: not-allowed;
                    }
                    .ride-info {
                        background: #f8f9fa;
                        padding: 1rem;
                        border-radius: 5px;
                        margin-bottom: 2rem;
                        font-size: 0.9rem;
                    }
                    .ride-info strong {
                        display: block;
                        margin-bottom: 0.25rem;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Ride Survey</h1>
                        <p>We'd love to hear about your experience!</p>
                    </div>
                    <div class="content">
                        ${ride ? `
                        <div class="ride-info">
                            <strong>Ride Details:</strong>
                            <div>${ride.pickup} → ${ride.destination}</div>
                            <div>${new Date(ride.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${new Date(\`2000-01-01T\${ride.time}\`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</div>
                            ${survey.driverName ? `<div>Driver: ${survey.driverName}</div>` : ''}
                        </div>
                        ` : ''}
                        <form id="surveyForm">
                            <div class="form-group">
                                <label>Overall Rating *</label>
                                <div class="rating-group">
                                    <div class="rating-option">
                                        <input type="radio" id="rating1" name="rating" value="1" required>
                                        <label for="rating1">1</label>
                                    </div>
                                    <div class="rating-option">
                                        <input type="radio" id="rating2" name="rating" value="2" required>
                                        <label for="rating2">2</label>
                                    </div>
                                    <div class="rating-option">
                                        <input type="radio" id="rating3" name="rating" value="3" required>
                                        <label for="rating3">3</label>
                                    </div>
                                    <div class="rating-option">
                                        <input type="radio" id="rating4" name="rating" value="4" required>
                                        <label for="rating4">4</label>
                                    </div>
                                    <div class="rating-option">
                                        <input type="radio" id="rating5" name="rating" value="5" required>
                                        <label for="rating5">5</label>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Overall Satisfaction *</label>
                                <div class="rating-group">
                                    <div class="rating-option">
                                        <input type="radio" id="satisfaction1" name="overallSatisfaction" value="1" required>
                                        <label for="satisfaction1">1</label>
                                    </div>
                                    <div class="rating-option">
                                        <input type="radio" id="satisfaction2" name="overallSatisfaction" value="2" required>
                                        <label for="satisfaction2">2</label>
                                    </div>
                                    <div class="rating-option">
                                        <input type="radio" id="satisfaction3" name="overallSatisfaction" value="3" required>
                                        <label for="satisfaction3">3</label>
                                    </div>
                                    <div class="rating-option">
                                        <input type="radio" id="satisfaction4" name="overallSatisfaction" value="4" required>
                                        <label for="satisfaction4">4</label>
                                    </div>
                                    <div class="rating-option">
                                        <input type="radio" id="satisfaction5" name="overallSatisfaction" value="5" required>
                                        <label for="satisfaction5">5</label>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Driver Rating *</label>
                                <div class="rating-group">
                                    <div class="rating-option">
                                        <input type="radio" id="driver1" name="driverRating" value="1" required>
                                        <label for="driver1">1</label>
                                    </div>
                                    <div class="rating-option">
                                        <input type="radio" id="driver2" name="driverRating" value="2" required>
                                        <label for="driver2">2</label>
                                    </div>
                                    <div class="rating-option">
                                        <input type="radio" id="driver3" name="driverRating" value="3" required>
                                        <label for="driver3">3</label>
                                    </div>
                                    <div class="rating-option">
                                        <input type="radio" id="driver4" name="driverRating" value="4" required>
                                        <label for="driver4">4</label>
                                    </div>
                                    <div class="rating-option">
                                        <input type="radio" id="driver5" name="driverRating" value="5" required>
                                        <label for="driver5">5</label>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Vehicle Rating *</label>
                                <div class="rating-group">
                                    <div class="rating-option">
                                        <input type="radio" id="vehicle1" name="vehicleRating" value="1" required>
                                        <label for="vehicle1">1</label>
                                    </div>
                                    <div class="rating-option">
                                        <input type="radio" id="vehicle2" name="vehicleRating" value="2" required>
                                        <label for="vehicle2">2</label>
                                    </div>
                                    <div class="rating-option">
                                        <input type="radio" id="vehicle3" name="vehicleRating" value="3" required>
                                        <label for="vehicle3">3</label>
                                    </div>
                                    <div class="rating-option">
                                        <input type="radio" id="vehicle4" name="vehicleRating" value="4" required>
                                        <label for="vehicle4">4</label>
                                    </div>
                                    <div class="rating-option">
                                        <input type="radio" id="vehicle5" name="vehicleRating" value="5" required>
                                        <label for="vehicle5">5</label>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Punctuality *</label>
                                <div class="rating-group">
                                    <div class="rating-option">
                                        <input type="radio" id="punctuality1" name="punctuality" value="1" required>
                                        <label for="punctuality1">1</label>
                                    </div>
                                    <div class="rating-option">
                                        <input type="radio" id="punctuality2" name="punctuality" value="2" required>
                                        <label for="punctuality2">2</label>
                                    </div>
                                    <div class="rating-option">
                                        <input type="radio" id="punctuality3" name="punctuality" value="3" required>
                                        <label for="punctuality3">3</label>
                                    </div>
                                    <div class="rating-option">
                                        <input type="radio" id="punctuality4" name="punctuality" value="4" required>
                                        <label for="punctuality4">4</label>
                                    </div>
                                    <div class="rating-option">
                                        <input type="radio" id="punctuality5" name="punctuality" value="5" required>
                                        <label for="punctuality5">5</label>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Comments (Optional)</label>
                                <textarea name="comments" placeholder="Please share any additional feedback..."></textarea>
                            </div>
                            
                            <div class="form-group">
                                <div class="checkbox-group">
                                    <input type="checkbox" id="wouldRecommend" name="wouldRecommend">
                                    <label for="wouldRecommend" style="font-weight: normal; margin: 0;">Would you recommend us to others?</label>
                                </div>
                            </div>
                            
                            <div id="surveyMessage" style="margin-top: 1rem; padding: 1rem; border-radius: 5px; display: none;"></div>
                            
                            <button type="submit" class="submit-btn" id="submitBtn">Submit Survey</button>
                        </form>
                    </div>
                </div>
                <script>
                    document.getElementById('surveyForm').addEventListener('submit', async function(e) {
                        e.preventDefault();
                        const submitBtn = document.getElementById('submitBtn');
                        const messageDiv = document.getElementById('surveyMessage');
                        
                        submitBtn.disabled = true;
                        submitBtn.textContent = 'Submitting...';
                        messageDiv.style.display = 'none';
                        
                        const formData = new FormData(this);
                        const data = {
                            rating: parseInt(formData.get('rating')),
                            overallSatisfaction: parseInt(formData.get('overallSatisfaction')),
                            driverRating: parseInt(formData.get('driverRating')),
                            vehicleRating: parseInt(formData.get('vehicleRating')),
                            punctuality: parseInt(formData.get('punctuality')),
                            comments: formData.get('comments') || '',
                            wouldRecommend: formData.has('wouldRecommend')
                        };
                        
                        try {
                            const response = await fetch(\`/api/surveys/${survey.id}/submit?token=${survey.surveyToken}\`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(data)
                            });
                            
                            const result = await response.json();
                            
                            if (response.ok) {
                                messageDiv.style.display = 'block';
                                messageDiv.style.background = '#d4edda';
                                messageDiv.style.color = '#155724';
                                messageDiv.style.border = '1px solid #c3e6cb';
                                messageDiv.textContent = 'Thank you for your feedback! Your survey has been submitted successfully.';
                                this.reset();
                                submitBtn.textContent = 'Survey Submitted';
                                submitBtn.disabled = true;
                                
                                setTimeout(() => {
                                    document.querySelector('.container').innerHTML = \`
                                        <div class="header">
                                            <h1>Thank You!</h1>
                                            <p>Your feedback is valuable to us</p>
                                        </div>
                                        <div class="content" style="text-align: center; padding: 3rem;">
                                            <p style="font-size: 1.2rem; color: #666;">Thank you for taking the time to complete our survey. We appreciate your feedback!</p>
                                        </div>
                                    \`;
                                }, 2000);
                            } else {
                                throw new Error(result.error || 'Failed to submit survey');
                            }
                        } catch (error) {
                            messageDiv.style.display = 'block';
                            messageDiv.style.background = '#f8d7da';
                            messageDiv.style.color = '#721c24';
                            messageDiv.style.border = '1px solid #f5c6cb';
                            messageDiv.textContent = 'Error: ' + error.message;
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'Submit Survey';
                        }
                    });
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Error loading survey:', error);
        res.status(500).send(`
            <html>
                <head><title>Error</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1>Error</h1>
                    <p>An error occurred while loading the survey. Please contact us directly.</p>
                </body>
            </html>
        `);
    }
});

// Submit survey (customer - no auth required, uses token)
router.post('/:id/submit', async (req, res) => {
    try {
        const { token } = req.query;
        const survey = await Survey.findOne({ id: req.params.id });
        
        if (!survey) {
            return res.status(404).json({ error: 'Survey not found' });
        }
        
        if (!token || survey.surveyToken !== token) {
            return res.status(401).json({ error: 'Invalid survey token' });
        }
        
        if (survey.completed) {
            return res.status(400).json({ error: 'Survey already completed' });
        }
        
        // Update survey with responses
        survey.rating = req.body.rating;
        survey.overallSatisfaction = req.body.overallSatisfaction;
        survey.driverRating = req.body.driverRating;
        survey.vehicleRating = req.body.vehicleRating;
        survey.punctuality = req.body.punctuality;
        survey.comments = req.body.comments || '';
        survey.wouldRecommend = req.body.wouldRecommend || false;
        survey.completed = true;
        survey.completedAt = new Date();
        
        await survey.save();
        
        res.json({ success: true, survey });
    } catch (error) {
        console.error('Error submitting survey:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all surveys (admin only)
router.get('/', requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate, sort } = req.query;
        
        let query = {};
        
        // Apply date filters
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }
        
        // Determine sort order
        const sortOrder = sort === 'oldest' ? 1 : -1;
        
        const surveys = await Survey.find(query)
            .sort({ createdAt: sortOrder })
            .limit(1000); // Limit to prevent performance issues
        
        res.json({ success: true, surveys });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get survey by ID (admin only)
router.get('/admin/:id', requireAdmin, async (req, res) => {
    try {
        const survey = await Survey.findOne({ id: req.params.id });
        if (!survey) {
            return res.status(404).json({ error: 'Survey not found' });
        }
        res.json({ success: true, survey });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;


