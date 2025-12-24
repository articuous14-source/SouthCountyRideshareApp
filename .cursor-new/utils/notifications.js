const nodemailer = require('nodemailer');
const twilio = require('twilio');

/**
 * Check if current time is within quiet hours (20:00 - 09:00)
 * Returns true if notifications should be suppressed for new ride requests
 */
function isQuietHours() {
    const now = new Date();
    const hour = now.getHours();
    // Quiet hours: 20:00 (8 PM) to 09:00 (9 AM)
    return hour >= 20 || hour < 9;
}

// Email transporter setup
let emailTransporter = null;

function initializeEmailTransporter() {
    if (emailTransporter) return emailTransporter;
    
    // Create transporter using environment variables
    // Supports Gmail, Outlook, and other SMTP services
    emailTransporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_APP_PASSWORD
        }
    });
    
    return emailTransporter;
}

// Twilio client setup
let twilioClient = null;

function initializeTwilioClient() {
    if (twilioClient) return twilioClient;
    
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
        console.warn('Twilio credentials not configured. SMS notifications will be disabled.');
        return null;
    }
    
    twilioClient = twilio(accountSid, authToken);
    return twilioClient;
}

/**
 * Send email notification to a driver about a new ride request
 */
async function sendEmailNotification(driver, ride) {
    try {
        const transporter = initializeEmailTransporter();
        
        if (!transporter || !process.env.EMAIL_USER) {
            console.warn('Email not configured. Skipping email notification.');
            return { success: false, error: 'Email not configured' };
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
        
        // Build email content
        let emailContent = `
            <h2>New Ride Request Available</h2>
            <p>Hello ${driver.name},</p>
            <p>A new ride has been requested and is available for acceptance.</p>
            
            <h3>Ride Details:</h3>
            <ul>
                <li><strong>Customer:</strong> ${ride.customerName}</li>
                <li><strong>Email:</strong> ${ride.customerEmail}</li>
                <li><strong>Phone:</strong> ${ride.customerPhone}</li>
                <li><strong>Pickup:</strong> ${ride.pickup}</li>
                <li><strong>Destination:</strong> ${ride.destination}</li>
                <li><strong>Date:</strong> ${formattedDate}</li>
                <li><strong>Time:</strong> ${formattedTime}</li>
                <li><strong>Passengers:</strong> ${ride.passengers}</li>
                <li><strong>Vehicle Type:</strong> ${ride.vehicleType}</li>
        `;
        
        if (ride.flightNumber && ride.flightNumber !== 'N/A') {
            emailContent += `<li><strong>Flight Number:</strong> ${ride.flightNumber}</li>`;
            emailContent += `<li><strong>Airline:</strong> ${ride.airline}</li>`;
        }
        
        if (ride.baggageClaim) {
            emailContent += `<li><strong>Meeting Location:</strong> Baggage Claim Area</li>`;
        }
        
        emailContent += `</ul>`;
        emailContent += `<p>Please log in to the driver portal to accept this ride.</p>`;
        emailContent += `<p>Thank you,<br>South County Ride Share</p>`;
        
        const mailOptions = {
            from: `"South County Ride Share" <${process.env.EMAIL_USER}>`,
            to: driver.email,
            subject: `New Ride Request - ${formattedDate} at ${formattedTime}`,
            html: emailContent
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email notification sent to ${driver.email}:`, info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`Error sending email to ${driver.email}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Send SMS notification to a driver about a new ride request
 */
async function sendSMSNotification(driver, ride) {
    try {
        const client = initializeTwilioClient();
        
        if (!client) {
            console.warn('Twilio not configured. Skipping SMS notification.');
            return { success: false, error: 'SMS not configured' };
        }
        
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;
        if (!fromNumber) {
            console.warn('Twilio phone number not configured. Skipping SMS notification.');
            return { success: false, error: 'Twilio phone number not configured' };
        }
        
        // Format date and time
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
        
        // Build SMS message (max 1600 characters, but keep it concise)
        const smsMessage = `New Ride Request!\n\n` +
            `Customer: ${ride.customerName}\n` +
            `Pickup: ${ride.pickup}\n` +
            `Destination: ${ride.destination}\n` +
            `Date: ${formattedDate} at ${formattedTime}\n` +
            `Passengers: ${ride.passengers}\n` +
            `Vehicle: ${ride.vehicleType}\n\n` +
            `Log in to accept this ride.`;
        
        // Check if driver has a phone number
        if (!driver.phone || driver.phone.trim() === '') {
            console.warn(`Driver ${driver.name} does not have a phone number. Skipping SMS.`);
            return { success: false, error: 'Driver phone number not available' };
        }
        
        // Format phone number (ensure it starts with + and country code)
        let phoneNumber = driver.phone.trim();
        if (!phoneNumber.startsWith('+')) {
            // If no country code, assume US (+1)
            phoneNumber = phoneNumber.replace(/^1/, ''); // Remove leading 1 if present
            phoneNumber = '+1' + phoneNumber.replace(/\D/g, ''); // Remove non-digits and add +1
        }
        
        const message = await client.messages.create({
            body: smsMessage,
            from: fromNumber,
            to: phoneNumber
        });
        
        console.log(`SMS notification sent to ${phoneNumber}:`, message.sid);
        return { success: true, messageSid: message.sid };
    } catch (error) {
        console.error(`Error sending SMS to ${driver.phone}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Send both email and SMS notifications to a driver
 */
async function sendNotificationsToDriver(driver, ride) {
    const results = {
        email: { success: false },
        sms: { success: false }
    };
    
    // Send email
    try {
        results.email = await sendEmailNotification(driver, ride);
    } catch (error) {
        console.error(`Error in email notification for ${driver.email}:`, error);
        results.email = { success: false, error: error.message };
    }
    
    // Send SMS
    try {
        results.sms = await sendSMSNotification(driver, ride);
    } catch (error) {
        console.error(`Error in SMS notification for ${driver.phone}:`, error);
        results.sms = { success: false, error: error.message };
    }
    
    return results;
}

/**
 * Send notifications to all drivers about a new ride request
 */
async function sendNotificationsToAllDrivers(drivers, ride) {
    const results = [];
    
    for (const driver of drivers) {
        const driverResults = await sendNotificationsToDriver(driver, ride);
        results.push({
            driverId: driver.username,
            driverName: driver.name,
            ...driverResults
        });
    }
    
    return results;
}

/**
 * Send email notification to a customer
 */
async function sendEmailToCustomer(customerEmail, customerName, subject, message) {
    try {
        const transporter = initializeEmailTransporter();
        
        if (!transporter || !process.env.EMAIL_USER) {
            console.warn('Email not configured. Skipping customer email notification.');
            return { success: false, error: 'Email not configured' };
        }
        
        const mailOptions = {
            from: `"South County Ride Share" <${process.env.EMAIL_USER}>`,
            to: customerEmail,
            subject: subject,
            html: message
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email notification sent to customer ${customerEmail}:`, info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`Error sending email to customer ${customerEmail}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Send SMS notification to a customer
 */
async function sendSMSToCustomer(customerPhone, customerName, message) {
    try {
        const client = initializeTwilioClient();
        
        if (!client) {
            console.warn('Twilio not configured. Skipping customer SMS notification.');
            return { success: false, error: 'SMS not configured' };
        }
        
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;
        if (!fromNumber) {
            console.warn('Twilio phone number not configured. Skipping customer SMS notification.');
            return { success: false, error: 'Twilio phone number not configured' };
        }
        
        // Check if customer has a phone number
        if (!customerPhone || customerPhone.trim() === '') {
            console.warn(`Customer ${customerName} does not have a phone number. Skipping SMS.`);
            return { success: false, error: 'Customer phone number not available' };
        }
        
        // Format phone number (ensure it starts with + and country code)
        let phoneNumber = customerPhone.trim();
        if (!phoneNumber.startsWith('+')) {
            // If no country code, assume US (+1)
            phoneNumber = phoneNumber.replace(/^1/, ''); // Remove leading 1 if present
            phoneNumber = '+1' + phoneNumber.replace(/\D/g, ''); // Remove non-digits and add +1
        }
        
        const smsResult = await client.messages.create({
            body: message,
            from: fromNumber,
            to: phoneNumber
        });
        
        console.log(`SMS notification sent to customer ${phoneNumber}:`, smsResult.sid);
        return { success: true, messageSid: smsResult.sid };
    } catch (error) {
        console.error(`Error sending SMS to customer ${customerPhone}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Send both email and SMS notifications to a customer
 */
async function sendNotificationsToCustomer(customerEmail, customerPhone, customerName, subject, emailMessage, smsMessage) {
    const results = {
        email: { success: false },
        sms: { success: false }
    };
    
    // Send email
    try {
        results.email = await sendEmailToCustomer(customerEmail, customerName, subject, emailMessage);
    } catch (error) {
        console.error(`Error in email notification for customer ${customerEmail}:`, error);
        results.email = { success: false, error: error.message };
    }
    
    // Send SMS
    try {
        results.sms = await sendSMSToCustomer(customerPhone, customerName, smsMessage);
    } catch (error) {
        console.error(`Error in SMS notification for customer ${customerPhone}:`, error);
        results.sms = { success: false, error: error.message };
    }
    
    return results;
}

/**
 * Send notifications to admin (email and optionally SMS based on settings)
 */
async function sendNotificationsToAdmin(admin, notification, checkSMSEnabled = true) {
    const results = {
        email: { success: false },
        sms: { success: false }
    };
    
    // Always send email
    try {
        results.email = await sendEmailToAdmin(admin, notification);
    } catch (error) {
        console.error(`Error in email notification for admin ${admin.email}:`, error);
        results.email = { success: false, error: error.message };
    }
    
    // Send SMS only if admin has text notifications enabled
    if (checkSMSEnabled && admin.textNotificationsEnabled !== false) {
        try {
            results.sms = await sendSMSToAdmin(admin, notification);
        } catch (error) {
            console.error(`Error in SMS notification for admin ${admin.phone}:`, error);
            results.sms = { success: false, error: error.message };
        }
    } else {
        console.log(`SMS notifications disabled for admin ${admin.username}. Skipping SMS.`);
        results.sms = { success: false, error: 'SMS notifications disabled' };
    }
    
    return results;
}

/**
 * Send email notification to admin
 */
async function sendEmailToAdmin(admin, notification) {
    try {
        const transporter = initializeEmailTransporter();
        
        if (!transporter || !process.env.EMAIL_USER) {
            console.warn('Email not configured. Skipping admin email notification.');
            return { success: false, error: 'Email not configured' };
        }
        
        const mailOptions = {
            from: `"South County Ride Share" <${process.env.EMAIL_USER}>`,
            to: admin.email,
            subject: `Notification: ${notification.title}`,
            html: `
                <h2>${notification.title}</h2>
                <p>${notification.message}</p>
                <p>Thank you,<br>South County Ride Share</p>
            `
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email notification sent to admin ${admin.email}:`, info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`Error sending email to admin ${admin.email}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Send SMS notification to admin
 */
async function sendSMSToAdmin(admin, notification) {
    try {
        const client = initializeTwilioClient();
        
        if (!client) {
            console.warn('Twilio not configured. Skipping admin SMS notification.');
            return { success: false, error: 'SMS not configured' };
        }
        
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;
        if (!fromNumber) {
            console.warn('Twilio phone number not configured. Skipping admin SMS notification.');
            return { success: false, error: 'Twilio phone number not configured' };
        }
        
        // Check if admin has a phone number
        if (!admin.phone || admin.phone.trim() === '') {
            console.warn(`Admin ${admin.name} does not have a phone number. Skipping SMS.`);
            return { success: false, error: 'Admin phone number not available' };
        }
        
        // Format phone number
        let phoneNumber = admin.phone.trim();
        if (!phoneNumber.startsWith('+')) {
            phoneNumber = phoneNumber.replace(/^1/, '');
            phoneNumber = '+1' + phoneNumber.replace(/\D/g, '');
        }
        
        const smsMessage = `${notification.title}: ${notification.message}`;
        
        const smsResult = await client.messages.create({
            body: smsMessage,
            from: fromNumber,
            to: phoneNumber
        });
        
        console.log(`SMS notification sent to admin ${phoneNumber}:`, smsResult.sid);
        return { success: true, messageSid: smsResult.sid };
    } catch (error) {
        console.error(`Error sending SMS to admin ${admin.phone}:`, error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendEmailNotification,
    sendSMSNotification,
    sendNotificationsToDriver,
    sendNotificationsToAllDrivers,
    sendEmailToCustomer,
    sendSMSToCustomer,
    sendNotificationsToCustomer,
    sendEmailToAdmin,
    sendSMSToAdmin,
    sendNotificationsToAdmin,
    initializeEmailTransporter,
    initializeTwilioClient
};

