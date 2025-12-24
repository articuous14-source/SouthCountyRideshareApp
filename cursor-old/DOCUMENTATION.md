# South County Ride Share - Complete Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Database Models](#database-models)
6. [API Endpoints](#api-endpoints)
7. [Frontend Pages](#frontend-pages)
8. [Features](#features)
9. [Setup Instructions](#setup-instructions)
10. [Configuration](#configuration)
11. [Current State](#current-state)
12. [Workflow](#workflow)
13. [Security](#security)
14. [Future Improvements](#future-improvements)

---

## Project Overview

South County Ride Share is a full-stack Node.js web application for managing a private transportation service. The system serves customers in Rancho Santa Margarita, Coto de Caza, Dove Canyon, Ladera Ranch, Rancho Mission Viejo, and surrounding communities.

### Key Capabilities
- **Customer Portal**: Public-facing website for ride reservations and reviews
- **Driver Portal**: Dashboard for drivers to manage rides, profile, and availability
- **Admin Portal**: Administrative dashboard for managing drivers, rides, reviews, and announcements
- **Automated Notifications**: Email and SMS notifications for ride events
- **Ride Management**: Complete lifecycle management from request to completion
- **Review System**: Customer review submission with admin approval workflow

---

## Architecture

### Backend Architecture
- **Framework**: Express.js (Node.js)
- **Database**: MongoDB with Mongoose ODM
- **Session Management**: Express-session with cookie-based authentication
- **API Design**: RESTful API with JSON responses
- **File Structure**: MVC-like pattern with separate routes, models, and utilities

### Frontend Architecture
- **Technology**: Vanilla JavaScript (no frameworks)
- **Styling**: Custom CSS
- **API Communication**: Fetch API with centralized API client (`api-client.js`)
- **State Management**: Server-side sessions (no client-side state management)

### Communication Flow
```
Customer Browser → Express Server → MongoDB
                    ↓
              Session Store
                    ↓
              API Routes → Business Logic → Database Models
```

---

## Technology Stack

### Backend Dependencies
- **express** (^4.18.2): Web framework
- **mongoose** (^8.0.3): MongoDB object modeling
- **bcryptjs** (^2.4.3): Password hashing
- **express-session** (^1.17.3): Session management
- **body-parser** (^1.20.2): Request body parsing
- **cors** (^2.8.5): Cross-origin resource sharing
- **dotenv** (^16.3.1): Environment variable management
- **nodemailer** (^6.9.7): Email notifications
- **twilio** (^4.19.0): SMS notifications
- **emailjs** (^4.0.1): Alternative email service (optional)

### Development Dependencies
- **nodemon** (^3.0.2): Development server with auto-reload

---

## Project Structure

```
south-county-rideshare/
├── server.js                 # Main server entry point
├── package.json              # Dependencies and scripts
├── .env                      # Environment variables (not in repo)
├── middleware/
│   └── auth.js              # Authentication middleware
├── models/                   # MongoDB models
│   ├── User.js              # User/Driver/Admin model
│   ├── Ride.js              # Ride model
│   ├── Review.js            # Review model
│   ├── Message.js           # Message model
│   ├── Notification.js      # Notification model
│   ├── Announcement.js      # Announcement model
│   ├── DayOff.js            # Driver days off model
│   ├── Survey.js            # Customer survey model
│   └── Invite.js            # Driver invite code model
├── routes/                   # API route handlers
│   ├── auth.js              # Authentication routes
│   ├── rides.js             # Ride management routes
│   ├── drivers.js           # Driver management routes
│   ├── admin.js             # Admin routes
│   ├── messages.js          # Messaging routes
│   ├── reviews.js           # Review routes
│   ├── announcements.js     # Announcement routes
│   └── surveys.js           # Survey routes
├── utils/                    # Utility functions
│   ├── pricing.js            # Pricing calculator
│   └── notifications.js     # Email/SMS notification functions
├── public/                   # Static files served to clients
│   ├── index.html           # Main customer-facing page
│   ├── driver-login.html    # Driver login page
│   ├── driver-register.html # Driver registration page
│   ├── driver-dashboard.html # Driver dashboard
│   ├── admin-login.html     # Admin login page
│   ├── admin-dashboard.html # Admin dashboard
│   ├── rates.html           # Pricing rates page
│   ├── script.js            # Main frontend JavaScript
│   ├── driver-auth.js       # Driver authentication functions
│   ├── driver-dashboard.js  # Driver dashboard logic
│   ├── admin-dashboard.js   # Admin dashboard logic
│   ├── pricing-calculator.js # Pricing calculation frontend
│   ├── rates.js             # Rates page logic
│   ├── api-client.js        # Centralized API client
│   ├── styles.css           # Main stylesheet
│   └── assets/              # Images and static assets
│       ├── SC_Rideshare_Final_Logo.jpg
│       └── (other images)
└── Documentation/
    ├── README.md            # Basic setup guide
    ├── DOCUMENTATION.md     # This file
    ├── MIGRATION_STATUS.md  # Migration progress
    ├── DRIVER_PORTAL_SETUP.md
    ├── EMAIL_SETUP_GUIDE.md
    ├── EMAILJS_SETUP.md
    └── NOTIFICATION_SETUP.md
```

---

## Database Models

### User Model (`models/User.js`)
Represents both drivers and admins in the system.

**Fields:**
- `username` (String, required, unique): Login username
- `password` (String, required): Hashed password
- `name` (String, required): Full name
- `email` (String, required, unique): Email address
- `phone` (String): Phone number
- `role` (String, enum: ['driver', 'admin'], required): User role
- `age` (Number): Driver age
- `address` (String): Driver address
- `vehicle` (String): Vehicle description
- `vehicles` (Array): Array of vehicle objects with type, make, model, color
- `photo` (String): Driver photo URL/base64
- `textNotificationsEnabled` (Boolean): Admin notification preference
- `createdAt` (Date): Account creation timestamp

**Methods:**
- `comparePassword(candidatePassword)`: Compare password with hash

### Ride Model (`models/Ride.js`)
Represents ride requests and their lifecycle.

**Fields:**
- `id` (String, required, unique): Unique ride identifier
- `customerName` (String, required): Customer full name
- `customerEmail` (String, required): Customer email
- `customerPhone` (String, required): Customer phone
- `pickup` (String, required): Pickup location
- `pickupAddress` (Object): Detailed pickup address (street, city, state, zip)
- `destination` (String, required): Destination location
- `destinationAddress` (Object): Detailed destination address
- `date` (String, required): Ride date
- `time` (String, required): Ride time
- `passengers` (Number, required, min: 1, max: 6): Number of passengers
- `vehicleType` (String, enum: ['Sedan', 'SUV', 'XL SUV'], required): Required vehicle type
- `flightNumber` (String): Flight number for airport trips
- `airline` (String): Airline name
- `baggageClaim` (Boolean): Driver meets at baggage claim
- `status` (String, enum): 'pending', 'accepted', 'completed', 'cancelled', 'cancelled_by_customer', 'rescheduled'
- `cancelledByCustomer` (Boolean): Customer cancellation flag
- `cancellationToken` (String): Secure token for customer cancellation
- `driverId` (String): Assigned driver username
- `driverName` (String): Assigned driver name
- `price` (Number): Ride price
- `recalculatedPrice` (Number): Updated price if recalculated
- `priceBreakdown` (Object): Detailed price breakdown
- `confirmed` (Boolean): Pickup confirmed flag
- `confirmedAt` (Date): Pickup confirmation timestamp
- `completedAt` (Date): Ride completion timestamp
- `cancelledAt` (Date): Cancellation timestamp
- `cancellationFee` (Number): Cancellation fee amount
- `rescheduledFrom` (String): Original ride ID if rescheduled
- `previousDriverId` (String): Driver who gave up the ride
- `previousDriverName` (String): Name of previous driver
- `wasGivenUp` (Boolean): Whether ride was given up by driver
- `givenUpAt` (Date): When ride was given up
- `createdAt` (Date): Ride creation timestamp

### Review Model (`models/Review.js`)
Customer reviews with approval workflow.

**Fields:**
- `id` (String, required, unique): Unique review identifier
- `customerName` (String, required): Reviewer name
- `customerEmail` (String, required): Reviewer email
- `rating` (Number, required, min: 1, max: 5): Star rating
- `comment` (String, required): Review text
- `approved` (Boolean, default: false): Admin approval status
- `createdAt` (Date): Review submission timestamp

### Message Model (`models/Message.js`)
Internal messaging between users.

**Fields:**
- `id` (String, required, unique): Unique message identifier
- `fromUsername` (String, required): Sender username
- `fromName` (String, required): Sender name
- `toUsername` (String, required): Recipient username
- `toName` (String, required): Recipient name
- `message` (String, required): Message content
- `read` (Boolean, default: false): Read status
- `createdAt` (Date): Message timestamp

### Notification Model (`models/Notification.js`)
In-app notifications for drivers and admins.

**Fields:**
- `id` (String, required, unique): Unique notification identifier
- `driverId` (String): Target driver username (if driver notification)
- `adminId` (String): Target admin username (if admin notification)
- `type` (String): Notification type (e.g., 'new_ride', 'ride_accepted')
- `title` (String, required): Notification title
- `message` (String, required): Notification message
- `rideId` (String): Associated ride ID
- `read` (Boolean, default: false): Read status
- `createdAt` (Date): Notification timestamp

### Announcement Model (`models/Announcement.js`)
Public announcements displayed on website.

**Fields:**
- `id` (String, required, unique): Unique announcement identifier
- `title` (String, required): Announcement title
- `content` (String, required): Announcement content
- `active` (Boolean, default: true): Active status
- `createdAt` (Date): Creation timestamp
- `updatedAt` (Date): Last update timestamp

### DayOff Model (`models/DayOff.js`)
Driver availability/unavailability dates.

**Fields:**
- `id` (String, required, unique): Unique day off identifier
- `driverId` (String, required): Driver username
- `date` (String, required): Date (YYYY-MM-DD format)
- `createdAt` (Date): Creation timestamp

### Survey Model (`models/Survey.js`)
Post-ride customer surveys.

**Fields:**
- `id` (String, required, unique): Unique survey identifier
- `rideId` (String, required): Associated ride ID
- `customerName` (String, required): Customer name
- `customerEmail` (String, required): Customer email
- `driverId` (String): Assigned driver username
- `driverName` (String): Driver name
- `surveyToken` (String, required): Secure token for survey access
- `completed` (Boolean, default: false): Completion status
- `createdAt` (Date): Survey creation timestamp

### Invite Model (`models/Invite.js`)
Driver registration invite codes.

**Fields:**
- `id` (String, required, unique): Unique invite identifier
- `code` (String, required, unique): Invite code
- `used` (Boolean, default: false): Whether code has been used
- `usedBy` (String): Username who used the code
- `usedAt` (Date): When code was used
- `createdAt` (Date): Creation timestamp

---

## API Endpoints

### Authentication (`/api/auth`)

#### `POST /api/auth/driver/login`
Driver login.
- **Body**: `{ username: string, password: string }`
- **Response**: `{ success: true, driver: { username, name, email } }`
- **Session**: Sets `req.session.driver`

#### `POST /api/auth/admin/login`
Admin login.
- **Body**: `{ username: string, password: string }`
- **Response**: `{ success: true, admin: { username, name, email } }`
- **Session**: Sets `req.session.admin`

#### `POST /api/auth/driver/register`
Driver registration.
- **Body**: `{ inviteCode: string, username: string, password: string, name: string, email: string, ... }`
- **Response**: `{ success: true, message: string }`

#### `POST /api/auth/logout`
Logout current user.
- **Response**: `{ success: true }`
- **Session**: Destroys session

#### `GET /api/auth/current`
Get current authenticated user.
- **Response**: `{ user: { username, name, email }, role: 'driver' | 'admin' }`
- **Auth**: Required

### Rides (`/api/rides`)

#### `GET /api/rides`
Get all rides (sorted by creation date, newest first).
- **Auth**: Required
- **Response**: Array of ride objects

#### `GET /api/rides/:id`
Get ride by ID.
- **Auth**: Required
- **Response**: Single ride object

#### `GET /api/rides/:id/confirm`
Get ride confirmation page (public, uses token).
- **Query**: `?token=<cancellationToken>`
- **Response**: HTML page with ride details

#### `POST /api/rides`
Create new ride request (public).
- **Body**: Full ride data object
- **Response**: `{ success: true, ride: rideObject }`
- **Side Effects**: Creates notifications for all drivers

#### `POST /api/rides/:id/accept`
Accept a pending ride.
- **Auth**: Required (driver or admin)
- **Response**: `{ success: true, ride: rideObject }`
- **Side Effects**: 
  - Updates ride status to 'accepted'
  - Sends confirmation email/SMS to customer
  - Creates notifications

#### `POST /api/rides/:id/complete`
Mark ride as completed.
- **Auth**: Required
- **Response**: `{ success: true, ride: rideObject }`
- **Side Effects**: Creates and sends survey to customer

#### `POST /api/rides/:id/confirm-pickup`
Confirm passenger pickup.
- **Auth**: Required
- **Response**: `{ success: true, ride: rideObject }`

#### `PUT /api/rides/:id`
Update ride details.
- **Auth**: Required
- **Body**: Partial ride data
- **Response**: `{ success: true, ride: rideObject }`

#### `POST /api/rides/:id/cancel`
Cancel ride (admin/driver).
- **Auth**: Required
- **Response**: `{ success: true, ride: rideObject }`
- **Side Effects**: 
  - If driver gives up ride, sets status back to 'pending' and notifies other drivers
  - If admin cancels, sets status to 'cancelled' and notifies customer

#### `GET /api/rides/:id/cancel-by-customer`
Cancel ride by customer (public, uses token).
- **Query**: `?token=<cancellationToken>`
- **Response**: HTML confirmation page
- **Side Effects**: 
  - Calculates cancellation fee (if within 24 hours)
  - Sends notifications to driver and admin

#### `DELETE /api/rides/:id`
Delete ride permanently.
- **Auth**: Required
- **Response**: `{ success: true }`

### Drivers (`/api/drivers`)

#### `GET /api/drivers`
Get all drivers.
- **Auth**: Required
- **Response**: Array of driver user objects

#### `GET /api/drivers/:username`
Get driver by username.
- **Auth**: Required
- **Response**: Single driver object

#### `GET /api/drivers/:username/rides`
Get all rides for a specific driver.
- **Auth**: Required
- **Response**: Array of ride objects

#### `PUT /api/drivers/:username`
Update driver profile.
- **Auth**: Required
- **Body**: Partial driver data
- **Response**: `{ success: true, driver: driverObject }`

#### `GET /api/drivers/:username/days-off`
Get driver's days off.
- **Auth**: Required
- **Response**: Array of day off objects

#### `POST /api/drivers/:username/days-off`
Add a day off for driver.
- **Auth**: Required
- **Body**: `{ date: string }`
- **Response**: `{ success: true, dayOff: dayOffObject }`

#### `DELETE /api/drivers/:username/days-off/:id`
Remove a day off.
- **Auth**: Required
- **Response**: `{ success: true }`

### Admin (`/api/admin`)

#### `GET /api/admin/overview`
Get admin dashboard overview statistics.
- **Auth**: Required (admin only)
- **Response**: Dashboard statistics object

#### `DELETE /api/admin/drivers/:username`
Delete a driver account.
- **Auth**: Required (admin only)
- **Response**: `{ success: true }`

#### `POST /api/admin/drivers/:username/reset-password`
Reset driver password.
- **Auth**: Required (admin only)
- **Body**: `{ newPassword: string }`
- **Response**: `{ success: true }`

### Messages (`/api/messages`)

#### `POST /api/messages`
Send a message.
- **Auth**: Required
- **Body**: `{ toUsername: string, toName: string, message: string }`
- **Response**: `{ success: true, message: messageObject }`

#### `GET /api/messages/conversations`
Get all conversations for current user.
- **Auth**: Required
- **Response**: Array of conversation objects

#### `GET /api/messages/conversation/:otherUsername`
Get conversation with specific user.
- **Auth**: Required
- **Response**: Array of message objects

#### `POST /api/messages/conversation/:otherUsername/read`
Mark conversation as read.
- **Auth**: Required
- **Response**: `{ success: true }`

#### `GET /api/messages/unread-count`
Get unread message count.
- **Auth**: Required
- **Response**: `{ count: number }`

### Reviews (`/api/reviews`)

#### `GET /api/reviews`
Get all reviews (optionally filtered by status).
- **Query**: `?status=pending|approved|rejected` (optional)
- **Auth**: Required
- **Response**: Array of review objects

#### `GET /api/reviews/approved`
Get all approved reviews (public).
- **Response**: Array of approved review objects

#### `POST /api/reviews`
Create a new review (public).
- **Body**: `{ customerName: string, customerEmail: string, rating: number, comment: string }`
- **Response**: `{ success: true, review: reviewObject }`

#### `POST /api/reviews/:id/approve`
Approve a review.
- **Auth**: Required (admin only)
- **Response**: `{ success: true, review: reviewObject }`

#### `POST /api/reviews/:id/reject`
Reject a review.
- **Auth**: Required (admin only)
- **Response**: `{ success: true, review: reviewObject }`

#### `DELETE /api/reviews/:id`
Delete a review.
- **Auth**: Required (admin only)
- **Response**: `{ success: true }`

### Announcements (`/api/announcements`)

#### `GET /api/announcements`
Get all announcements (optionally filtered by active status).
- **Query**: `?active=true|false` (optional)
- **Response**: Array of announcement objects

#### `POST /api/announcements`
Create a new announcement.
- **Auth**: Required (admin only)
- **Body**: `{ title: string, content: string, active: boolean }`
- **Response**: `{ success: true, announcement: announcementObject }`

#### `PUT /api/announcements/:id`
Update an announcement.
- **Auth**: Required (admin only)
- **Body**: Partial announcement data
- **Response**: `{ success: true, announcement: announcementObject }`

#### `DELETE /api/announcements/:id`
Delete an announcement.
- **Auth**: Required (admin only)
- **Response**: `{ success: true }`

### Surveys (`/api/surveys`)

#### `GET /api/surveys`
Get all surveys (with optional filters).
- **Query**: Various filter parameters
- **Auth**: Required (admin only)
- **Response**: Array of survey objects

#### `GET /api/surveys/:id`
Get survey by ID (public, uses token).
- **Query**: `?token=<surveyToken>`
- **Response**: Survey object or HTML form

---

## Frontend Pages

### Public Pages

#### `index.html` - Main Customer Website
- **Purpose**: Public-facing website for customers
- **Sections**:
  - Hero section with logo and welcome message
  - About section with driver listings, announcements, and contact info
  - Pricing section with destination cards
  - Reserve section with ride request form
  - Reviews section with review submission and display
- **Features**:
  - Dynamic driver loading from API
  - Dynamic announcement loading
  - Ride reservation form with address handling
  - Review submission and display
  - Responsive design

#### `rates.html` - Pricing Rates Page
- **Purpose**: Display detailed pricing for specific destinations
- **Features**:
  - Dynamic pricing calculation
  - Destination-specific rates
  - Vehicle type selection

### Driver Portal

#### `driver-login.html` - Driver Login
- **Purpose**: Driver authentication
- **Features**: Username/password login form

#### `driver-register.html` - Driver Registration
- **Purpose**: New driver account creation
- **Features**: Registration form with invite code validation

#### `driver-dashboard.html` - Driver Dashboard
- **Purpose**: Main driver interface
- **Features**:
  - Ride management (view, accept, complete, cancel)
  - Profile management
  - Days off management
  - Notifications
  - Messages
  - Reviews

### Admin Portal

#### `admin-login.html` - Admin Login
- **Purpose**: Admin authentication
- **Features**: Username/password login form

#### `admin-dashboard.html` - Admin Dashboard
- **Purpose**: Administrative interface
- **Features**:
  - Dashboard overview with statistics
  - Ride management
  - Driver management
  - Review approval workflow
  - Announcement management
  - Messaging system

---

## Features

### Customer Features
1. **Ride Reservation**
   - Comprehensive reservation form
   - Address handling (Home, airports, custom addresses)
   - Flight information for airport trips
   - Vehicle type selection based on passenger count
   - Automatic validation

2. **Review System**
   - Submit reviews with ratings (1-5 stars)
   - View approved reviews
   - Filter reviews by rating
   - Review approval workflow (admin)

3. **Ride Confirmation**
   - Email confirmation with cancellation link
   - Secure token-based cancellation
   - Cancellation fee calculation (within 24 hours)
   - Driver information display

4. **Survey System**
   - Post-ride survey emails
   - Token-based survey access

### Driver Features
1. **Ride Management**
   - View all available rides
   - Accept rides
   - Confirm pickup
   - Complete rides
   - Give up rides (makes them available to other drivers)

2. **Profile Management**
   - Update personal information
   - Manage vehicle information
   - Upload driver photo

3. **Availability Management**
   - Set days off
   - View availability calendar

4. **Notifications**
   - In-app notifications
   - Email notifications
   - SMS notifications (if configured)
   - Quiet hours (20:00 - 09:00) for new ride notifications

5. **Messaging**
   - Internal messaging system
   - Conversation view
   - Unread message tracking

### Admin Features
1. **Dashboard Overview**
   - Statistics and metrics
   - Recent activity

2. **Ride Management**
   - View all rides
   - Edit ride details
   - Cancel rides
   - Recalculate pricing

3. **Driver Management**
   - View all drivers
   - Edit driver profiles
   - Delete drivers
   - Reset driver passwords

4. **Review Management**
   - View all reviews (pending, approved, rejected)
   - Approve/reject reviews
   - Delete reviews

5. **Announcement Management**
   - Create announcements
   - Edit announcements
   - Activate/deactivate announcements
   - Delete announcements

6. **Messaging**
   - Internal messaging system
   - Message all drivers

### Notification System
- **Email Notifications**: Using Nodemailer (Gmail, Outlook, custom SMTP)
- **SMS Notifications**: Using Twilio
- **Quiet Hours**: Suppresses email/SMS for new rides between 20:00 - 09:00 (database notifications still created)
- **Notification Types**:
  - New ride available
  - Ride accepted
  - Ride cancelled
  - Ride completed
  - Survey sent
  - Driver gave up ride

---

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- Email account (Gmail, Outlook, or custom SMTP)
- Twilio account (optional, for SMS)

### Installation Steps

1. **Clone/Download the Project**
   ```bash
   cd south-county-rideshare
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   BASE_URL=http://localhost:3000

   # Database
   MONGODB_URI=mongodb://localhost:27017/southcounty_rideshare
   # OR for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/southcounty_rideshare

   # Session
   SESSION_SECRET=your-secret-key-change-in-production

   # Email Configuration (Nodemailer)
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   # For Gmail, use an App Password, not your regular password

   # SMS Configuration (Twilio - Optional)
   TWILIO_ACCOUNT_SID=your-account-sid
   TWILIO_AUTH_TOKEN=your-auth-token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

4. **Set Up MongoDB**
   - **Local MongoDB**: Install and start MongoDB service
   - **MongoDB Atlas**: Create cluster and get connection string

5. **Create Initial Admin User**
   You'll need to create an admin user manually or via a script. Example using MongoDB shell:
   ```javascript
   // Connect to MongoDB
   use southcounty_rideshare
   
   // Create admin user (password will be hashed by the app)
   // You'll need to register through the app or use a script
   ```

6. **Run the Application**
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

7. **Access the Application**
   - Main website: `http://localhost:3000`
   - Driver login: `http://localhost:3000/driver-login`
   - Admin login: `http://localhost:3000/admin-login`

### Email Setup

#### Gmail Setup
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the app password in `EMAIL_PASSWORD`

#### Outlook Setup
1. Use your Outlook email and password
2. Set `EMAIL_SERVICE=outlook` in `.env`

#### Custom SMTP
Configure with your SMTP server details in the transporter setup.

### SMS Setup (Optional)
1. Create a Twilio account
2. Get Account SID and Auth Token
3. Purchase a phone number
4. Add credentials to `.env`

---

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 3000 |
| `NODE_ENV` | Environment (development/production) | No | development |
| `BASE_URL` | Base URL for email links | Yes | http://localhost:3000 |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `SESSION_SECRET` | Secret for session encryption | Yes | - |
| `EMAIL_SERVICE` | Email service provider | No | gmail |
| `EMAIL_USER` | Email address | Yes (for email) | - |
| `EMAIL_PASSWORD` | Email password/app password | Yes (for email) | - |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | No (for SMS) | - |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | No (for SMS) | - |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | No (for SMS) | - |

### Session Configuration
- **Storage**: In-memory (default)
- **Cookie**: HttpOnly, Secure in production
- **Max Age**: 24 hours
- **Production Note**: Use Redis or MongoDB session store for production

### Quiet Hours
- **Time**: 20:00 (8 PM) to 09:00 (9 AM)
- **Behavior**: Suppresses email/SMS notifications for new rides
- **Database Notifications**: Still created for drivers to see in dashboard

---

## Current State

### Completed Features ✅
1. **Backend Infrastructure**
   - Express server setup
   - MongoDB models (all models created)
   - API routes (all routes implemented)
   - Authentication middleware
   - Session management

2. **Frontend Structure**
   - All HTML pages created
   - API client (`api-client.js`) implemented
   - Main website (`index.html`) integrated with API
   - Basic styling

3. **Core Functionality**
   - Ride creation from customer form
   - Driver authentication
   - Admin authentication
   - Review submission and display
   - Announcement system
   - Driver listing
   - Notification system (email/SMS)

4. **Ride Workflow**
   - Ride creation
   - Driver acceptance
   - Pickup confirmation
   - Ride completion
   - Customer cancellation (token-based)
   - Driver giving up rides

### In Progress / Needs Work ⚠️

1. **Frontend JavaScript Migration**
   - `driver-auth.js`: Needs to replace localStorage with API calls
   - `driver-dashboard.js`: Needs API integration
   - `admin-dashboard.js`: Needs API integration
   - Login/register form handlers: Need API integration

2. **Pricing Calculator**
   - `utils/pricing.js`: Currently placeholder, needs implementation
   - Frontend pricing calculator needs integration

3. **Invite Code System**
   - Invite code validation in registration
   - Invite code management for admins

4. **Error Handling**
   - Comprehensive error handling throughout
   - User-friendly error messages

5. **Testing**
   - API endpoint testing
   - Frontend functionality testing
   - Integration testing

### Known Limitations
- Session storage is in-memory (not suitable for production scaling)
- Pricing calculator not fully implemented
- Some frontend JavaScript still uses localStorage patterns
- File upload for driver photos not implemented (uses base64 or URL)

---

## Workflow

### Ride Lifecycle

1. **Customer Submits Request**
   - Customer fills out reservation form on `index.html`
   - Form submits to `POST /api/rides`
   - Ride created with status 'pending'
   - Notifications sent to all drivers (unless quiet hours)

2. **Driver Accepts Ride**
   - Driver views available rides in dashboard
   - Driver clicks "Accept" on a ride
   - `POST /api/rides/:id/accept` called
   - Ride status changes to 'accepted'
   - Driver assigned to ride
   - Confirmation email/SMS sent to customer with cancellation link

3. **Driver Confirms Pickup**
   - Driver arrives at pickup location
   - Driver clicks "Confirm Pickup" in dashboard
   - `POST /api/rides/:id/confirm-pickup` called
   - Ride `confirmed` flag set to true

4. **Driver Completes Ride**
   - Driver completes the trip
   - Driver clicks "Complete Ride" in dashboard
   - `POST /api/rides/:id/complete` called
   - Ride status changes to 'completed'
   - Survey created and sent to customer

5. **Customer Cancellation**
   - Customer clicks cancellation link in email
   - `GET /api/rides/:id/cancel-by-customer?token=...` called
   - Cancellation fee calculated (if within 24 hours)
   - Ride status changes to 'cancelled_by_customer'
   - Notifications sent to driver and admin

6. **Driver Gives Up Ride**
   - Driver cancels an accepted ride
   - `POST /api/rides/:id/cancel` called
   - Ride status changes back to 'pending'
   - Previous driver tracked
   - Notifications sent to other drivers
   - When another driver accepts, customer notified of driver change

### Review Workflow

1. **Customer Submits Review**
   - Customer fills out review form on `index.html`
   - Form submits to `POST /api/reviews`
   - Review created with `approved: false`

2. **Admin Reviews**
   - Admin views pending reviews in dashboard
   - Admin approves or rejects review

3. **Review Displayed**
   - Approved reviews displayed on `index.html`
   - Reviews sorted by date (newest first)
   - Filtering by rating available

---

## Security

### Authentication
- **Password Hashing**: bcryptjs with salt rounds (10)
- **Session Management**: Express-session with secure cookies
- **Session Secret**: Should be strong random string in production

### Authorization
- **Middleware**: `requireAuth`, `requireAdmin`, `requireDriver`
- **Route Protection**: Most API routes require authentication
- **Public Routes**: Ride creation, review submission, ride confirmation (with token)

### Token-Based Access
- **Cancellation Tokens**: Secure random tokens for customer cancellation
- **Survey Tokens**: Secure random tokens for survey access
- **Token Validation**: Tokens validated on each request

### Data Validation
- **Input Validation**: Basic validation in routes (should be enhanced)
- **MongoDB Schema**: Mongoose schema validation
- **SQL Injection**: Not applicable (MongoDB)
- **XSS Protection**: Should be added (input sanitization)

### Recommendations for Production
1. Use HTTPS
2. Implement rate limiting
3. Add input sanitization (prevent XSS)
4. Use Redis or MongoDB session store
5. Implement CSRF protection
6. Add request logging
7. Regular security audits
8. Keep dependencies updated

---

## Future Improvements

### High Priority
1. **Complete Frontend Migration**
   - Migrate all localStorage calls to API calls
   - Update driver-dashboard.js
   - Update admin-dashboard.js
   - Update login/register handlers

2. **Pricing Calculator**
   - Implement full pricing logic
   - Integrate with rates data
   - Add price recalculation feature

3. **Invite Code System**
   - Admin interface for creating invite codes
   - Invite code validation
   - Invite code usage tracking

4. **File Upload**
   - Driver photo upload
   - File storage solution (local or cloud)

5. **Error Handling**
   - Comprehensive error handling
   - User-friendly error messages
   - Error logging

### Medium Priority
1. **Testing**
   - Unit tests for utilities
   - Integration tests for API
   - End-to-end tests

2. **Performance**
   - Database indexing
   - Query optimization
   - Caching strategy

3. **UI/UX Improvements**
   - Loading states
   - Better error messages
   - Responsive design improvements
   - Accessibility improvements

4. **Features**
   - Ride rescheduling
   - Recurring rides
   - Payment integration
   - Driver ratings
   - Customer accounts

### Low Priority
1. **Documentation**
   - API documentation (Swagger/OpenAPI)
   - Developer guide
   - User manuals

2. **Monitoring**
   - Application monitoring
   - Error tracking (Sentry)
   - Analytics

3. **Deployment**
   - CI/CD pipeline
   - Docker containerization
   - Production deployment guide

---

## Additional Notes

### File Locations
- Static files should be in `public/` directory
- Server serves static files from `public/`
- HTML pages accessed via routes in `server.js`

### API Client Usage
The `api-client.js` file provides a centralized API interface:
```javascript
// Example usage
API.auth.driverLogin(username, password)
API.rides.getAll()
API.reviews.getApproved()
```

### Session Management
- Sessions stored in server memory (default)
- For production, use Redis or MongoDB session store
- Session cookies are HttpOnly and Secure in production

### Notification Timing
- Quiet hours: 20:00 - 09:00
- During quiet hours, email/SMS suppressed for new rides
- Database notifications still created
- Driver cancellation notifications always sent (even during quiet hours)

### Database Indexing Recommendations
Consider adding indexes for:
- `User.username` (already unique)
- `User.email` (already unique)
- `Ride.id` (already unique)
- `Ride.status`
- `Ride.driverId`
- `Ride.date`
- `Notification.driverId`
- `Notification.read`

---

## Support and Maintenance

### Logging
- Console logging for errors and important events
- Consider implementing structured logging (Winston, Pino)

### Backup Strategy
- Regular MongoDB backups
- Database backup before updates
- Environment variable backup (secure storage)

### Updates
- Keep dependencies updated
- Monitor security advisories
- Test updates in development before production

---

## Contact and Resources

- **Project Location**: Rancho Santa Margarita, California
- **Service Area**: Rancho Santa Margarita, Coto de Caza, Dove Canyon, Ladera Ranch, Rancho Mission Viejo
- **Email**: articuous14@gmail.com

---

*Last Updated: [Current Date]*
*Documentation Version: 1.0*

