# Email Setup Guide for South County Ride Share

This guide explains how to set up EmailJS to enable automatic email notifications for drivers, admins, and customers.

## Overview

The system sends emails in the following scenarios:
1. **To all drivers** when a ride is accepted (notifying other drivers it's no longer available)
2. **To admin** whenever any notification is created
3. **To customers** when:
   - Their ride is accepted/confirmed
   - Their ride is rescheduled
   - Their ride is cancelled

## Step 1: EmailJS Account Setup

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account (free tier allows 200 emails/month)
3. Verify your email address

## Step 2: Add Email Service

1. In your EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose **Gmail** (or your preferred email service)
4. Connect your email account
5. Note your **Service ID** (you'll need this)

## Step 3: Create Email Templates

You'll need to create **5 EmailJS templates**:

### Template 1: Customer Ride Acceptance Email
- **Template Name:** Customer Ride Accepted
- **Template ID:** (Note this - you'll need it)
- **Subject:** `Your Ride Has Been Confirmed - {{date}}`
- **Content:**
```
Dear {{to_name}},

Your ride has been confirmed!

DRIVER INFORMATION:
Name: {{driver_name}}
Phone: {{driver_phone}}
Email: {{driver_email}}
Vehicle Type: {{driver_vehicle_type}}
Vehicle: {{driver_vehicle_color}} {{driver_vehicle_make_model}}

RIDE DETAILS:
Pickup Location: {{pickup}}
Destination: {{destination}}
Date: {{date}}
Time: {{time}}
Number of Passengers: {{passengers}}
{{#if flight_number}}Flight Number: {{flight_number}}
Airline: {{airline}}{{/if}}
{{#if baggage_claim}}Meeting Location: Baggage Claim Area{{/if}}

Your driver {{driver_name}} will contact you if needed.

Thank you for choosing South County Ride Share!
```
- **To Email:** `{{to_email}}`
- **From Name:** `South County Ride Share`
- **From Email:** Your service email

### Template 2: Customer Ride Rescheduled Email
- **Template Name:** Customer Ride Rescheduled
- **Template ID:** (Note this)
- **Subject:** `Your Ride Has Been Rescheduled - {{date}}`
- **Content:**
```
Dear {{to_name}},

Your ride has been rescheduled.

NEW SCHEDULE:
Date: {{date}}
Time: {{time}}

DRIVER INFORMATION:
Name: {{driver_name}}
Phone: {{driver_phone}}
Email: {{driver_email}}
Vehicle Type: {{driver_vehicle_type}}
Vehicle: {{driver_vehicle_color}} {{driver_vehicle_make_model}}

RIDE DETAILS:
Pickup Location: {{pickup}}
Destination: {{destination}}
Number of Passengers: {{passengers}}
{{#if flight_number}}Flight Number: {{flight_number}}
Airline: {{airline}}{{/if}}

Your driver {{driver_name}} will contact you if needed.

Thank you for choosing South County Ride Share!
```
- **To Email:** `{{to_email}}`
- **From Name:** `South County Ride Share`
- **From Email:** Your service email

### Template 3: Customer Ride Cancelled Email
- **Template Name:** Customer Ride Cancelled
- **Template ID:** (Note this)
- **Subject:** `Your Ride Has Been Cancelled - {{date}}`
- **Content:**
```
Dear {{to_name}},

We regret to inform you that your ride has been cancelled.

CANCELLED RIDE DETAILS:
Pickup Location: {{pickup}}
Destination: {{destination}}
Date: {{date}}
Time: {{time}}
Number of Passengers: {{passengers}}

If you need to reschedule, please contact us or submit a new reservation request.

We apologize for any inconvenience. If you have any questions, please contact us.

Thank you for choosing South County Ride Share!
```
- **To Email:** `{{to_email}}`
- **From Name:** `South County Ride Share`
- **From Email:** Your service email

### Template 4: Driver Notification Email
- **Template Name:** Driver Ride Notification
- **Template ID:** (Note this)
- **Subject:** `{{subject}}`
- **Content:**
```
{{message}}
```
- **To Email:** `{{to_email}}`
- **From Name:** `South County Ride Share`
- **From Email:** Your service email

### Template 5: Admin Notification Email
- **Template Name:** Admin Notification
- **Template ID:** (Note this)
- **Subject:** `{{subject}}`
- **Content:**
```
{{message}}

Notification Type: {{notification_type}}
```
- **To Email:** `{{to_email}}`
- **From Name:** `South County Ride Share`
- **From Email:** Your service email

## Step 4: Get Your Public Key

1. Go to **Account** → **General** in EmailJS dashboard
2. Find your **Public Key** (also called API Key)
3. Copy this key

## Step 5: Update driver-auth.js

Open `driver-auth.js` and update the following:

1. **Initialize EmailJS** (around line 8):
```javascript
if (typeof window !== 'undefined' && typeof emailjs !== 'undefined') {
    emailjs.init("YOUR_PUBLIC_KEY"); // Replace with your actual public key
    EMAILJS_INITIALIZED = true;
}
```

2. **Update Service ID** (replace all instances of `'YOUR_SERVICE_ID'`):
   - Line 190: Customer emails
   - Line 246: Driver notification emails
   - Line 286: Admin notification emails

3. **Update Template IDs**:
   - Line 72: `'YOUR_ACCEPTANCE_TEMPLATE_ID'` - Customer ride acceptance template
   - Line 113: `'YOUR_RESCHEDULE_TEMPLATE_ID'` - Customer ride rescheduled template
   - Line 147: `'YOUR_CANCELLATION_TEMPLATE_ID'` - Customer ride cancelled template
   - Line 247: `'YOUR_DRIVER_NOTIFICATION_TEMPLATE_ID'` - Driver notification template
   - Line 287: `'YOUR_ADMIN_NOTIFICATION_TEMPLATE_ID'` - Admin notification template

## Step 6: Ensure EmailJS is Loaded

Make sure EmailJS is loaded in your HTML files:

- `driver-dashboard.html` - Already includes: `<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>`
- `admin-dashboard.html` - Add the same script tag if not present

## Step 7: Update Admin Email

Make sure your admin email is set correctly in `driver-auth.js`:

In the `DEFAULT_ADMINS` array (around line 330), update the admin email:
```javascript
const DEFAULT_ADMINS = [
    {
        username: 'admin',
        password: 'admin123',
        name: 'Administrator',
        email: 'articuous14@gmail.com' // Update this to your admin email
    }
];
```

## Testing

1. Accept a ride as a driver or admin
2. Check:
   - Customer should receive confirmation email with driver details
   - All other drivers should receive notification email
   - Admin should receive notification email
3. Reschedule a ride and verify customer receives reschedule email
4. Cancel a ride and verify customer receives cancellation email

## Troubleshooting

- **Emails not sending**: Check browser console for errors
- **EmailJS not initialized**: Make sure you've uncommented and added your public key
- **Template errors**: Verify all template variables match what's being sent
- **Service ID errors**: Double-check your EmailJS Service ID is correct
- **Template ID errors**: Verify each template ID matches your EmailJS templates

## Notes

- The free tier allows 200 emails per month
- Emails are sent asynchronously and won't block the application if they fail
- Driver photos are included in the email template parameters (as base64 data URL)
- All email failures are logged to the console but don't break the application flow




