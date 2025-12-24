# EmailJS Setup Instructions

To enable automatic email sending from the reservation form, you need to set up EmailJS. Follow these steps:

## Step 1: Create an EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account (free tier allows 200 emails/month)

## Step 2: Add Email Service

1. In your EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose **Gmail** (since you're using articuous14@gmail.com)
4. Connect your Gmail account (articuous14@gmail.com)
5. Note your **Service ID** (you'll need this)

## Step 3: Create Email Template

1. Go to **Email Templates** in your dashboard
2. Click **Create New Template**
3. Use the following template:

**Template Name:** Ride Reservation Request

**Subject:**
```
New Ride Reservation Request - {{from_name}}
```

**Content:**
```
New Ride Reservation Request

Passenger Information:
Name: {{from_name}}
Email: {{from_email}}
Phone: {{phone}}

Ride Details:
Pickup Location: {{pickup}}
Destination: {{destination}}
Date: {{date}}
Time: {{time}}
Number of Passengers: {{passengers}}

---
This email was sent from the South County Ride Share website.
```

4. Set **To Email** to: `articuous14@gmail.com`
5. Set **From Name** to: `South County Ride Share`
6. Set **From Email** to: `articuous14@gmail.com` (or your service email)
7. Note your **Template ID** (you'll need this)

## Step 4: Get Your Public Key

1. Go to **Account** → **General**
2. Find your **Public Key** (also called API Key)
3. Copy this key

## Step 5: Update script.js

Open `script.js` and replace the following placeholders:

1. Replace `YOUR_PUBLIC_KEY` with your EmailJS Public Key (line 4)
2. Replace `YOUR_SERVICE_ID` with your EmailJS Service ID (line 58)
3. Replace `YOUR_TEMPLATE_ID` with your EmailJS Template ID (line 59)

## Example:

```javascript
emailjs.init("abc123xyz456"); // Your Public Key

// Later in the code:
const response = await emailjs.send(
    'service_abc123',      // Your Service ID
    'template_xyz789',     // Your Template ID
    templateParams
);
```

## Testing

1. Fill out the reservation form on your website
2. Submit it
3. Check your email (articuous14@gmail.com) - you should receive the reservation request automatically

## Notes

- The free tier allows 200 emails per month
- Emails are sent automatically without opening the user's email client
- All emails will be sent FROM articuous14@gmail.com TO articuous14@gmail.com
- The form shows a success/error message after submission

## Troubleshooting

- Make sure all three IDs (Public Key, Service ID, Template ID) are correctly entered
- Check the browser console for any error messages
- Verify your Gmail account is properly connected in EmailJS
- Make sure your EmailJS account is activated

