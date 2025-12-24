# Notification Setup Guide

This guide explains how to configure email and SMS notifications for drivers when new rides are requested.

## Overview

When a customer submits a ride request through the website:
1. **Email notifications** are sent to all registered drivers
2. **SMS/text notifications** are sent to all registered drivers (if phone numbers are configured)
3. **Database notifications** are created for each driver to view in the driver portal

## Step 1: Install Required Packages

Run the following command to install the required packages:

```bash
npm install
```

This will install:
- `nodemailer` - For sending emails
- `twilio` - For sending SMS/text messages

## Step 2: Email Configuration

### Option A: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to your Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password

3. **Add to `.env` file**:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-16-character-app-password
```

### Option B: Other Email Services (Outlook, Yahoo, Custom SMTP)

For Outlook:
```env
EMAIL_SERVICE=hotmail
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

For Custom SMTP:
```env
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASSWORD=your-password
```

## Step 3: SMS Configuration (Twilio)

### 1. Create a Twilio Account

1. Go to [https://www.twilio.com/](https://www.twilio.com/)
2. Sign up for a free account (includes $15.50 credit for testing)
3. Verify your phone number

### 2. Get Your Twilio Credentials

1. In your Twilio Console Dashboard, find:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click to reveal)
   - **Phone Number** (get a free trial number)

### 3. Add to `.env` file:

```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**Note:** The `TWILIO_PHONE_NUMBER` should include the country code (e.g., `+1` for US).

## Step 4: Driver Phone Number Format

Ensure driver phone numbers in the database are stored in E.164 format:
- US numbers: `+1XXXXXXXXXX` (e.g., `+15551234567`)
- The system will attempt to auto-format numbers, but it's best to store them correctly

## Step 5: Create `.env` File

Create a `.env` file in the root directory with all your configuration:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/southcounty_rideshare

# Session
SESSION_SECRET=your-secret-key-change-in-production

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-app-password

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Server
PORT=3000
NODE_ENV=development
```

## Step 6: Test the Setup

1. **Start your server**:
   ```bash
   npm start
   ```

2. **Submit a test ride request** through the website

3. **Check the console logs** for notification results:
   - Look for "Email notification sent to..." messages
   - Look for "SMS notification sent to..." messages
   - Check for any error messages

4. **Verify notifications**:
   - Check driver email inboxes
   - Check driver phones for SMS messages
   - Check driver portal for database notifications

## Troubleshooting

### Email Not Sending

1. **Check Gmail App Password**:
   - Make sure you're using an App Password, not your regular password
   - App passwords are 16 characters with no spaces

2. **Check Email Service**:
   - Verify `EMAIL_SERVICE` matches your provider
   - For Gmail, use `gmail`
   - For Outlook, use `hotmail` or `outlook`

3. **Check Console Logs**:
   - Look for specific error messages
   - Common errors: "Invalid login", "Authentication failed"

### SMS Not Sending

1. **Check Twilio Credentials**:
   - Verify Account SID and Auth Token are correct
   - Make sure there are no extra spaces

2. **Check Phone Number Format**:
   - Must include country code (e.g., `+1` for US)
   - Format: `+1XXXXXXXXXX`

3. **Check Twilio Account**:
   - Verify your account is active
   - Check if you have credits remaining
   - Free trial accounts have limitations

4. **Check Driver Phone Numbers**:
   - Ensure drivers have phone numbers in their profiles
   - Phone numbers should be in E.164 format

### Notifications Not Appearing in Database

1. **Check MongoDB Connection**:
   - Verify MongoDB is running
   - Check connection string in `.env`

2. **Check Console Logs**:
   - Look for "Created X database notifications" message
   - Check for any database errors

## Features

### Email Notifications Include:
- Customer name, email, and phone
- Pickup and destination locations
- Date and time
- Number of passengers
- Vehicle type required
- Flight information (if applicable)
- Link to driver portal

### SMS Notifications Include:
- Customer name
- Pickup and destination
- Date and time
- Number of passengers
- Vehicle type required
- Reminder to log in to accept

### Database Notifications:
- Stored in MongoDB for each driver
- Visible in driver portal
- Marked as read/unread
- Linked to specific ride

## Notes

- **Email and SMS are sent asynchronously** - they won't block ride creation if they fail
- **Notifications are sent to ALL drivers** - each driver receives their own notification
- **If email/SMS fails**, the ride is still created successfully
- **Database notifications are always created** even if email/SMS fails
- **Free tier limits**:
  - Gmail: No limit (but may have rate limits)
  - Twilio: $15.50 free credit (approximately 1,000 SMS messages)

## Security Notes

- **Never commit `.env` file** to version control
- **Use App Passwords** for Gmail (not your main password)
- **Keep Twilio credentials secure**
- **Use environment variables** for all sensitive data


