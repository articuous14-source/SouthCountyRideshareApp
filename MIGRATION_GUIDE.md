# Migration Guide: Client-Side to Node.js

This guide will help you migrate your existing client-side application to the new Node.js backend.

## Step 1: Move Static Files

Copy all your HTML, CSS, JavaScript, and asset files to the `public` directory:

```bash
# Copy HTML files
cp *.html public/

# Copy CSS and JS files
cp *.css public/
cp *.js public/

# Copy assets
cp -r assets public/
```

## Step 2: Update HTML Files

Add the API client script to all HTML files that need API access. Add this before your other scripts:

```html
<script src="/api-client.js"></script>
```

Files that need this:
- `index.html`
- `driver-login.html`
- `driver-register.html`
- `driver-dashboard.html`
- `admin-login.html`
- `admin-dashboard.html`

## Step 3: Replace localStorage with API Calls

### Example: Getting Rides

**Before (localStorage):**
```javascript
const rides = getRides();
```

**After (API):**
```javascript
const response = await API.rides.getAll();
const rides = response; // or response.rides depending on API response
```

### Example: Creating a Ride

**Before:**
```javascript
const ride = createRide(rideData);
saveRides(rides);
```

**After:**
```javascript
const response = await API.rides.create(rideData);
const ride = response.ride;
```

### Example: Authentication

**Before:**
```javascript
const driver = authenticateDriver(username, password);
setCurrentDriver(driver);
```

**After:**
```javascript
const response = await API.auth.driverLogin(username, password);
if (response.success) {
    // Session is automatically set by server
    window.location.href = '/driver-dashboard';
}
```

## Step 4: Update Specific Files

### driver-auth.js

Replace all functions with API calls:

- `getDrivers()` → `await API.drivers.getAll()`
- `getRides()` → `await API.rides.getAll()`
- `createRide()` → `await API.rides.create()`
- `acceptRide()` → `await API.rides.accept()`
- `authenticateDriver()` → `await API.auth.driverLogin()`
- `setCurrentDriver()` → Remove (handled by session)
- `getCurrentDriver()` → `await API.auth.getCurrentUser()`

### driver-dashboard.js

Update all data fetching:

- `loadRides()` → Use `API.rides.getAll()`
- `loadProfile()` → Use `API.drivers.getByUsername()`
- `loadDaysOff()` → Use `API.drivers.getDaysOff()`
- `addDayOff()` → Use `API.drivers.addDayOff()`
- `completeRide()` → Use `API.rides.complete()`
- `confirmPickup()` → Use `API.rides.confirmPickup()`

### admin-dashboard.js

Update all data fetching:

- `loadOverview()` → Use `API.admin.getOverview()`
- `loadRides()` → Use `API.rides.getAll()`
- `loadDrivers()` → Use `API.drivers.getAll()`
- `loadReviews()` → Use `API.reviews.getAll()`
- `loadMessages()` → Use `API.messages.getConversations()`

### script.js (Home Page)

Update form submission:

- Ride form submission → Use `API.rides.create()`
- Review submission → Use `API.reviews.create()`
- Load reviews → Use `API.reviews.getApproved()`
- Load announcements → Use `API.announcements.getAll(true)`

## Step 5: Handle Async/Await

Since API calls are asynchronous, you'll need to update functions to be async:

**Before:**
```javascript
function loadRides() {
    const rides = getRides();
    // display rides
}
```

**After:**
```javascript
async function loadRides() {
    try {
        const rides = await API.rides.getAll();
        // display rides
    } catch (error) {
        console.error('Error loading rides:', error);
        alert('Error loading rides. Please try again.');
    }
}
```

## Step 6: Update Session Management

Remove all `sessionStorage` and `localStorage` calls for user data. The server handles sessions automatically.

**Remove:**
- `sessionStorage.setItem('currentDriver', ...)`
- `sessionStorage.getItem('currentDriver')`
- `localStorage.setItem('drivers', ...)`
- etc.

**Replace with:**
```javascript
// Check if user is logged in
const currentUser = await API.auth.getCurrentUser();
if (!currentUser || currentUser.error) {
    // Redirect to login
    window.location.href = '/driver-login';
}
```

## Step 7: Error Handling

Add proper error handling for all API calls:

```javascript
try {
    const response = await API.rides.getAll();
    // Handle success
} catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
}
```

## Step 8: Update Form Submissions

**Before:**
```javascript
form.addEventListener('submit', function(e) {
    e.preventDefault();
    const data = new FormData(form);
    // Process with localStorage
});
```

**After:**
```javascript
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const data = new FormData(form);
    const rideData = Object.fromEntries(data);
    
    try {
        await API.rides.create(rideData);
        alert('Ride request submitted successfully!');
        form.reset();
    } catch (error) {
        alert('Error submitting ride request: ' + error.message);
    }
});
```

## Step 9: Testing Checklist

- [ ] Driver login works
- [ ] Admin login works
- [ ] Driver registration works
- [ ] Ride creation from home page works
- [ ] Driver can view rides
- [ ] Driver can accept rides
- [ ] Driver can complete rides
- [ ] Admin can view all rides
- [ ] Admin can manage drivers
- [ ] Messages work between admin and drivers
- [ ] Reviews can be submitted and approved
- [ ] Announcements work
- [ ] Days off work
- [ ] All dashboard features work

## Step 10: Database Seeding

Create a script to seed initial data (admin user, default drivers, etc.):

```javascript
// scripts/seed.js
const User = require('../models/User');
// ... seed data
```

## Common Issues

1. **CORS Errors**: Make sure the server has CORS enabled (already done in server.js)

2. **Session Not Persisting**: Check that `credentials: 'include'` is set in fetch calls (already in api-client.js)

3. **404 Errors**: Make sure all routes are properly defined in the server

4. **Database Connection**: Ensure MongoDB is running and connection string is correct

5. **Async/Await**: Make sure all functions using API calls are marked as `async`

## Need Help?

If you encounter issues during migration:
1. Check browser console for errors
2. Check server logs for API errors
3. Verify database connection
4. Ensure all routes are properly defined
5. Verify session configuration




