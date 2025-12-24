# Driver Portal Setup Instructions

## Overview

The driver portal allows drivers to:
- Login with their credentials
- View all customer ride requests
- See rides in both list and calendar views
- Accept rides
- Automatically send confirmation emails to customers when accepting rides

## Setup Steps

### 1. Default Driver Credentials

The system comes with two default drivers:
- **Username:** `driver1` | **Password:** `driver123`
- **Username:** `driver2` | **Password:** `driver123`

**⚠️ IMPORTANT:** Change these passwords immediately in `driver-auth.js`!

### 2. Adding/Modifying Drivers

Edit the `DEFAULT_DRIVERS` array in `driver-auth.js`:

```javascript
const DEFAULT_DRIVERS = [
    {
        username: 'driver1',
        password: 'your-secure-password', // Change this!
        name: 'John Driver',
        email: 'driver1@example.com',
        phone: '(555) 123-4567',
        vehicle: 'Sedan - White Toyota Camry'
    },
    // Add more drivers here...
];
```

### 3. EmailJS Configuration for Acceptance Emails

You need to create a second EmailJS template for ride acceptance confirmations:

1. Go to your EmailJS dashboard
2. Create a new template called "Ride Acceptance Confirmation"
3. Use this template:

**Subject:**
```
Your Ride Has Been Confirmed - South County Ride Share
```

**Content:**
```
Hello {{to_name}},

Your ride has been confirmed!

Driver Information:
Name: {{driver_name}}
Phone: {{driver_phone}}
Vehicle: {{driver_vehicle}}

Ride Details:
Pickup Location: {{pickup}}
Destination: {{destination}}
Date: {{date}}
Time: {{time}}
Number of Passengers: {{passengers}}

Your driver will contact you if needed. Thank you for choosing South County Ride Share!

Best regards,
South County Ride Share Team
```

4. Set **To Email** to: `{{to_email}}`
5. Set **From Name** to: `South County Ride Share`
6. Set **From Email** to: `articuous14@gmail.com`

### 4. Update driver-dashboard.js

Open `driver-dashboard.js` and replace:
- `YOUR_SERVICE_ID` with your EmailJS Service ID (line 241)
- `YOUR_ACCEPTANCE_TEMPLATE_ID` with your Acceptance Template ID (line 242)

Also uncomment and add your EmailJS public key at the top:
```javascript
emailjs.init("YOUR_PUBLIC_KEY"); // Add your EmailJS Public Key
```

### 5. Access the Driver Portal

1. Navigate to `driver-login.html` in your browser
2. Login with driver credentials
3. You'll be redirected to the dashboard

## How It Works

### Customer Flow:
1. Customer fills out reservation form on main website
2. Form submission:
   - Sends email to articuous14@gmail.com (via EmailJS)
   - Saves ride request to localStorage
3. Ride appears in driver portal as "Pending"

### Driver Flow:
1. Driver logs into portal
2. Views all rides (pending and accepted)
3. Can switch between List View and Calendar View
4. Clicks "Accept Ride" on pending rides
5. System:
   - Updates ride status to "Accepted"
   - Assigns driver information to ride
   - Sends confirmation email to customer with driver details
6. Customer receives email with driver information

## Features

### List View
- Shows all rides in a card layout
- Pending rides have yellow border and "Accept" button
- Accepted rides show driver information
- Sorted by status (pending first) then by date/time

### Calendar View
- Groups rides by date
- Shows rides for each day
- Easy to see schedule at a glance

### Auto-Refresh
- Dashboard automatically refreshes every 30 seconds
- New ride requests appear automatically

## Security Notes

⚠️ **Important Security Considerations:**

1. **LocalStorage is not secure** - This is a client-side solution. For production use, you should:
   - Use a proper backend database
   - Implement server-side authentication
   - Use HTTPS
   - Store sensitive data securely

2. **Change default passwords** - The default passwords are for testing only.

3. **EmailJS credentials** - Keep your EmailJS keys secure and don't commit them to public repositories.

## Troubleshooting

### Drivers can't see rides
- Check that `driver-auth.js` is loaded before `script.js` in `index.html`
- Verify rides are being saved to localStorage (check browser DevTools)

### Acceptance emails not sending
- Verify EmailJS is initialized in `driver-dashboard.js`
- Check that you've created the acceptance template
- Verify Service ID and Template ID are correct
- Check browser console for errors

### Login not working
- Verify driver credentials in `driver-auth.js`
- Check browser console for errors
- Clear browser localStorage and try again

## Future Enhancements

Consider adding:
- Driver profile management
- Ride completion status
- Customer ratings/reviews
- SMS notifications
- Push notifications
- Backend database integration
- Multi-driver assignment
- Route optimization

