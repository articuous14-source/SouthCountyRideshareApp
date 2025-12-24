const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Survey = require('../models/Survey');
const { requireAuth } = require('../middleware/auth');
const { calculatePricing } = require('../utils/pricing');
const { sendNotificationsToAllDrivers, sendNotificationsToCustomer, sendNotificationsToAdmin, sendNotificationsToDriver } = require('../utils/notifications');
const crypto = require('crypto');

// Get all rides
router.get('/', requireAuth, async (req, res) => {
    try {
        const rides = await Ride.find().sort({ createdAt: -1 });
        res.json(rides);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get ride by ID (customer confirmation page - no auth required, uses token)
router.get('/:id/confirm', async (req, res) => {
    try {
        const { token } = req.query;
        const ride = await Ride.findOne({ id: req.params.id });
        
        if (!ride) {
            return res.status(404).send(`
                <html>
                    <head><title>Ride Not Found</title></head>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h1>Ride Not Found</h1>
                        <p>The ride you're looking for could not be found.</p>
                    </body>
                </html>
            `);
        }
        
        if (!token || ride.cancellationToken !== token) {
            return res.status(401).send(`
                <html>
                    <head><title>Invalid Link</title></head>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h1>Invalid Confirmation Link</h1>
                        <p>This confirmation link is invalid. Please check your email or contact us.</p>
                    </body>
                </html>
            `);
        }
        
        // Get driver information
        let driver = null;
        let driverPhoto = null;
        if (ride.driverId) {
            driver = await User.findOne({ username: ride.driverId, role: 'driver' });
            if (driver) {
                // Check if photo is stored in database or needs to be retrieved from localStorage
                // For now, we'll use the photo field from the database
                driverPhoto = driver.photo || null;
            }
        }
        
        // Parse vehicle information
        let vehicleType = '';
        let vehicleColor = '';
        let vehicleMakeModel = '';
        if (driver && driver.vehicle) {
            const vehicleParts = driver.vehicle.split(' - ');
            if (vehicleParts.length >= 2) {
                vehicleType = vehicleParts[0];
                const colorMakeModel = vehicleParts[1].split(' ');
                if (colorMakeModel.length >= 3) {
                    vehicleColor = colorMakeModel[0];
                    vehicleMakeModel = colorMakeModel.slice(1).join(' ');
                } else {
                    vehicleMakeModel = vehicleParts[1];
                }
            } else {
                vehicleMakeModel = driver.vehicle;
            }
        }
        
        // Format date and time
        const dateObj = new Date(ride.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = new Date(`2000-01-01T${ride.time}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        
        // Get pricing (use recalculated price if available, otherwise use stored price)
        const totalPrice = ride.recalculatedPrice || ride.price || 0;
        
        // Calculate if cancellation is within 24 hours
        const timeParts = ride.time.split(':');
        const rideDateTime = new Date(dateObj);
        rideDateTime.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
        const now = new Date();
        const hoursUntilRide = (rideDateTime - now) / (1000 * 60 * 60);
        const isWithin24Hours = hoursUntilRide < 24;
        const canCancel = rideDateTime > now && ride.status !== 'completed' && ride.status !== 'cancelled' && ride.status !== 'cancelled_by_customer';
        
        const cancellationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/rides/${ride.id}/cancel-by-customer?token=${ride.cancellationToken}`;
        
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Ride Confirmation - South County Ride Share</title>
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
                        max-width: 800px; 
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
                    .section { margin-bottom: 2rem; }
                    .section h2 { 
                        color: #2c2c2c; 
                        font-size: 1.5rem; 
                        margin-bottom: 1rem; 
                        padding-bottom: 0.5rem;
                        border-bottom: 2px solid #e0e0e0;
                    }
                    .info-grid { 
                        display: grid; 
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
                        gap: 1rem; 
                        margin-top: 1rem;
                    }
                    .info-item { 
                        background: #f8f9fa; 
                        padding: 1rem; 
                        border-radius: 5px; 
                    }
                    .info-item strong { 
                        display: block; 
                        color: #2c2c2c; 
                        margin-bottom: 0.25rem; 
                        font-size: 0.9rem;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .info-item span { 
                        color: #666; 
                        font-size: 1.1rem; 
                    }
                    .driver-card {
                        background: #f8f9fa;
                        border-radius: 10px;
                        padding: 1.5rem;
                        display: flex;
                        gap: 1.5rem;
                        align-items: center;
                        margin-top: 1rem;
                    }
                    .driver-photo {
                        width: 120px;
                        height: 120px;
                        border-radius: 50%;
                        object-fit: cover;
                        border: 4px solid #2c2c2c;
                    }
                    .driver-photo-placeholder {
                        width: 120px;
                        height: 120px;
                        border-radius: 50%;
                        background: #2c2c2c;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 2rem;
                        font-weight: bold;
                        border: 4px solid #2c2c2c;
                    }
                    .driver-info { flex: 1; }
                    .driver-info h3 { 
                        color: #2c2c2c; 
                        font-size: 1.3rem; 
                        margin-bottom: 0.5rem; 
                    }
                    .price-display {
                        background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
                        color: #2c2c2c;
                        padding: 1.5rem;
                        border-radius: 10px;
                        text-align: center;
                        margin: 1.5rem 0;
                    }
                    .price-display .price-label {
                        font-size: 0.9rem;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-bottom: 0.5rem;
                        opacity: 0.8;
                    }
                    .price-display .price-amount {
                        font-size: 2.5rem;
                        font-weight: bold;
                    }
                    .cancel-section {
                        background: #fff3cd;
                        border: 2px solid #ffc107;
                        border-radius: 10px;
                        padding: 1.5rem;
                        margin-top: 2rem;
                    }
                    .cancel-section h3 {
                        color: #856404;
                        margin-bottom: 1rem;
                    }
                    .cancel-section p {
                        color: #856404;
                        margin-bottom: 1rem;
                        line-height: 1.6;
                    }
                    .cancel-btn {
                        display: inline-block;
                        background: #dc3545;
                        color: white;
                        padding: 1rem 2rem;
                        border-radius: 5px;
                        text-decoration: none;
                        font-weight: bold;
                        font-size: 1.1rem;
                        transition: background 0.3s;
                        margin-top: 0.5rem;
                    }
                    .cancel-btn:hover {
                        background: #c82333;
                    }
                    .thank-you {
                        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                        color: white;
                        padding: 2rem;
                        text-align: center;
                        margin-top: 2rem;
                        border-radius: 10px;
                    }
                    .thank-you h2 {
                        font-size: 1.8rem;
                        margin-bottom: 0.5rem;
                    }
                    .thank-you p {
                        font-size: 1.1rem;
                        opacity: 0.95;
                    }
                    @media (max-width: 600px) {
                        .driver-card { flex-direction: column; text-align: center; }
                        .info-grid { grid-template-columns: 1fr; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✓ Ride Confirmed!</h1>
                        <p>Your ride has been successfully confirmed</p>
                    </div>
                    <div class="content">
                        <div class="section">
                            <h2>Ride Details</h2>
                            <div class="info-grid">
                                <div class="info-item">
                                    <strong>Date</strong>
                                    <span>${formattedDate}</span>
                                </div>
                                <div class="info-item">
                                    <strong>Time</strong>
                                    <span>${formattedTime}</span>
                                </div>
                                <div class="info-item">
                                    <strong>Passengers</strong>
                                    <span>${ride.passengers}</span>
                                </div>
                                <div class="info-item">
                                    <strong>Vehicle Type</strong>
                                    <span>${ride.vehicleType || 'TBD'}</span>
                                </div>
                            </div>
                            <div style="margin-top: 1.5rem;">
                                <div class="info-item" style="margin-bottom: 1rem;">
                                    <strong>Pickup Location</strong>
                                    <span>${ride.pickup}</span>
                                </div>
                                <div class="info-item">
                                    <strong>Drop-off Location</strong>
                                    <span>${ride.destination}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="price-display">
                            <div class="price-label">Total Price</div>
                            <div class="price-amount">$${totalPrice.toFixed(2)}</div>
                        </div>
                        
                        <div class="section">
                            <h2>Your Driver</h2>
                            ${driver ? `
                            <div class="driver-card">
                                ${driverPhoto ? `
                                    <img src="${driverPhoto}" alt="${driver.name}" class="driver-photo">
                                ` : `
                                    <div class="driver-photo-placeholder">${driver.name.charAt(0).toUpperCase()}</div>
                                `}
                                <div class="driver-info">
                                    <h3>${driver.name}</h3>
                                    <div class="info-item" style="background: transparent; padding: 0.5rem 0; margin-bottom: 0.5rem;">
                                        <strong>Phone</strong>
                                        <span>${driver.phone || 'N/A'}</span>
                                    </div>
                                    <div class="info-item" style="background: transparent; padding: 0.5rem 0; margin-bottom: 0.5rem;">
                                        <strong>Vehicle</strong>
                                        <span>${vehicleColor ? vehicleColor + ' ' : ''}${vehicleMakeModel || driver.vehicle || 'TBD'}</span>
                                    </div>
                                    ${vehicleType ? `
                                    <div class="info-item" style="background: transparent; padding: 0.5rem 0;">
                                        <strong>Vehicle Type</strong>
                                        <span>${vehicleType}</span>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                            ` : `
                            <div class="info-item">
                                <span>Driver information will be provided soon.</span>
                            </div>
                            `}
                        </div>
                        
                        ${canCancel ? `
                        <div class="cancel-section">
                            <h3>Need to Cancel?</h3>
                            <p>
                                ${isWithin24Hours ? '<strong style="color: #dc3545;">⚠️ Important:</strong> ' : ''}
                                A $20 cancellation fee applies for cancellations made less than 24 hours before the scheduled trip time.
                            </p>
                            <p style="font-size: 0.9em; margin-top: 0.5rem;">
                                This cancellation link is valid until ${formattedDate} at ${formattedTime}.
                            </p>
                            <a href="${cancellationUrl}" class="cancel-btn">Cancel Ride</a>
                        </div>
                        ` : ''}
                        
                        <div class="thank-you">
                            <h2>Thank You for Your Business!</h2>
                            <p>We appreciate you choosing South County Ride Share for your transportation needs. Your driver will contact you if needed. We look forward to serving you!</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Error loading ride confirmation:', error);
        res.status(500).send(`
            <html>
                <head><title>Error</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1>Error</h1>
                    <p>An error occurred while loading your ride confirmation. Please contact us directly.</p>
                </body>
            </html>
        `);
    }
});

// Get ride by ID (authenticated)
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const ride = await Ride.findOne({ id: req.params.id });
        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }
        res.json(ride);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new ride (from customer form)
router.post('/', async (req, res) => {
    try {
        const rideData = req.body;
        rideData.id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
        rideData.status = 'pending';
        // Generate a secure token for customer cancellation
        rideData.cancellationToken = crypto.randomBytes(32).toString('hex');
        
        // Calculate pricing (you'll need to implement this)
        // rideData.price = calculatePricing(rideData);
        
        const ride = new Ride(rideData);
        await ride.save();
        
        // Send notifications to all drivers asynchronously (don't block the response)
        // Get all drivers
        User.find({ role: 'driver' })
            .then(async (drivers) => {
                if (drivers.length === 0) {
                    console.log('No drivers found to notify');
                    return;
                }
                
                // Format date and time for notification message
                const dateObj = new Date(ride.date);
                const formattedDate = dateObj.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
                const formattedTime = new Date(`2000-01-01T${ride.time}`).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
                
                // Check if we're in quiet hours (20:00 - 09:00)
                const now = new Date();
                const hour = now.getHours();
                const isQuietHours = hour >= 20 || hour < 9;
                
                if (isQuietHours) {
                    console.log(`Quiet hours active (${hour}:${now.getMinutes().toString().padStart(2, '0')}). Skipping driver notifications for new ride ${ride.id}`);
                    // Still create database notifications so drivers can see them when they check the dashboard
                    const notificationPromises = drivers.map(async (driver) => {
                        const notification = new Notification({
                            id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
                            driverId: driver.username,
                            type: 'new_ride',
                            title: 'New Ride Request Available',
                            message: `New ride request: ${ride.pickup} to ${ride.destination} on ${formattedDate} at ${formattedTime}`,
                            rideId: ride.id,
                            read: false
                        });
                        return notification.save();
                    });
                    
                    await Promise.all(notificationPromises);
                    console.log(`Created ${drivers.length} database notifications (quiet hours - no email/SMS sent) for new ride ${ride.id}`);
                    return;
                }
                
                // Create database notifications for all drivers
                const notificationPromises = drivers.map(async (driver) => {
                    const notification = new Notification({
                        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
                        driverId: driver.username,
                        type: 'new_ride',
                        title: 'New Ride Request Available',
                        message: `New ride request: ${ride.pickup} to ${ride.destination} on ${formattedDate} at ${formattedTime}`,
                        rideId: ride.id,
                        read: false
                    });
                    return notification.save();
                });
                
                await Promise.all(notificationPromises);
                console.log(`Created ${drivers.length} database notifications for new ride ${ride.id}`);
                
                // Send email and SMS notifications to all drivers
                try {
                    const notificationResults = await sendNotificationsToAllDrivers(drivers, ride);
                    console.log('Notification results:', notificationResults);
                } catch (notificationError) {
                    // Log error but don't fail the ride creation
                    console.error('Error sending notifications to drivers:', notificationError);
                }
            })
            .catch((error) => {
                // Log error but don't fail the ride creation
                console.error('Error fetching drivers for notifications:', error);
            });
        
        res.json({ success: true, ride });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Accept ride
router.post('/:id/accept', requireAuth, async (req, res) => {
    try {
        const ride = await Ride.findOne({ id: req.params.id });
        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }
        
        if (ride.status !== 'pending') {
            return res.status(400).json({ error: 'Ride is not available for acceptance' });
        }
        
        const user = req.session.driver || req.session.admin;
        
        // Check if this ride was previously given up by another driver
        const wasReaccepted = ride.wasGivenUp && ride.previousDriverId && ride.previousDriverId !== user.username;
        const previousDriverName = ride.previousDriverName || 'your previous driver';
        
        ride.status = 'accepted';
        ride.driverId = user.username;
        ride.driverName = user.name;
        // Clear the given up flags since it's been re-accepted
        ride.previousDriverId = null;
        ride.previousDriverName = null;
        ride.wasGivenUp = false;
        ride.givenUpAt = null;
        
        await ride.save();
        
        // Send confirmation email to customer with cancellation link
        const dateObj = new Date(ride.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = new Date(`2000-01-01T${ride.time}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        
        const driver = await User.findOne({ username: user.username, role: 'driver' });
        const cancellationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/rides/${ride.id}/cancel-by-customer?token=${ride.cancellationToken}`;
        
        // Calculate if cancellation is within 24 hours
        const timeParts = ride.time.split(':');
        const rideDateTime = new Date(dateObj);
        rideDateTime.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
        const now = new Date();
        const hoursUntilRide = (rideDateTime - now) / (1000 * 60 * 60);
        const isWithin24Hours = hoursUntilRide < 24;
        
        const emailSubject = `Your Ride Has Been Confirmed - ${formattedDate}`;
        const emailMessage = `
            <h2>Ride Confirmation</h2>
            <p>Dear ${ride.customerName},</p>
            <p>Your ride has been confirmed!</p>
            ${wasReaccepted ? `
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-weight: 600;">⚠️ Driver Change Notice</p>
                <p style="margin: 0.5rem 0 0 0; color: #856404;">Your driver has been changed, but your ride is still confirmed. All other details remain the same.</p>
            </div>
            ` : ''}
            <h3>Driver Information:</h3>
            <ul>
                <li><strong>Name:</strong> ${driver ? driver.name : user.name}</li>
                <li><strong>Phone:</strong> ${driver ? driver.phone : ''}</li>
                <li><strong>Email:</strong> ${driver ? driver.email : ''}</li>
                <li><strong>Vehicle:</strong> ${driver ? driver.vehicle : 'TBD'}</li>
            </ul>
            <h3>Ride Details:</h3>
            <ul>
                <li><strong>Pickup Location:</strong> ${ride.pickup}</li>
                <li><strong>Destination:</strong> ${ride.destination}</li>
                <li><strong>Date:</strong> ${formattedDate}</li>
                <li><strong>Time:</strong> ${formattedTime}</li>
                <li><strong>Passengers:</strong> ${ride.passengers}</li>
            </ul>
            <p>Your driver will contact you if needed.</p>
            <hr>
            <p><strong>Need to cancel?</strong> <a href="${cancellationUrl}" style="color: #dc3545; text-decoration: underline;">Click here to cancel your ride</a></p>
            <p style="font-size: 0.9em; color: #dc3545; font-weight: 600; margin-top: 0.5rem;">
                ${isWithin24Hours ? '⚠️ A $20 cancellation fee applies for cancellations made less than 24 hours before the scheduled trip time.' : 'Note: A $20 cancellation fee applies for cancellations made less than 24 hours before the scheduled trip time.'}
            </p>
            <p style="font-size: 0.85em; color: #666; margin-top: 0.5rem;">This cancellation link is valid until ${formattedDate} at ${formattedTime}. If the link doesn't work, copy and paste this URL into your browser: ${cancellationUrl}</p>
            <p>Thank you for choosing South County Ride Share!</p>
        `;
        const confirmationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/rides/${ride.id}/confirm?token=${ride.cancellationToken}`;
        const driverChangeNotice = wasReaccepted ? ' ⚠️ Driver changed but ride still confirmed.' : '';
        const smsMessage = `Your ride is confirmed! View full details: ${confirmationUrl} ${ride.pickup} to ${ride.destination} on ${formattedDate} at ${formattedTime}. Driver: ${driver ? driver.name : user.name}.${driverChangeNotice} ${isWithin24Hours ? '⚠️ $20 fee if cancelled.' : ''}`;
        
        // Send notifications to customer
        sendNotificationsToCustomer(
            ride.customerEmail,
            ride.customerPhone,
            ride.customerName,
            emailSubject,
            emailMessage,
            smsMessage
        ).catch(err => console.error('Error sending customer confirmation notifications:', err));
        
        res.json({ success: true, ride });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Complete ride
router.post('/:id/complete', requireAuth, async (req, res) => {
    try {
        const ride = await Ride.findOne({ id: req.params.id });
        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }
        
        if (!ride.confirmed) {
            return res.status(400).json({ error: 'Ride pickup must be confirmed before completion' });
        }
        
        ride.status = 'completed';
        ride.completedAt = new Date();
        
        await ride.save();
        
        // Create and send survey to customer
        const surveyToken = crypto.randomBytes(32).toString('hex');
        const surveyId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
        
        const survey = new Survey({
            id: surveyId,
            rideId: ride.id,
            customerName: ride.customerName,
            customerEmail: ride.customerEmail,
            driverId: ride.driverId || null,
            driverName: ride.driverName || '',
            surveyToken: surveyToken,
            completed: false
        });
        
        await survey.save();
        
        // Send survey email to customer
        const surveyUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/surveys/${surveyId}?token=${surveyToken}`;
        const dateObj = new Date(ride.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        const emailSubject = `How was your ride? - ${formattedDate}`;
        const emailMessage = `
            <h2>Thank You for Riding with Us!</h2>
            <p>Dear ${ride.customerName},</p>
            <p>We hope you had a great experience with South County Ride Share!</p>
            <p>Your feedback is important to us. Please take a moment to complete a brief survey about your ride:</p>
            <p style="margin: 2rem 0;">
                <a href="${surveyUrl}" style="display: inline-block; padding: 1rem 2rem; background: #2c2c2c; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Complete Survey</a>
            </p>
            <p style="font-size: 0.9em; color: #666;">If the button doesn't work, copy and paste this URL into your browser: ${surveyUrl}</p>
            <p>Thank you for choosing South County Ride Share!</p>
        `;
        const smsMessage = `Thank you for riding with us! Please share your feedback: ${surveyUrl}`;
        
        // Send survey notification to customer
        sendNotificationsToCustomer(
            ride.customerEmail,
            ride.customerPhone,
            ride.customerName,
            emailSubject,
            emailMessage,
            smsMessage
        ).catch(err => console.error('Error sending survey notification:', err));
        
        res.json({ success: true, ride });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Confirm pickup
router.post('/:id/confirm-pickup', requireAuth, async (req, res) => {
    try {
        const ride = await Ride.findOne({ id: req.params.id });
        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }
        
        ride.confirmed = true;
        ride.confirmedAt = new Date();
        
        await ride.save();
        
        res.json({ success: true, ride });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update ride
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const ride = await Ride.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
        );
        
        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }
        
        res.json({ success: true, ride });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel ride by customer (no auth required, uses token)
router.get('/:id/cancel-by-customer', async (req, res) => {
    try {
        const { token } = req.query;
        const ride = await Ride.findOne({ id: req.params.id });
        
        if (!ride) {
            return res.status(404).send(`
                <html>
                    <head><title>Ride Not Found</title></head>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h1>Ride Not Found</h1>
                        <p>The ride you're looking for could not be found.</p>
                    </body>
                </html>
            `);
        }
        
        if (!token || ride.cancellationToken !== token) {
            return res.status(401).send(`
                <html>
                    <head><title>Invalid Link</title></head>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h1>Invalid Cancellation Link</h1>
                        <p>This cancellation link is invalid or has expired. Please contact us directly to cancel your ride.</p>
                    </body>
                </html>
            `);
        }
        
        if (ride.status === 'cancelled' || ride.status === 'cancelled_by_customer') {
            return res.status(400).send(`
                <html>
                    <head><title>Already Cancelled</title></head>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h1>Ride Already Cancelled</h1>
                        <p>This ride has already been cancelled.</p>
                    </body>
                </html>
            `);
        }
        
        if (ride.status === 'completed') {
            return res.status(400).send(`
                <html>
                    <head><title>Cannot Cancel</title></head>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h1>Cannot Cancel Completed Ride</h1>
                        <p>This ride has already been completed and cannot be cancelled.</p>
                    </body>
                </html>
            `);
        }
        
        // Check if the ride date/time has passed
        const dateObj = new Date(ride.date);
        const timeParts = ride.time.split(':');
        const rideDateTime = new Date(dateObj);
        rideDateTime.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
        
        const now = new Date();
        if (rideDateTime < now) {
            return res.status(400).send(`
                <html>
                    <head><title>Cannot Cancel</title></head>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h1>Cannot Cancel Past Ride</h1>
                        <p>This cancellation link is no longer valid as the ride date and time have passed.</p>
                        <p>If you need assistance, please contact us directly.</p>
                    </body>
                </html>
            `);
        }
        
        // Check if cancellation is within 24 hours (for fee calculation)
        const hoursUntilRide = (rideDateTime - now) / (1000 * 60 * 60);
        const isWithin24Hours = hoursUntilRide < 24;
        const cancellationFee = isWithin24Hours ? 20 : 0;
        
        // Update ride status
        ride.status = 'cancelled_by_customer';
        ride.cancelledByCustomer = true;
        ride.cancelledAt = new Date();
        ride.cancellationFee = cancellationFee;
        await ride.save();
        
        // Format date and time for notifications
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        const formattedTime = new Date(`2000-01-01T${ride.time}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        
        // Send notifications to driver if ride was accepted
        if (ride.driverId) {
            const driver = await User.findOne({ username: ride.driverId, role: 'driver' });
            if (driver) {
                const driverNotification = {
                    type: 'ride_cancelled_by_customer',
                    title: 'Ride Cancelled by Customer',
                    message: `Customer ${ride.customerName} cancelled their ride: ${ride.pickup} → ${ride.destination} on ${formattedDate} at ${formattedTime}`
                };
                
                const driverEmailSubject = `Ride Cancelled by Customer - ${formattedDate}`;
                const driverEmailMessage = `
                    <h2>Ride Cancelled by Customer</h2>
                    <p>Hello ${driver.name},</p>
                    <p>The customer has cancelled their ride.</p>
                    <h3>Cancelled Ride Details:</h3>
                    <ul>
                        <li><strong>Customer:</strong> ${ride.customerName}</li>
                        <li><strong>Pickup Location:</strong> ${ride.pickup}</li>
                        <li><strong>Destination:</strong> ${ride.destination}</li>
                        <li><strong>Date:</strong> ${formattedDate}</li>
                        <li><strong>Time:</strong> ${formattedTime}</li>
                    </ul>
                    <p>This ride has been marked as cancelled by the customer.</p>
                    <p>Thank you,<br>South County Ride Share</p>
                `;
                const driverSmsMessage = `Ride cancelled by customer: ${ride.pickup} to ${ride.destination} on ${formattedDate} at ${formattedTime}. Customer: ${ride.customerName}`;
                
                sendNotificationsToCustomer(
                    driver.email,
                    driver.phone,
                    driver.name,
                    driverEmailSubject,
                    driverEmailMessage,
                    driverSmsMessage
                ).catch(err => console.error('Error sending driver cancellation notifications:', err));
            }
        }
        
        // Send notifications to admins
        const adminNotification = {
            type: 'ride_cancelled_by_customer',
            title: 'Ride Cancelled by Customer',
            message: `Customer ${ride.customerName} cancelled their ride: ${ride.pickup} → ${ride.destination} on ${formattedDate} at ${formattedTime}`
        };
        
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            sendNotificationsToAdmin(admin, adminNotification).catch(err => 
                console.error(`Error sending notifications to admin ${admin.username}:`, err)
            );
        }
        
        // Return success page
        res.send(`
            <html>
                <head>
                    <title>Ride Cancelled</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        h1 { color: #2c2c2c; }
                        p { color: #666; line-height: 1.6; }
                        .success-icon { font-size: 48px; color: #28a745; margin-bottom: 20px; }
                        .fee-notice { background: #fff3cd; border: 2px solid #ffc107; border-radius: 5px; padding: 1rem; margin: 1.5rem 0; color: #856404; }
                        .fee-amount { font-size: 1.2em; font-weight: bold; color: #dc3545; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="success-icon">✓</div>
                        <h1>Ride Successfully Cancelled</h1>
                        <p>Your ride has been cancelled successfully.</p>
                        <p><strong>Ride Details:</strong></p>
                        <p>${ride.pickup} → ${ride.destination}<br>
                        ${formattedDate} at ${formattedTime}</p>
                        ${cancellationFee > 0 ? `
                        <div class="fee-notice">
                            <p><strong>Cancellation Fee Applied</strong></p>
                            <p>Because this cancellation was made less than 24 hours before the scheduled trip time, a <span class="fee-amount">$${cancellationFee}</span> cancellation fee applies.</p>
                            <p style="font-size: 0.9em; margin-top: 0.5rem;">You will be contacted regarding payment of this fee.</p>
                        </div>
                        ` : ''}
                        <p>You and your driver have been notified. If you need to reschedule, please submit a new reservation request.</p>
                        <p>Thank you for using South County Ride Share.</p>
                    </div>
                </body>
            </html>
        `);
    } catch (error) {
        console.error('Error cancelling ride by customer:', error);
        res.status(500).send(`
            <html>
                <head><title>Error</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1>Error</h1>
                    <p>An error occurred while cancelling your ride. Please contact us directly.</p>
                </body>
            </html>
        `);
    }
});

// Cancel ride (admin/driver)
router.post('/:id/cancel', requireAuth, async (req, res) => {
    try {
        const ride = await Ride.findOne({ id: req.params.id });
        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }
        
        if (ride.status === 'cancelled') {
            return res.status(400).json({ error: 'Ride is already cancelled' });
        }
        
        if (ride.status === 'completed') {
            return res.status(400).json({ error: 'Cannot cancel a completed ride' });
        }
        
        // Check if a driver had accepted this ride (before we change the status)
        const wasAccepted = ride.driverId && ride.driverId !== null;
        const cancellingDriverId = ride.driverId; // Save the driver ID before clearing it
        
        // Determine if this is a driver giving up an accepted ride
        const user = await User.findOne({ username: req.session.userId });
        const isDriverGivingUp = user && user.role === 'driver' && wasAccepted && cancellingDriverId === user.username;
        
        // If a driver is giving up a ride, set it back to pending so other drivers can accept it
        // Otherwise, mark it as cancelled (admin cancellation or ride was never accepted)
        if (isDriverGivingUp) {
            ride.status = 'pending'; // Make it available for other drivers
            // Track that this ride was given up and by whom
            ride.previousDriverId = cancellingDriverId;
            ride.previousDriverName = ride.driverName;
            ride.wasGivenUp = true;
            ride.givenUpAt = new Date();
        } else {
            ride.status = 'cancelled';
            ride.cancelledAt = new Date();
        }
        
        // Clear driver assignment when cancelled or given up
        ride.driverId = null;
        ride.driverName = '';
        await ride.save();
        
        // Format date and time for notifications
        const dateObj = new Date(ride.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        const formattedTime = new Date(`2000-01-01T${ride.time}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        
        // Only send customer notifications if:
        // 1. Admin is cancelling (not a driver)
        // 2. OR ride was never accepted (was pending, not accepted by a driver)
        // Do NOT notify customer when a driver gives up an accepted ride - they'll be notified when another driver accepts it
        if (!isDriverGivingUp) {
            // Send notifications to customer (email and SMS)
            const emailSubject = `Your Ride Has Been Cancelled - ${formattedDate}`;
            const emailMessage = `
                <h2>Ride Cancellation Notice</h2>
                <p>Dear ${ride.customerName},</p>
                <p>We regret to inform you that your ride has been cancelled.</p>
                <h3>Cancelled Ride Details:</h3>
                <ul>
                    <li><strong>Pickup Location:</strong> ${ride.pickup}</li>
                    <li><strong>Destination:</strong> ${ride.destination}</li>
                    <li><strong>Date:</strong> ${formattedDate}</li>
                    <li><strong>Time:</strong> ${formattedTime}</li>
                    <li><strong>Passengers:</strong> ${ride.passengers}</li>
                </ul>
                <p>If you need to reschedule, please contact us or submit a new reservation request.</p>
                <p>We apologize for any inconvenience. If you have any questions, please contact us.</p>
                <p>Thank you,<br>South County Ride Share</p>
            `;
            const smsMessage = `Your ride has been cancelled. ${ride.pickup} to ${ride.destination} on ${formattedDate} at ${formattedTime}. Contact us to reschedule.`;
            
            // Send notifications to customer asynchronously
            sendNotificationsToCustomer(
                ride.customerEmail,
                ride.customerPhone,
                ride.customerName,
                emailSubject,
                emailMessage,
                smsMessage
            ).catch(err => console.error('Error sending customer cancellation notifications:', err));
        } else {
            console.log(`Driver ${user.username} gave up ride ${ride.id}. Customer will NOT be notified - they will be notified when another driver accepts the ride.`);
        }
        
        // Create notification for admin and send email/SMS
        const adminNotification = {
            type: isDriverGivingUp ? 'ride_available' : 'ride_cancelled',
            title: isDriverGivingUp ? 'Driver Gave Up Ride' : 'Ride Cancelled',
            message: isDriverGivingUp 
                ? `Driver gave up ride: ${ride.pickup} → ${ride.destination} on ${formattedDate} at ${formattedTime}. Ride is now available for other drivers.`
                : `Ride cancelled: ${ride.pickup} → ${ride.destination} on ${formattedDate} at ${formattedTime}`
        };
        
        // Get all admins and send notifications
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            sendNotificationsToAdmin(admin, adminNotification).catch(err => 
                console.error(`Error sending notifications to admin ${admin.username}:`, err)
            );
        }
        
        // If a driver cancelled (gave up) a ride they had accepted, notify all other drivers (regardless of time)
        // Note: user is already defined above in the isDriverGivingUp check
        if (isDriverGivingUp) {
            // This ride is now available again - notify all other drivers
            const allDrivers = await User.find({ role: 'driver' });
            const otherDrivers = allDrivers.filter(d => d.username !== user.username);
            
            if (otherDrivers.length > 0) {
                // Create database notifications for other drivers
                const notificationPromises = otherDrivers.map(async (driver) => {
                    const notification = new Notification({
                        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
                        driverId: driver.username,
                        type: 'ride_available',
                        title: 'Ride Available (Driver Cancelled)',
                        message: `A ride is now available: ${ride.pickup} to ${ride.destination} on ${formattedDate} at ${formattedTime}`,
                        rideId: ride.id,
                        read: false
                    });
                    return notification.save();
                });
                
                await Promise.all(notificationPromises);
                console.log(`Created ${otherDrivers.length} database notifications for ride made available by driver cancellation`);
                
                // Send email and SMS notifications to other drivers (always, even during quiet hours)
                try {
                    const notificationResults = await sendNotificationsToAllDrivers(otherDrivers, ride);
                    console.log('Notification results for driver cancellation:', notificationResults);
                } catch (notificationError) {
                    console.error('Error sending notifications to drivers after cancellation:', notificationError);
                }
            }
        }
        
        res.json({ success: true, ride });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete ride
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const ride = await Ride.findOneAndDelete({ id: req.params.id });
        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;



