const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/southcounty_rideshare', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/auth');
const rideRoutes = require('./routes/rides');
const driverRoutes = require('./routes/drivers');
const adminRoutes = require('./routes/admin');
const messageRoutes = require('./routes/messages');
const reviewRoutes = require('./routes/reviews');
const announcementRoutes = require('./routes/announcements');
const surveyRoutes = require('./routes/surveys');

app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/surveys', surveyRoutes);

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/driver-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'driver-login.html'));
});

app.get('/driver-register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'driver-register.html'));
});

app.get('/driver-dashboard', (req, res) => {
    if (!req.session.driver && !req.session.admin) {
        return res.redirect('/driver-login');
    }
    res.sendFile(path.join(__dirname, 'public', 'driver-dashboard.html'));
});

app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin-dashboard', (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/admin-login');
    }
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

