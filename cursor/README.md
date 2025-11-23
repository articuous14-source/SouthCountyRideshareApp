# South County Ride Share - Node.js Application

A full-stack Node.js application for managing a ride share service.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Environment Variables**
   - Copy `.env.example` to `.env`
   - Update the values in `.env`:
     - `MONGODB_URI`: Your MongoDB connection string
     - `SESSION_SECRET`: A secure random string for session encryption
     - `PORT`: Port number (default: 3000)

3. **Set up MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Update `MONGODB_URI` in `.env` with your connection string

4. **Move Static Files**
   - Copy all HTML, CSS, JS, and asset files to the `public` directory
   - The structure should be:
     ```
     public/
       ├── index.html
       ├── driver-login.html
       ├── driver-dashboard.html
       ├── admin-login.html
       ├── admin-dashboard.html
       ├── styles.css
       ├── script.js
       ├── driver-dashboard.js
       ├── admin-dashboard.js
       └── assets/
           └── (all image files)
     ```

5. **Update Frontend JavaScript**
   - All `localStorage` calls need to be replaced with API calls
   - Update `driver-auth.js`, `driver-dashboard.js`, `admin-dashboard.js`, and `script.js` to use fetch/axios for API calls

6. **Run the Application**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/driver/login` - Driver login
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/driver/register` - Driver registration
- `POST /api/auth/logout` - Logout
- `GET /api/auth/current` - Get current user

### Rides
- `GET /api/rides` - Get all rides
- `GET /api/rides/:id` - Get ride by ID
- `POST /api/rides` - Create new ride
- `POST /api/rides/:id/accept` - Accept ride
- `POST /api/rides/:id/complete` - Complete ride
- `POST /api/rides/:id/confirm-pickup` - Confirm pickup
- `PUT /api/rides/:id` - Update ride
- `DELETE /api/rides/:id` - Delete ride

### Drivers
- `GET /api/drivers` - Get all drivers
- `GET /api/drivers/:username` - Get driver by username
- `GET /api/drivers/:username/rides` - Get driver's rides
- `PUT /api/drivers/:username` - Update driver profile
- `GET /api/drivers/:username/days-off` - Get driver's days off
- `POST /api/drivers/:username/days-off` - Add day off
- `DELETE /api/drivers/:username/days-off/:id` - Remove day off

### Admin
- `GET /api/admin/overview` - Get dashboard overview
- `DELETE /api/admin/drivers/:username` - Delete driver
- `POST /api/admin/drivers/:username/reset-password` - Reset driver password

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/conversations` - Get all conversations
- `GET /api/messages/conversation/:otherUsername` - Get conversation
- `POST /api/messages/conversation/:otherUsername/read` - Mark as read
- `GET /api/messages/unread-count` - Get unread count

### Reviews
- `GET /api/reviews` - Get all reviews
- `GET /api/reviews/approved` - Get approved reviews
- `POST /api/reviews` - Create review
- `POST /api/reviews/:id/approve` - Approve review
- `POST /api/reviews/:id/reject` - Reject review
- `DELETE /api/reviews/:id` - Delete review

### Announcements
- `GET /api/announcements` - Get all announcements
- `POST /api/announcements` - Create announcement
- `PUT /api/announcements/:id` - Update announcement
- `DELETE /api/announcements/:id` - Delete announcement

## Next Steps

1. **Update Frontend Code**: Replace all `localStorage` operations with API calls
2. **Implement Pricing Calculator**: Complete the pricing utility function
3. **Add Email Functionality**: Integrate EmailJS or another email service
4. **Add Validation**: Add input validation and sanitization
5. **Add Error Handling**: Improve error handling throughout the application
6. **Add Tests**: Write unit and integration tests
7. **Deploy**: Deploy to a hosting service (Heroku, AWS, etc.)

## Notes

- Sessions are stored in memory by default. For production, use a session store like Redis or MongoDB session store.
- Passwords are hashed using bcryptjs.
- All API routes require authentication except for public routes (ride creation, review submission).




