// Admin Dashboard JavaScript
// TEMPORARY: Bypass login check - allow direct access
// Get current admin or use default
let currentAdmin;
try {
    currentAdmin = getCurrentAdmin();
    if (!currentAdmin) {
        // Use first admin as default if not logged in
        try {
            const admins = getAdmins();
            if (admins.length > 0) {
                currentAdmin = admins[0];
                setCurrentAdmin(currentAdmin);
            } else {
                // Create a default admin if none exist
                currentAdmin = {
                    username: 'admin',
                    name: 'Administrator',
                    email: 'admin@example.com'
                };
                setCurrentAdmin(currentAdmin);
            }
        } catch (error) {
            console.error('Error getting admins:', error);
            // Create a default admin if all else fails
            currentAdmin = {
                username: 'admin',
                name: 'Administrator',
                email: 'admin@example.com'
            };
        }
    }
} catch (error) {
    console.error('Error initializing admin:', error);
    // Create a default admin if all else fails
    currentAdmin = {
        username: 'admin',
        name: 'Administrator',
        email: 'admin@example.com'
    };
}

// Helper function to format time based on admin preference
// Can accept either a time string (e.g., "14:30") or a Date object
function formatTime(timeInput) {
    if (!timeInput) return '';
    let time;
    if (timeInput instanceof Date) {
        time = timeInput;
    } else {
        time = new Date(`2000-01-01T${timeInput}`);
    }
    const use24Hour = currentAdmin?.timeFormat24 === true;
    return time.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: !use24Hour 
    });
}

// Helper function to format date and time together based on admin preference
// Accepts a Date object or ISO date string
function formatDateTime(dateTimeInput, options = {}) {
    if (!dateTimeInput) return '';
    const date = dateTimeInput instanceof Date ? dateTimeInput : new Date(dateTimeInput);
    if (isNaN(date.getTime())) return '';
    
    const use24Hour = currentAdmin?.timeFormat24 === true;
    const defaultOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: !use24Hour
    };
    
    return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

// Logout function
function logout() {
    logoutAdmin();
    window.location.href = 'admin-login.html';
}

// Open admin settings modal
function openAdminSettings() {
    const modal = document.getElementById('adminSettingsModal');
    if (!modal) return;
    
    // Load current admin data
    loadAdminSettings();
    
    modal.style.display = 'flex';
}

// Close admin settings modal
function closeAdminSettings() {
    const modal = document.getElementById('adminSettingsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Load admin settings data
function loadAdminSettings() {
    if (!currentAdmin) return;
    
    // Load admin photo if exists
    const adminPhoto = localStorage.getItem(`admin_photo_${currentAdmin.username}`);
    const photoImg = document.getElementById('adminPhoto');
    const photoPlaceholder = document.getElementById('adminPhotoPlaceholder');
    
    if (adminPhoto) {
        photoImg.src = adminPhoto;
        photoImg.style.display = 'block';
        photoPlaceholder.style.display = 'none';
    } else {
        photoImg.style.display = 'none';
        photoPlaceholder.style.display = 'flex';
    }
    
    // Load admin data
    const nameEl = document.getElementById('adminSettingsName');
    const usernameEl = document.getElementById('adminSettingsUsername');
    const emailEl = document.getElementById('adminSettingsEmail');
    const phoneEl = document.getElementById('adminSettingsPhone');
    const vehicleEl = document.getElementById('adminSettingsVehicle');
    const textNotificationsEl = document.getElementById('adminSettingsTextNotifications');
    const timeFormat24El = document.getElementById('adminSettingsTimeFormat24');
    const currentPasswordEl = document.getElementById('adminSettingsCurrentPassword');
    const newPasswordEl = document.getElementById('adminSettingsNewPassword');
    const confirmPasswordEl = document.getElementById('adminSettingsConfirmPassword');
    
    if (nameEl) nameEl.value = currentAdmin.name || '';
    if (usernameEl) usernameEl.value = currentAdmin.username || '';
    if (emailEl) emailEl.value = currentAdmin.email || '';
    if (phoneEl) phoneEl.value = currentAdmin.phone || '';
    if (vehicleEl) vehicleEl.value = currentAdmin.vehicle || '';
    if (textNotificationsEl) textNotificationsEl.checked = currentAdmin.textNotificationsEnabled !== false;
    if (timeFormat24El) timeFormat24El.checked = currentAdmin.timeFormat24 === true;
    
    // Clear password fields
    if (currentPasswordEl) currentPasswordEl.value = '';
    if (newPasswordEl) newPasswordEl.value = '';
    if (confirmPasswordEl) confirmPasswordEl.value = '';
    
    // Clear message
    const messageDiv = document.getElementById('adminSettingsMessage');
    if (messageDiv) {
        messageDiv.textContent = '';
        messageDiv.className = 'form-message';
    }
}

// Handle admin photo upload
function handleAdminPhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('Image size must be less than 2MB');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const photoData = e.target.result;
        if (currentAdmin && currentAdmin.username) {
            localStorage.setItem(`admin_photo_${currentAdmin.username}`, photoData);
        }
        
        const photoImg = document.getElementById('adminPhoto');
        const photoPlaceholder = document.getElementById('adminPhotoPlaceholder');
        photoImg.src = photoData;
        photoImg.style.display = 'block';
        photoPlaceholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// Handle admin settings form submission
function handleAdminSettingsSubmit(event) {
    event.preventDefault();
    
    if (!currentAdmin) {
        alert('Admin not found');
        return;
    }
    
    const messageDiv = document.getElementById('adminSettingsMessage');
    const submitBtn = event.target.querySelector('.modal-submit-btn');
    
    // Disable submit button
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
    }
    
    // Get form data
    const name = document.getElementById('adminSettingsName').value.trim();
    const username = document.getElementById('adminSettingsUsername').value.trim();
    const email = document.getElementById('adminSettingsEmail').value.trim();
    const phone = document.getElementById('adminSettingsPhone').value.trim();
    const vehicle = document.getElementById('adminSettingsVehicle').value.trim();
    const textNotificationsEnabled = document.getElementById('adminSettingsTextNotifications').checked;
    const timeFormat24 = document.getElementById('adminSettingsTimeFormat24') ? document.getElementById('adminSettingsTimeFormat24').checked : false;
    const currentPassword = document.getElementById('adminSettingsCurrentPassword').value;
    const newPassword = document.getElementById('adminSettingsNewPassword').value;
    const confirmPassword = document.getElementById('adminSettingsConfirmPassword').value;
    
    try {
        // Get all admins
        const admins = getAdmins();
        const adminIndex = admins.findIndex(a => a.username === currentAdmin.username);
        
        if (adminIndex === -1) {
            throw new Error('Admin not found in database');
        }
        
        // Check if username is being changed and if it's already taken
        if (username !== currentAdmin.username) {
            const usernameExists = admins.some(a => a.username === username && a.username !== currentAdmin.username);
            if (usernameExists) {
                throw new Error('Username already exists. Please choose a different username.');
            }
        }
        
        // Update admin data
        admins[adminIndex].name = name;
        admins[adminIndex].username = username;
        admins[adminIndex].email = email;
        if (phone) {
            admins[adminIndex].phone = phone;
        }
        if (vehicle) {
            admins[adminIndex].vehicle = vehicle;
        }
        admins[adminIndex].textNotificationsEnabled = textNotificationsEnabled;
        admins[adminIndex].timeFormat24 = timeFormat24;
        
        // Handle password change if provided
        if (currentPassword || newPassword || confirmPassword) {
            if (!currentPassword) {
                throw new Error('Please enter your current password to change it.');
            }
            
            // Verify current password
            if (admins[adminIndex].password !== currentPassword) {
                throw new Error('Current password is incorrect.');
            }
            
            if (!newPassword) {
                throw new Error('Please enter a new password.');
            }
            
            if (newPassword !== confirmPassword) {
                throw new Error('New passwords do not match.');
            }
            
            if (newPassword.length < 6) {
                throw new Error('New password must be at least 6 characters long.');
            }
            
            // Update password
            admins[adminIndex].password = newPassword;
        }
        
        // Save admins
        localStorage.setItem('admins', JSON.stringify(admins));
        
        // Update current admin
        currentAdmin = admins[adminIndex];
        currentAdmin.textNotificationsEnabled = textNotificationsEnabled;
        currentAdmin.timeFormat24 = timeFormat24;
        setCurrentAdmin(currentAdmin);
        
        // Reload views to update time formats
        if (currentView === 'list' || currentView === 'calendar' || currentView === 'drivers' || currentView === 'income' || currentView === 'archive') {
            switchView(currentView);
        }
        
        // Update admin name display
        const adminNameDisplay = document.getElementById('adminName');
        if (adminNameDisplay) {
            adminNameDisplay.textContent = currentAdmin.name;
        }
        
        // Show success message
        if (messageDiv) {
            messageDiv.textContent = 'Settings saved successfully!';
            messageDiv.className = 'form-message success';
        }
        
        // Close modal after a short delay
        setTimeout(() => {
            closeAdminSettings();
        }, 1500);
        
    } catch (error) {
        if (messageDiv) {
            messageDiv.textContent = error.message || 'Error saving settings. Please try again.';
            messageDiv.className = 'form-message error';
        }
    } finally {
        // Re-enable submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Changes';
        }
    }
}

// View switching
let currentView = 'overview';

function switchView(view) {
    currentView = view;
    
    // Update buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const btnMap = {
        'overview': 'btn-overview',
        'rides': 'btn-rides',
        'calendar': 'btn-calendar',
        'drivers': 'btn-drivers',
        'income': 'btn-income',
        'pricing': 'btn-pricing',
        'days-off': 'btn-days-off',
        'reviews': 'btn-reviews',
        'surveys': 'btn-surveys',
        'archive': 'btn-archive',
        'announcements': 'btn-announcements',
        'invites': 'btn-invites',
        'messages': 'btn-messages',
        'notifications': 'btn-notifications'
    };
    if (btnMap[view]) {
        document.getElementById(btnMap[view]).classList.add('active');
    }
    
    // Update views
    document.getElementById('overviewView').classList.toggle('active', view === 'overview');
    document.getElementById('ridesView').classList.toggle('active', view === 'rides');
    document.getElementById('calendarView').classList.toggle('active', view === 'calendar');
    document.getElementById('driversView').classList.toggle('active', view === 'drivers');
    document.getElementById('incomeView').classList.toggle('active', view === 'income');
    document.getElementById('pricingView').classList.toggle('active', view === 'pricing');
    document.getElementById('daysOffView').classList.toggle('active', view === 'days-off');
    document.getElementById('reviewsView').classList.toggle('active', view === 'reviews');
    document.getElementById('surveysView').classList.toggle('active', view === 'surveys');
    document.getElementById('archiveView').classList.toggle('active', view === 'archive');
    document.getElementById('announcementsView').classList.toggle('active', view === 'announcements');
    document.getElementById('invitesView').classList.toggle('active', view === 'invites');
    document.getElementById('messagesView').classList.toggle('active', view === 'messages');
    document.getElementById('notificationsView').classList.toggle('active', view === 'notifications');
    
    // Reload data based on view
    if (view === 'overview') {
        loadOverview();
    } else if (view === 'rides' || view === 'calendar') {
        loadRides();
    } else if (view === 'drivers') {
        loadDrivers();
    } else if (view === 'income') {
        loadIncome();
    } else if (view === 'pricing') {
        loadPricing();
    } else if (view === 'days-off') {
        loadDaysOff();
    } else if (view === 'reviews') {
        currentReviewFilter = 'pending';
        // Set pending button as active by default
        document.querySelectorAll('#reviewsView .view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const pendingBtn = document.getElementById('btn-pending-reviews');
        if (pendingBtn) {
            pendingBtn.classList.add('active');
        }
        loadReviews();
    } else if (view === 'surveys') {
        loadSurveys();
    } else if (view === 'archive') {
        loadArchive();
    } else if (view === 'announcements') {
        loadAnnouncements();
    } else if (view === 'invites') {
        loadInvites();
    } else if (view === 'messages') {
        loadMessages();
    } else if (view === 'notifications') {
        // Initialize filter to 'all' if not already set
        if (!currentNotificationFilter || currentNotificationFilter === 'all') {
            currentNotificationFilter = 'all';
            // Activate the 'All' button
            document.querySelectorAll('#notificationsView .view-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            const allBtn = document.getElementById('btn-all-notifications');
            if (allBtn) {
                allBtn.classList.add('active');
            }
        }
        loadAdminNotifications();
    }
}

// Check for rides that need confirmation (admin view - shows all drivers)
function checkUnconfirmedRidesAdmin() {
    const rides = getRides();
    const now = new Date();
    
    // Find all rides that need confirmation (accepted, within 48 hours, not confirmed)
    const unconfirmedRides = rides.filter(ride => {
        if (ride.status !== 'accepted' || ride.confirmed) {
            return false;
        }
        
        const rideDateTime = new Date(`${ride.date}T${ride.time}`);
        const hoursUntilRide = (rideDateTime - now) / (1000 * 60 * 60);
        
        return hoursUntilRide >= 0 && hoursUntilRide <= 48;
    });
    
    const alertDiv = document.getElementById('confirmationAlert');
    const alertText = document.getElementById('confirmationAlertText');
    
    if (!alertDiv || !alertText) return;
    
    if (unconfirmedRides.length > 0) {
        alertDiv.style.display = 'block';
        
        // Group by driver
        const ridesByDriver = {};
        unconfirmedRides.forEach(ride => {
            const driverName = ride.driverName || 'Unknown Driver';
            if (!ridesByDriver[driverName]) {
                ridesByDriver[driverName] = [];
            }
            ridesByDriver[driverName].push(ride);
        });
        
        const driverNames = Object.keys(ridesByDriver);
        
        if (unconfirmedRides.length === 1) {
            const ride = unconfirmedRides[0];
            const dateParts = ride.date.split('-');
            const formattedDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
            const formattedTime = formatTime(ride.time);
            alertText.innerHTML = `<strong>${ride.driverName || 'Unknown Driver'}</strong> has 1 ride that needs confirmation: ${ride.pickup} → ${ride.destination} on ${formattedDate} at ${formattedTime}`;
        } else {
            let message = `${unconfirmedRides.length} rides need confirmation from ${driverNames.length} driver${driverNames.length !== 1 ? 's' : ''}: `;
            message += driverNames.map(name => {
                const count = ridesByDriver[name].length;
                return `<strong>${name}</strong> (${count} ride${count !== 1 ? 's' : ''})`;
            }).join(', ');
            alertText.innerHTML = message;
        }
    } else {
        alertDiv.style.display = 'none';
    }
}

// Load overview
function loadOverview() {
    try {
        if (typeof loadStats === 'function') {
            loadStats();
        }
        if (typeof loadQuickIncome === 'function') {
            loadQuickIncome();
        }
        if (typeof loadRecentActivity === 'function') {
            loadRecentActivity();
        }
        if (typeof checkUnconfirmedRidesAdmin === 'function') {
            checkUnconfirmedRidesAdmin();
        }
    } catch (error) {
        console.error('Error in loadOverview:', error);
        // Show error message but don't block the page
        const statsGrid = document.getElementById('statsGrid');
        if (statsGrid) {
            statsGrid.innerHTML = '<div style="padding: 2rem; color: #dc3545;">Error loading dashboard data. Please refresh the page.</div>';
        }
    }
}

// Calculate total commission from all drivers
function calculateTotalCommission() {
    const rides = getRides();
    const drivers = getDrivers();
    let totalCommission = 0;
    
    drivers.forEach(driver => {
        const driverRides = rides.filter(r => r.driverId === driver.username);
        const acceptedRides = driverRides.filter(r => r.status === 'accepted');
        
        let driverIncome = 0;
        acceptedRides.forEach(ride => {
            let pricing;
            if (ride.recalculatedPrice && ride.priceBreakdown) {
                pricing = {
                    totalPrice: ride.recalculatedPrice,
                    breakdown: ride.priceBreakdown
                };
            } else {
                pricing = calculatePricing(ride, ratesData);
            }
            driverIncome += pricing.totalPrice;
        });
        
        // Use driver's individual service fee, default to 15% if not set
        const serviceFeePercent = driver.serviceFee !== undefined ? driver.serviceFee : 15;
        const serviceFeeDecimal = serviceFeePercent / 100;
        totalCommission += driverIncome * serviceFeeDecimal;
    });
    
    return totalCommission;
}

// Calculate expected and confirmed commission
function calculateExpectedConfirmedCommission() {
    const rides = getRides();
    const drivers = getDrivers();
    let expectedCommission = 0;
    let confirmedCommission = 0;
    
    drivers.forEach(driver => {
        // Use driver's individual service fee, default to 15% if not set
        const serviceFeePercent = driver.serviceFee !== undefined ? driver.serviceFee : 15;
        const serviceFeeDecimal = serviceFeePercent / 100;
        
        const driverRides = rides.filter(r => r.driverId === driver.username);
        const expectedRides = driverRides.filter(r => r.status === 'accepted');
        const confirmedRides = driverRides.filter(r => r.status === 'completed');
        
        expectedRides.forEach(ride => {
            let pricing;
            if (ride.recalculatedPrice && ride.priceBreakdown) {
                pricing = {
                    totalPrice: ride.recalculatedPrice,
                    breakdown: ride.priceBreakdown
                };
            } else {
                pricing = calculatePricing(ride, ratesData);
            }
            expectedCommission += pricing.totalPrice * serviceFeeDecimal;
        });
        
        confirmedRides.forEach(ride => {
            let pricing;
            if (ride.recalculatedPrice && ride.priceBreakdown) {
                pricing = {
                    totalPrice: ride.recalculatedPrice,
                    breakdown: ride.priceBreakdown
                };
            } else {
                pricing = calculatePricing(ride, ratesData);
            }
            confirmedCommission += pricing.totalPrice * serviceFeeDecimal;
        });
    });
    
    return { expectedCommission, confirmedCommission };
}

// Load stats
function loadStats() {
    const rides = getRides();
    const drivers = getDrivers();
    const pendingRides = rides.filter(r => r.status === 'pending').length;
    const acceptedRides = rides.filter(r => r.status === 'accepted').length;
    const completedRides = rides.filter(r => r.status === 'completed').length;
    const totalRides = rides.length;
    const totalCommission = calculateTotalCommission();
    const { expectedCommission, confirmedCommission } = calculateExpectedConfirmedCommission();
    
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = `
        <div class="stat-card">
            <h3>Total Drivers</h3>
            <div class="stat-value">${drivers.length}</div>
            <div class="stat-label">Active drivers</div>
        </div>
        <div class="stat-card">
            <h3>Total Rides</h3>
            <div class="stat-value">${totalRides}</div>
            <div class="stat-label">All time</div>
        </div>
        <div class="stat-card">
            <h3>Pending Rides</h3>
            <div class="stat-value">${pendingRides}</div>
            <div class="stat-label">Awaiting driver</div>
        </div>
        <div class="stat-card">
            <h3>Accepted Rides</h3>
            <div class="stat-value">${acceptedRides}</div>
            <div class="stat-label">In progress</div>
        </div>
        <div class="stat-card">
            <h3>Completed Rides</h3>
            <div class="stat-value">${completedRides}</div>
            <div class="stat-label">Finished</div>
        </div>
        <div class="stat-card" style="border-left-color: #28a745;">
            <h3>Confirmed Service Fee</h3>
            <div class="stat-value" style="color: #28a745;">${formatPrice(confirmedCommission)}</div>
            <div class="stat-label">15% from completed rides</div>
        </div>
    `;
}

// Load quick income summary
function loadQuickIncome() {
    const weeklyData = getWeeklyIncome();
    const monthlyData = getMonthlyIncome();
    
    // Calculate total income
    let weeklyTotal = 0;
    let monthlyTotal = 0;
    
    weeklyData.rides.forEach(ride => {
        const pricing = calculatePricing(ride, ratesData);
        weeklyTotal += pricing.totalPrice;
    });
    
    monthlyData.rides.forEach(ride => {
        const pricing = calculatePricing(ride, ratesData);
        monthlyTotal += pricing.totalPrice;
    });
    
    // Calculate commission for weekly and monthly periods
    const rides = getRides();
    const drivers = getDrivers();
    
    // Weekly commission - expected and confirmed
    let weeklyExpectedCommission = 0;
    let weeklyConfirmedCommission = 0;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    drivers.forEach(driver => {
        // Use driver's individual service fee, default to 15% if not set
        const serviceFeePercent = driver.serviceFee !== undefined ? driver.serviceFee : 15;
        const serviceFeeDecimal = serviceFeePercent / 100;
        
        const driverRides = rides.filter(r => 
            r.driverId === driver.username &&
            (r.status === 'accepted' || r.status === 'completed') &&
            r.acceptedAt &&
            new Date(r.acceptedAt) >= startOfWeek &&
            new Date(r.acceptedAt) <= endOfWeek
        );
        
        driverRides.forEach(ride => {
            let pricing;
            if (ride.recalculatedPrice && ride.priceBreakdown) {
                pricing = {
                    totalPrice: ride.recalculatedPrice,
                    breakdown: ride.priceBreakdown
                };
            } else {
                pricing = calculatePricing(ride, ratesData);
            }
            
            if (ride.status === 'accepted') {
                weeklyExpectedCommission += pricing.totalPrice * serviceFeeDecimal;
            } else if (ride.status === 'completed') {
                weeklyConfirmedCommission += pricing.totalPrice * serviceFeeDecimal;
            }
        });
    });
    
    const weeklyTotalCommission = weeklyExpectedCommission + weeklyConfirmedCommission;
    
    // Monthly commission - expected and confirmed
    let monthlyExpectedCommission = 0;
    let monthlyConfirmedCommission = 0;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    drivers.forEach(driver => {
        // Use driver's individual service fee, default to 15% if not set
        const serviceFeePercent = driver.serviceFee !== undefined ? driver.serviceFee : 15;
        const serviceFeeDecimal = serviceFeePercent / 100;
        
        const driverRides = rides.filter(r => 
            r.driverId === driver.username &&
            (r.status === 'accepted' || r.status === 'completed') &&
            r.acceptedAt &&
            new Date(r.acceptedAt) >= startOfMonth &&
            new Date(r.acceptedAt) <= endOfMonth
        );
        
        driverRides.forEach(ride => {
            let pricing;
            if (ride.recalculatedPrice && ride.priceBreakdown) {
                pricing = {
                    totalPrice: ride.recalculatedPrice,
                    breakdown: ride.priceBreakdown
                };
            } else {
                pricing = calculatePricing(ride, ratesData);
            }
            
            if (ride.status === 'accepted') {
                monthlyExpectedCommission += pricing.totalPrice * serviceFeeDecimal;
            } else if (ride.status === 'completed') {
                monthlyConfirmedCommission += pricing.totalPrice * serviceFeeDecimal;
            }
        });
    });
    
    const monthlyTotalCommission = monthlyExpectedCommission + monthlyConfirmedCommission;
    
    const quickIncomeSummary = document.getElementById('quickIncomeSummary');
    quickIncomeSummary.innerHTML = `
        <div class="income-period">
            <h3>This Week</h3>
            <div class="income-breakdown">
                <div class="income-item">
                    <div class="income-item-label">Total Income</div>
                    <div class="income-item-value">${formatPrice(weeklyTotal)}</div>
                </div>
                <div class="income-item">
                    <div class="income-item-label">Rides Completed</div>
                    <div class="income-item-value">${weeklyData.count}</div>
                </div>
                <div class="income-item">
                    <div class="income-item-label">Average per Ride</div>
                    <div class="income-item-value">${weeklyData.count > 0 ? formatPrice(weeklyTotal / weeklyData.count) : '$0.00'}</div>
                </div>
                <div class="income-item" style="background: #d4edda; border: 2px solid #28a745;">
                    <div class="income-item-label" style="color: #155724; font-weight: 700;">Confirmed Service Fee (15%)</div>
                    <div class="income-item-value" style="color: #155724; font-size: 1.3rem;">${formatPrice(weeklyConfirmedCommission)}</div>
                </div>
            </div>
        </div>
        <div class="income-period">
            <h3>This Month</h3>
            <div class="income-breakdown">
                <div class="income-item">
                    <div class="income-item-label">Total Income</div>
                    <div class="income-item-value">${formatPrice(monthlyTotal)}</div>
                </div>
                <div class="income-item">
                    <div class="income-item-label">Rides Completed</div>
                    <div class="income-item-value">${monthlyData.count}</div>
                </div>
                <div class="income-item">
                    <div class="income-item-label">Average per Ride</div>
                    <div class="income-item-value">${monthlyData.count > 0 ? formatPrice(monthlyTotal / monthlyData.count) : '$0.00'}</div>
                </div>
                <div class="income-item" style="background: #d4edda; border: 2px solid #28a745;">
                    <div class="income-item-label" style="color: #155724; font-weight: 700;">Confirmed Service Fee (15%)</div>
                    <div class="income-item-value" style="color: #155724; font-size: 1.3rem;">${formatPrice(monthlyConfirmedCommission)}</div>
                </div>
            </div>
        </div>
    `;
}

// Load recent activity
function loadRecentActivity() {
    const rides = getRides();
    const sortedRides = rides.sort((a, b) => {
        const dateA = a.acceptedAt || a.createdAt;
        const dateB = b.acceptedAt || b.createdAt;
        return new Date(dateB) - new Date(dateA);
    }).slice(0, 10);
    
    const recentActivity = document.getElementById('recentActivity');
    if (sortedRides.length === 0) {
        recentActivity.innerHTML = '<p style="color: #666;">No recent activity</p>';
    } else {
        recentActivity.innerHTML = sortedRides.map(ride => {
            const date = new Date(ride.acceptedAt || ride.createdAt);
            const formattedDate = formatDateTime(date);
            const status = ride.status === 'accepted' ? 'Accepted' : 'Pending';
            const driverInfo = ride.driverName ? ` by ${ride.driverName}` : '';
            return `
                <div style="background: var(--white); padding: 1rem; border-radius: 5px; margin-bottom: 0.5rem; box-shadow: var(--shadow);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: var(--primary-color);">${ride.pickup} → ${ride.destination}</strong>
                            <div style="font-size: 0.85rem; color: #666; margin-top: 0.25rem;">
                                ${status}${driverInfo} • ${formattedDate}
                            </div>
                        </div>
                        <span class="ride-status ${ride.status}">${status}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Load and display rides (admin can see all rides)
function loadRides() {
    let rides = getRides();
    
    // Filter out cancelled rides that are past their date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    rides = rides.filter(ride => {
        // Parse ride date
        const dateParts = ride.date.split('-');
        const rideDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        rideDate.setHours(0, 0, 0, 0);
        
        // Keep cancelled rides until the date has passed
        if (ride.status === 'cancelled' || ride.status === 'cancelled_by_customer') {
            return rideDate >= today;
        }
        
        // Keep all other rides
        return true;
    });
    
    if (currentView === 'rides') {
        displayListView(rides);
    } else if (currentView === 'calendar') {
        displayCalendarView(rides);
    }
    
    // Check for unconfirmed rides
    checkUnconfirmedRidesAdmin();
}

// Display list view (reuse driver dashboard function but for all rides)
function displayListView(rides) {
    const container = document.getElementById('ridesList');
    
    if (rides.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No Rides Available</h3>
                <p>There are currently no ride requests.</p>
            </div>
        `;
        return;
    }
    
    // Sort rides: pending first, then by date
    const sortedRides = rides.sort((a, b) => {
        // Status priority: pending > accepted > completed > cancelled_by_customer > cancelled
        const statusOrder = { 'pending': 1, 'accepted': 2, 'completed': 3, 'cancelled_by_customer': 4, 'cancelled': 5 };
        const statusA = statusOrder[a.status] || 5;
        const statusB = statusOrder[b.status] || 5;
        
        if (statusA !== statusB) {
            return statusA - statusB;
        }
        return new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time);
    });
    
    // Group rides by week
    const ridesByWeek = {};
    sortedRides.forEach(ride => {
        // Parse date using local time components to avoid timezone issues
        const dateParts = ride.date.split('-');
        const rideDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        // Get start of week (Sunday)
        const weekStart = new Date(rideDate);
        weekStart.setDate(rideDate.getDate() - rideDate.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        const weekKey = weekStart.toISOString().split('T')[0];
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        if (!ridesByWeek[weekKey]) {
            ridesByWeek[weekKey] = {
                weekStart: weekStart,
                weekEnd: weekEnd,
                rides: []
            };
        }
        ridesByWeek[weekKey].rides.push(ride);
    });
    
    // Sort weeks (newest first)
    const sortedWeeks = Object.keys(ridesByWeek).sort((a, b) => new Date(b) - new Date(a));
    
    container.innerHTML = sortedWeeks.map((weekKey, weekIndex) => {
        const weekData = ridesByWeek[weekKey];
        const weekStartFormatted = weekData.weekStart.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
        const weekEndFormatted = weekData.weekEnd.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        const weekId = `week-${weekIndex}`;
        
        // Count rides by status
        const pendingCount = weekData.rides.filter(r => r.status === 'pending').length;
        const acceptedCount = weekData.rides.filter(r => r.status === 'accepted').length;
        const completedCount = weekData.rides.filter(r => r.status === 'completed').length;
        const cancelledCount = weekData.rides.filter(r => r.status === 'cancelled' || r.status === 'cancelled_by_customer').length;
        
        return `
            <div class="week-section" style="margin-bottom: 1.5rem; background: var(--white); border-radius: 10px; box-shadow: var(--shadow); overflow: hidden;">
                <div class="week-header" style="padding: 1.5rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: var(--light-bg); border-bottom: 2px solid var(--primary-color);" onclick="toggleWeek('${weekId}')">
                    <div>
                        <h3 style="margin: 0; color: var(--primary-color); font-size: 1.2rem;">
                            Week of ${weekStartFormatted} - ${weekEndFormatted}
                        </h3>
                        <div style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">
                            ${weekData.rides.length} ride${weekData.rides.length !== 1 ? 's' : ''}
                            ${pendingCount > 0 ? ` • ${pendingCount} Pending` : ''}
                            ${acceptedCount > 0 ? ` • ${acceptedCount} Accepted` : ''}
                            ${completedCount > 0 ? ` • ${completedCount} Completed` : ''}
                            ${cancelledCount > 0 ? ` • ${cancelledCount} Cancelled` : ''}
                        </div>
                    </div>
                    <div style="font-size: 1.5rem; color: var(--primary-color); transition: transform 0.3s ease;" id="${weekId}-arrow">▼</div>
                </div>
                <div class="week-content" id="${weekId}-content" style="display: none; padding: 1.5rem;">
                    <div style="display: grid; gap: 1.5rem;">
                        ${weekData.rides.map(ride => createRideCard(ride)).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners for action buttons
    sortedRides.forEach(ride => {
        if (ride.status === 'pending') {
            const acceptBtn = document.getElementById(`admin-accept-${ride.id}`);
            if (acceptBtn) {
                acceptBtn.addEventListener('click', () => adminAcceptRideHandler(ride.id));
            }
        }
        
        if (ride.status === 'accepted') {
            const confirmBtn = document.getElementById(`admin-confirm-${ride.id}`);
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => adminConfirmPickupHandler(ride.id));
            }
        }
        
        if (ride.status !== 'cancelled' && ride.status !== 'cancelled_by_customer' && ride.status !== 'completed') {
            const rescheduleBtn = document.getElementById(`admin-reschedule-${ride.id}`);
            if (rescheduleBtn) {
                rescheduleBtn.addEventListener('click', () => openAdminRescheduleModal(ride.id));
            }
            
            const cancelBtn = document.getElementById(`admin-cancel-${ride.id}`);
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => adminCancelRideHandler(ride.id));
            }
        }
        
        const deleteBtn = document.getElementById(`admin-delete-${ride.id}`);
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => adminDeleteRideHandler(ride.id));
        }
    });
}

// Toggle week expansion
function toggleWeek(weekId) {
    const content = document.getElementById(`${weekId}-content`);
    const arrow = document.getElementById(`${weekId}-arrow`);
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        arrow.style.transform = 'rotate(180deg)';
    } else {
        content.style.display = 'none';
        arrow.style.transform = 'rotate(0deg)';
    }
}

// Check if a specific driver can accept a ride based on all restrictions
// Returns an object with canAccept (boolean) and reason (string)
function canDriverAcceptRideForAdmin(ride, driver) {
    if (!driver) {
        return { canAccept: false, reason: 'No driver selected' };
    }
    
    // Check vehicle type first
    const requiredVehicleType = ride.vehicleType || 'Sedans';
    
    // Get driver's available vehicle types
    let driverVehicleTypes = [];
    if (driver.vehicles && Array.isArray(driver.vehicles)) {
        driverVehicleTypes = driver.vehicles.map(v => {
            const parts = v.split(' - ');
            return parts[0] || v;
        });
    } else if (driver.vehicle) {
        const parts = driver.vehicle.split(' - ');
        driverVehicleTypes = [parts[0] || driver.vehicle];
    }
    
    if (driverVehicleTypes.length === 0) {
        return { canAccept: false, reason: 'Driver has no vehicles registered' };
    }
    
    // Helper function to check if a driver's vehicle type can handle a required vehicle type
    function canVehicleTypeHandle(driverVehicleType, requiredVehicleType) {
        const normalizedDriver = driverVehicleType.trim();
        const normalizedRequired = requiredVehicleType.trim();
        
        if (normalizedDriver === normalizedRequired) {
            return true;
        }
        
        if (normalizedDriver === 'XL SUV') {
            return normalizedRequired === 'Sedans' || normalizedRequired === 'SUV';
        }
        
        if (normalizedDriver === 'SUV') {
            return normalizedRequired === 'Sedans';
        }
        
        return false;
    }
    
    const vehicleCheck = driverVehicleTypes.some(driverVehicleType => 
        canVehicleTypeHandle(driverVehicleType, requiredVehicleType)
    );
    
    if (!vehicleCheck) {
        const vehicleTypesText = driverVehicleTypes.length > 0 ? driverVehicleTypes.join(', ') : 'none';
        return { 
            canAccept: false, 
            reason: `Driver needs a ${requiredVehicleType} to accept this ride. Driver currently has: ${vehicleTypesText}` 
        };
    }
    
    // Check day off restrictions
    const daysOff = getDaysOff();
    const rideDateString = ride.date;
    
    if (daysOff && daysOff.length > 0) {
        const isDayOff = daysOff.some(dayOff => {
            let dayOffDateString = dayOff.date;
            
            if (!dayOffDateString) return false;
            
            if (dayOffDateString.includes('T')) {
                dayOffDateString = dayOffDateString.split('T')[0];
            }
            
            if (dayOffDateString.length === 10 && dayOffDateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // Already in correct format
            } else {
                const dateParts = dayOffDateString.split('-');
                if (dateParts.length === 3) {
                    dayOffDateString = `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`;
                } else {
                    const dayOffDate = new Date(dayOffDateString);
                    if (!isNaN(dayOffDate.getTime())) {
                        const year = dayOffDate.getFullYear();
                        const month = String(dayOffDate.getMonth() + 1).padStart(2, '0');
                        const day = String(dayOffDate.getDate()).padStart(2, '0');
                        dayOffDateString = `${year}-${month}-${day}`;
                    } else {
                        return false;
                    }
                }
            }
            
            const driverMatches = dayOff.driverId === driver.username || dayOff.driverId === 'all';
            const dateMatches = dayOffDateString === rideDateString;
            
            return dateMatches && driverMatches;
        });
        
        if (isDayOff) {
            return { canAccept: false, reason: 'Driver has a scheduled day off on this date' };
        }
    }
    
    // Check time conflict restrictions
    const rides = getRides();
    const rideDateTime = new Date(`${ride.date}T${ride.time}`);
    
    // Helper function to check if a location is an airport
    function isAirportLocation(location) {
        if (!location) return false;
        const locationLower = location.toLowerCase().trim();
        
        const excludedLocations = ['cbx', 'cross border', 'long beach cruise terminal', 'cruise terminal'];
        if (excludedLocations.some(excluded => locationLower.includes(excluded))) {
            return false;
        }
        
        const airportKeywords = [
            'airport', 'sna', 'lax', 'san', 'lgb', 'ont',
            'john wayne', 'los angeles', 'san diego',
            'ontario', 'orange county airport',
            'john wayne airport', 'los angeles airport', 'san diego airport',
            'long beach airport', 'ontario airport'
        ];
        
        return airportKeywords.some(keyword => locationLower.includes(keyword));
    }
    
    // Helper function to check if two locations are the same airport
    function isSameAirport(location1, location2) {
        if (!location1 || !location2) return false;
        const loc1 = location1.toLowerCase().trim();
        const loc2 = location2.toLowerCase().trim();
        
        const airportCodes = {
            'sna': ['john wayne', 'sna', 'orange county'],
            'lax': ['los angeles', 'lax'],
            'san': ['san diego', 'san'],
            'lgb': ['long beach', 'lgb'],
            'ont': ['ontario', 'ont']
        };
        
        if (!isAirportLocation(location1) || !isAirportLocation(location2)) {
            return false;
        }
        
        if (loc1 === loc2) {
            return true;
        }
        
        for (const [code, keywords] of Object.entries(airportCodes)) {
            const loc1Matches = keywords.some(k => loc1.includes(k));
            const loc2Matches = keywords.some(k => loc2.includes(k));
            if (loc1Matches && loc2Matches) {
                return true;
            }
        }
        
        return false;
    }
    
    const conflictingRide = rides.find(r => {
        // Only check accepted rides for the same driver
        if (r.status !== 'accepted' || r.driverId !== driver.username || r.id === ride.id) {
            return false;
        }
        
        const otherRideDateTime = new Date(`${r.date}T${r.time}`);
        const timeDiff = Math.abs(rideDateTime - otherRideDateTime);
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        // Check if same time or within 2 hours
        if (hoursDiff >= 2) {
            return false; // No conflict
        }
        
        // Exception: If conflicting ride ends at an airport and new ride starts at the same airport,
        // allow it if at least 30 minutes (0.5 hours) apart
        if (hoursDiff >= 0.5) {
            const conflictingDestination = r.destination || '';
            const newRidePickup = ride.pickup || '';
            
            if (isSameAirport(conflictingDestination, newRidePickup)) {
                return false; // Same airport, allow if 30+ minutes apart
            }
        }
        
        // Conflict exists
        return true;
    });
    
    if (conflictingRide) {
        const conflictDateParts = conflictingRide.date.split('-');
        const conflictDate = new Date(parseInt(conflictDateParts[0]), parseInt(conflictDateParts[1]) - 1, parseInt(conflictDateParts[2])).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        const conflictTime = formatTime(conflictingRide.time);
        return { 
            canAccept: false, 
            reason: `Driver already has a ride scheduled on ${conflictDate} at ${conflictTime}. Rides must be at least 2 hours apart (or 30 minutes if both are at the same airport).` 
        };
    }
    
    return { canAccept: true, reason: '' };
}

// Create ride card (admin version - shows all rides, no action buttons)
function createRideCard(ride) {
    // Parse date using local time components to avoid timezone issues
    const dateParts = ride.date.split('-');
    const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
    const formattedTime = formatTime(ride.time);
    
    // Calculate pricing (use recalculated price if available, otherwise calculate)
    let pricing;
    if (ride.recalculatedPrice && ride.priceBreakdown) {
        pricing = {
            totalPrice: ride.recalculatedPrice,
            breakdown: ride.priceBreakdown,
            vehicleType: ride.vehicleType || 'Sedans',
            destination: ride.destination || 'Unknown'
        };
    } else {
        pricing = calculatePricing(ride, ratesData);
    }
    
    const statusBadge = ride.status === 'pending' 
        ? '<span class="ride-status pending">Pending</span>'
        : ride.status === 'completed'
        ? '<span class="ride-status completed" style="background: #28a745; color: white;">Completed</span>'
        : ride.status === 'cancelled_by_customer'
        ? '<span class="ride-status cancelled" style="background: #dc3545; color: white;">Cancelled by Customer</span>'
        : ride.status === 'cancelled'
        ? '<span class="ride-status cancelled" style="background: #dc3545; color: white;">Cancelled</span>'
        : '<span class="ride-status accepted">Accepted</span>';
    
    // Admin action buttons
    let actionButtons = '';
    if (ride.status === 'pending') {
        // Check if any driver can accept this ride (check first available driver)
        const drivers = getDrivers();
        let canAccept = false;
        let acceptReason = '';
        
        if (drivers.length > 0) {
            // Check if first driver can accept (admin will assign to first driver by default)
            const firstDriver = drivers[0];
            const acceptanceCheck = canDriverAcceptRideForAdmin(ride, firstDriver);
            canAccept = acceptanceCheck.canAccept;
            acceptReason = acceptanceCheck.reason;
        } else {
            canAccept = false;
            acceptReason = 'No drivers available';
        }
        
        if (canAccept) {
            actionButtons = `
                <div style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">
                    <button class="accept-btn" id="admin-accept-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 120px;">Accept Ride</button>
                    <button class="accept-btn" id="admin-reschedule-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 120px; background: #17a2b8;">Reschedule</button>
                    <button class="give-up-btn" id="admin-cancel-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 120px; background: #ffc107; color: #000;">Cancel</button>
                    <button class="give-up-btn" id="admin-delete-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 120px;">Delete</button>
                </div>
            `;
        } else {
            actionButtons = `
                <div style="margin-top: 1rem;">
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
                        <button class="accept-btn" id="admin-accept-${ride.id}" disabled style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 120px; opacity: 0.5; cursor: not-allowed;">Cannot Accept</button>
                        <button class="accept-btn" id="admin-reschedule-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 120px; background: #17a2b8;">Reschedule</button>
                        <button class="give-up-btn" id="admin-cancel-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 120px; background: #ffc107; color: #000;">Cancel</button>
                        <button class="give-up-btn" id="admin-delete-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 120px;">Delete</button>
                    </div>
                    <div style="font-size: 0.85rem; color: #dc3545; padding: 0.75rem; background: #f8d7da; border-radius: 5px; border-left: 3px solid #dc3545; margin-top: 0.5rem;">
                        ${acceptReason}
                    </div>
                </div>
            `;
        }
    } else if (ride.status === 'accepted') {
        // Check if ride is within 48 hour window for confirmation
        const rideDateTime = new Date(`${ride.date}T${ride.time}`);
        const now = new Date();
        const hoursUntilRide = (rideDateTime - now) / (1000 * 60 * 60);
        const canConfirm = hoursUntilRide >= 0 && hoursUntilRide <= 48 && !ride.confirmed;
        const isConfirmed = ride.confirmed === true;
        
        let confirmButton = '';
        if (canConfirm) {
            confirmButton = `<button class="accept-btn" id="admin-confirm-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; background: #17a2b8; min-width: 120px;">Confirm Pickup</button>`;
        } else if (isConfirmed) {
            confirmButton = `<div style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; background: #d4edda; color: #155724; border-radius: 5px; text-align: center; min-width: 120px; display: flex; align-items: center; justify-content: center;">
                ✓ Confirmed
            </div>`;
        }
        
        actionButtons = `
            <div class="detail-item"><span class="detail-label">Driver:</span><span class="detail-value">${ride.driverName || 'N/A'}</span></div>
            ${isConfirmed ? `<div class="detail-item"><span class="detail-label">Pickup Confirmed:</span><span class="detail-value">${ride.confirmedAt ? formatDateTime(ride.confirmedAt) : 'Yes'}</span></div>` : ''}
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">
                ${confirmButton}
                <button class="accept-btn" id="admin-reschedule-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 120px; background: #17a2b8;">Reschedule</button>
                <button class="give-up-btn" id="admin-cancel-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 120px; background: #ffc107; color: #000;">Cancel</button>
                <button class="give-up-btn" id="admin-delete-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 120px;">Delete</button>
            </div>
            ${!isConfirmed && !canConfirm && hoursUntilRide > 48 ? '<div style="font-size: 0.85rem; color: #856404; padding: 0.5rem; background: #fff3cd; border-radius: 5px; margin-top: 0.5rem; border-left: 3px solid #ffc107;">Confirmation will be available within 48 hours before the ride.</div>' : ''}
        `;
    } else if (ride.status === 'completed') {
        actionButtons = `
            <div class="detail-item"><span class="detail-label">Driver:</span><span class="detail-value">${ride.driverName || 'N/A'}</span></div>
            <div class="detail-item"><span class="detail-label">Completed:</span><span class="detail-value">${ride.completedAt ? formatDateTime(ride.completedAt) : 'N/A'}</span></div>
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">
                <button class="give-up-btn" id="admin-delete-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 120px;">Delete</button>
            </div>
        `;
    } else if (ride.status === 'cancelled_by_customer') {
        actionButtons = `
            <div class="detail-item"><span class="detail-label">Cancelled by Customer:</span><span class="detail-value">${ride.cancelledAt ? formatDateTime(ride.cancelledAt) : 'N/A'}</span></div>
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">
                <button class="give-up-btn" id="admin-delete-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 120px;">Delete</button>
            </div>
        `;
    } else if (ride.status === 'cancelled') {
        actionButtons = `
            <div class="detail-item"><span class="detail-label">Cancelled:</span><span class="detail-value">${ride.cancelledAt ? formatDateTime(ride.cancelledAt) : 'N/A'}</span></div>
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap;">
                <button class="give-up-btn" id="admin-delete-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 120px;">Delete</button>
            </div>
        `;
    }
    
    // Pricing breakdown
    const pricingBreakdown = `
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--light-bg);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <strong style="color: var(--primary-color); font-size: 1.2rem;">Total Price:</strong>
                <strong style="color: var(--accent-color); font-size: 1.5rem;">${formatPrice(pricing.totalPrice)}</strong>
            </div>
            <div style="font-size: 0.9rem; color: #666;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span>Base Price (${pricing.vehicleType}):</span>
                    <span>${formatPrice(pricing.breakdown.basePrice)}</span>
                </div>
                ${pricing.breakdown.baggageClaimFee > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span>Baggage Claim Meeting:</span>
                    <span>${formatPrice(pricing.breakdown.baggageClaimFee)}</span>
                </div>
                ` : ''}
                ${pricing.breakdown.afterHoursFee > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span>After Hours Fee:</span>
                    <span>${formatPrice(pricing.breakdown.afterHoursFee)}</span>
                </div>
                ` : ''}
                ${pricing.breakdown.holidayFee > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span>Major Holiday Fee:</span>
                    <span>${formatPrice(pricing.breakdown.holidayFee)}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    return `
        <div class="ride-card ${ride.status}">
            <div class="ride-header">
                <div>
                    <h3 style="margin: 0; color: var(--primary-color);">${ride.pickup} → ${ride.destination}</h3>
                    <div style="font-size: 0.85rem; color: #666; margin-top: 0.25rem;">${pricing.destination}</div>
                </div>
                ${statusBadge}
            </div>
            <div class="ride-details">
                <div class="detail-item">
                    <span class="detail-label">Passenger Name</span>
                    <span class="detail-value">${ride.name}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">${ride.email}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Phone Number</span>
                    <span class="detail-value">${ride.phone}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Pickup Location</span>
                    <span class="detail-value">${ride.pickup}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Dropoff Location</span>
                    <span class="detail-value">${ride.destination}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">${formattedDate}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Time</span>
                    <span class="detail-value">${formattedTime}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Number of Passengers</span>
                    <span class="detail-value">${ride.passengers}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Vehicle Type</span>
                    <span class="detail-value">${ride.vehicleType || 'Not specified'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Baggage Claim Meeting</span>
                    <span class="detail-value">${ride.baggageClaim === 'Y' ? 'Yes' : 'No'}</span>
                </div>
                ${ride.isAirportTrip ? `
                <div class="detail-item" style="grid-column: 1 / -1; background: #e3f2fd; padding: 0.75rem; border-radius: 5px; margin-top: 0.5rem;">
                    <div style="font-weight: 600; color: var(--primary-color); margin-bottom: 0.5rem;">Flight Information:</div>
                    <div class="detail-item" style="margin-bottom: 0.25rem;">
                        <span class="detail-label">Flight Number:</span>
                        <span class="detail-value">${ride.flightNumber || 'Not provided'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Airline:</span>
                        <span class="detail-value">${ride.airline || 'Not provided'}</span>
                    </div>
                </div>
                ` : ''}
                ${ride.driverName ? `
                <div class="detail-item">
                    <span class="detail-label">Driver</span>
                    <span class="detail-value">${ride.driverName}</span>
                </div>
                ` : ''}
            </div>
            ${pricingBreakdown}
            ${actionButtons}
        </div>
    `;
}

// Display calendar view (reuse from driver dashboard)
function displayCalendarView(rides) {
    const container = document.getElementById('calendarGrid');
    
    if (rides.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No Rides Available</h3>
                <p>There are currently no ride requests.</p>
            </div>
        `;
        return;
    }
    
    // Group rides by date
    const ridesByDate = {};
    rides.forEach(ride => {
        if (!ridesByDate[ride.date]) {
            ridesByDate[ride.date] = [];
        }
        ridesByDate[ride.date].push(ride);
    });
    
    // Sort dates
    const sortedDates = Object.keys(ridesByDate).sort();
    
    container.innerHTML = sortedDates.map(date => {
        // Parse date using local time components to avoid timezone issues
        const dateParts = date.split('-');
        const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });
        const dayRides = ridesByDate[date].sort((a, b) => a.time.localeCompare(b.time));
        
        return `
            <div class="calendar-day">
                <div class="calendar-day-header">${formattedDate}</div>
                <div class="day-rides">
                    ${dayRides.map(ride => createCalendarRideItem(ride)).join('')}
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners for calendar view action buttons
    rides.forEach(ride => {
        if (ride.status === 'pending') {
            const acceptBtn = document.getElementById(`admin-accept-calendar-${ride.id}`);
            if (acceptBtn) {
                acceptBtn.addEventListener('click', () => adminAcceptRideHandler(ride.id));
            }
        }
        
        if (ride.status === 'accepted') {
            const confirmBtn = document.getElementById(`admin-confirm-calendar-${ride.id}`);
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => adminConfirmPickupHandler(ride.id));
            }
        }
        
        if (ride.status !== 'cancelled' && ride.status !== 'cancelled_by_customer' && ride.status !== 'completed') {
            const rescheduleBtn = document.getElementById(`admin-reschedule-calendar-${ride.id}`);
            if (rescheduleBtn) {
                rescheduleBtn.addEventListener('click', () => openAdminRescheduleModal(ride.id));
            }
            
            const cancelBtn = document.getElementById(`admin-cancel-calendar-${ride.id}`);
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => adminCancelRideHandler(ride.id));
            }
        }
        
        const deleteBtn = document.getElementById(`admin-delete-calendar-${ride.id}`);
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => adminDeleteRideHandler(ride.id));
        }
    });
}

// Create calendar ride item
function createCalendarRideItem(ride) {
    const formattedTime = formatTime(ride.time);
    
    // Calculate pricing (use recalculated price if available, otherwise calculate)
    let pricing;
    if (ride.recalculatedPrice && ride.priceBreakdown) {
        pricing = {
            totalPrice: ride.recalculatedPrice,
            breakdown: ride.priceBreakdown,
            vehicleType: ride.vehicleType || 'Sedans',
            destination: ride.destination || 'Unknown'
        };
    } else {
        pricing = calculatePricing(ride, ratesData);
    }
    
    const statusBadge = ride.status === 'pending' 
        ? '<span class="ride-status pending" style="font-size: 0.75rem; padding: 0.2rem 0.5rem;">Pending</span>'
        : ride.status === 'completed'
        ? '<span class="ride-status completed" style="font-size: 0.75rem; padding: 0.2rem 0.5rem; background: #28a745; color: white;">Completed</span>'
        : ride.status === 'cancelled_by_customer'
        ? '<span class="ride-status cancelled" style="font-size: 0.75rem; padding: 0.2rem 0.5rem; background: #dc3545; color: white;">Cancelled by Customer</span>'
        : ride.status === 'cancelled'
        ? '<span class="ride-status cancelled" style="font-size: 0.75rem; padding: 0.2rem 0.5rem; background: #dc3545; color: white;">Cancelled</span>'
        : '<span class="ride-status accepted" style="font-size: 0.75rem; padding: 0.2rem 0.5rem;">Accepted</span>';
    
    // Admin action buttons for calendar view
    let actionButtons = '';
    if (ride.status === 'pending') {
        // Check if any driver can accept this ride (check first available driver)
        const drivers = getDrivers();
        let canAccept = false;
        let acceptReason = '';
        
        if (drivers.length > 0) {
            // Check if first driver can accept (admin will assign to first driver by default)
            const firstDriver = drivers[0];
            const acceptanceCheck = canDriverAcceptRideForAdmin(ride, firstDriver);
            canAccept = acceptanceCheck.canAccept;
            acceptReason = acceptanceCheck.reason;
        } else {
            canAccept = false;
            acceptReason = 'No drivers available';
        }
        
        if (canAccept) {
            actionButtons = `
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;">
                    <button class="accept-btn" id="admin-accept-calendar-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 100px;">Accept</button>
                    <button class="accept-btn" id="admin-reschedule-calendar-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 100px; background: #17a2b8;">Reschedule</button>
                    <button class="give-up-btn" id="admin-cancel-calendar-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 100px; background: #ffc107; color: #000;">Cancel</button>
                    <button class="give-up-btn" id="admin-delete-calendar-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 100px;">Delete</button>
                </div>
            `;
        } else {
            actionButtons = `
                <div style="margin-top: 0.5rem;">
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
                        <button class="accept-btn" id="admin-accept-calendar-${ride.id}" disabled style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 100px; opacity: 0.5; cursor: not-allowed;">Cannot Accept</button>
                        <button class="accept-btn" id="admin-reschedule-calendar-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 100px; background: #17a2b8;">Reschedule</button>
                        <button class="give-up-btn" id="admin-cancel-calendar-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 100px; background: #ffc107; color: #000;">Cancel</button>
                        <button class="give-up-btn" id="admin-delete-calendar-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 100px;">Delete</button>
                    </div>
                    <div style="font-size: 0.75rem; color: #dc3545; padding: 0.5rem; background: #f8d7da; border-radius: 5px; border-left: 3px solid #dc3545;">
                        ${acceptReason}
                    </div>
                </div>
            `;
        }
    } else if (ride.status === 'accepted') {
        // Check if ride is within 48 hour window for confirmation
        const rideDateTime = new Date(`${ride.date}T${ride.time}`);
        const now = new Date();
        const hoursUntilRide = (rideDateTime - now) / (1000 * 60 * 60);
        const canConfirm = hoursUntilRide >= 0 && hoursUntilRide <= 48 && !ride.confirmed;
        const isConfirmed = ride.confirmed === true;
        
        let confirmButton = '';
        if (canConfirm) {
            confirmButton = `<button class="accept-btn" id="admin-confirm-calendar-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; background: #17a2b8; min-width: 100px;">Confirm</button>`;
        } else if (isConfirmed) {
            confirmButton = `<div style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; background: #d4edda; color: #155724; border-radius: 5px; text-align: center; min-width: 100px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">
                ✓ Confirmed
            </div>`;
        }
        
        actionButtons = `
            <div style="font-size: 0.85rem; margin-top: 0.25rem; color: #666;">Driver: ${ride.driverName || 'N/A'}</div>
            ${isConfirmed ? `<div style="font-size: 0.75rem; margin-top: 0.25rem; color: #155724;">✓ Confirmed ${ride.confirmedAt ? formatDateTime(ride.confirmedAt, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}</div>` : ''}
            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;">
                ${confirmButton}
                <button class="accept-btn" id="admin-reschedule-calendar-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 100px; background: #17a2b8;">Reschedule</button>
                <button class="give-up-btn" id="admin-cancel-calendar-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 100px; background: #ffc107; color: #000;">Cancel</button>
                <button class="give-up-btn" id="admin-delete-calendar-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 100px;">Delete</button>
            </div>
        `;
    } else if (ride.status === 'completed') {
        actionButtons = `
            <div style="font-size: 0.85rem; margin-top: 0.25rem; color: #666;">Driver: ${ride.driverName || 'N/A'}</div>
            <div style="font-size: 0.85rem; margin-top: 0.25rem; color: #666;">Completed: ${ride.completedAt ? formatDateTime(ride.completedAt, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'N/A'}</div>
            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;">
                <button class="give-up-btn" id="admin-delete-calendar-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 100px;">Delete</button>
            </div>
        `;
    } else if (ride.status === 'cancelled_by_customer') {
        actionButtons = `
            <div style="font-size: 0.85rem; margin-top: 0.25rem; color: #666;">Cancelled by Customer: ${ride.cancelledAt ? formatDateTime(ride.cancelledAt, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'N/A'}</div>
            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;">
                <button class="give-up-btn" id="admin-delete-calendar-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 100px;">Delete</button>
            </div>
        `;
    } else if (ride.status === 'cancelled') {
        actionButtons = `
            <div style="font-size: 0.85rem; margin-top: 0.25rem; color: #666;">Cancelled: ${ride.cancelledAt ? formatDateTime(ride.cancelledAt, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'N/A'}</div>
            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;">
                <button class="give-up-btn" id="admin-delete-calendar-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 100px;">Delete</button>
            </div>
        `;
    }
    
    return `
        <div class="day-ride-item">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <strong style="color: var(--primary-color);">${formattedTime}</strong>
                ${statusBadge}
            </div>
            <div style="font-size: 0.85rem; margin-bottom: 0.25rem;">
                <strong>${ride.name}</strong> - ${ride.passengers} passenger${ride.passengers > 1 ? 's' : ''}
            </div>
            <div style="font-size: 0.85rem; color: #666; margin-bottom: 0.25rem;">
                ${ride.pickup} → ${ride.destination}
            </div>
            <div style="font-size: 0.85rem; color: #666; margin-bottom: 0.25rem;">
                Vehicle: ${ride.vehicleType || 'N/A'} | Baggage Claim: ${ride.baggageClaim === 'Y' ? 'Yes' : 'No'}
            </div>
            ${ride.isAirportTrip ? `
            <div style="font-size: 0.85rem; background: #e3f2fd; padding: 0.5rem; border-radius: 3px; margin-bottom: 0.25rem;">
                <strong>Flight:</strong> ${ride.flightNumber || 'N/A'} | <strong>Airline:</strong> ${ride.airline || 'N/A'}
            </div>
            ` : ''}
            <div style="font-size: 0.85rem; color: var(--accent-color); font-weight: 600; margin-bottom: 0.25rem;">
                Total: ${formatPrice(pricing.totalPrice)}
            </div>
            <div style="font-size: 0.75rem; color: #999;">
                Phone: ${ride.phone} | Email: ${ride.email}
            </div>
            ${actionButtons}
        </div>
    `;
}

// Load drivers
function loadDrivers() {
    const drivers = getDrivers();
    const rides = getRides();
    
    const driversList = document.getElementById('driversList');
    driversList.innerHTML = drivers.map(driver => {
        const driverRides = rides.filter(r => r.driverId === driver.username);
        const acceptedRides = driverRides.filter(r => r.status === 'accepted');
        
        // Calculate driver income
        let driverIncome = 0;
        acceptedRides.forEach(ride => {
            let pricing;
            if (ride.recalculatedPrice && ride.priceBreakdown) {
                pricing = {
                    totalPrice: ride.recalculatedPrice,
                    breakdown: ride.priceBreakdown
                };
            } else {
                pricing = calculatePricing(ride, ratesData);
            }
            driverIncome += pricing.totalPrice;
        });
        
        // Use driver's individual service fee, default to 15% if not set
        const serviceFeePercent = driver.serviceFee !== undefined ? driver.serviceFee : 15;
        const serviceFeeDecimal = serviceFeePercent / 100;
        const commission = driverIncome * serviceFeeDecimal;
        const driverNetIncome = driverIncome - commission;
        
        // Calculate expected and confirmed rides and service fees
        const expectedRides = driverRides.filter(r => r.status === 'accepted');
        const confirmedRides = driverRides.filter(r => r.status === 'completed');
        
        let expectedIncome = 0;
        expectedRides.forEach(ride => {
            let pricing;
            if (ride.recalculatedPrice && ride.priceBreakdown) {
                pricing = {
                    totalPrice: ride.recalculatedPrice,
                    breakdown: ride.priceBreakdown
                };
            } else {
                pricing = calculatePricing(ride, ratesData);
            }
            expectedIncome += pricing.totalPrice;
        });
        
        let confirmedIncome = 0;
        confirmedRides.forEach(ride => {
            let pricing;
            if (ride.recalculatedPrice && ride.priceBreakdown) {
                pricing = {
                    totalPrice: ride.recalculatedPrice,
                    breakdown: ride.priceBreakdown
                };
            } else {
                pricing = calculatePricing(ride, ratesData);
            }
            confirmedIncome += pricing.totalPrice;
        });
        
        const expectedServiceFee = expectedIncome * serviceFeeDecimal;
        const confirmedServiceFee = confirmedIncome * serviceFeeDecimal;
        
        return `
            <div class="driver-card" style="cursor: pointer;" onclick="showDriverDetails('${driver.username}')">
                <h3>${driver.name}</h3>
                <div class="driver-info-item">
                    <strong>Username:</strong> ${driver.username}
                </div>
                <div class="driver-info-item">
                    <strong>Email:</strong> ${driver.email}
                </div>
                <div class="driver-info-item">
                    <strong>Phone:</strong> ${driver.phone}
                </div>
                <div class="driver-info-item">
                    <strong>Vehicle:</strong> ${driver.vehicle}
                </div>
                <div class="driver-info-item" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--light-bg);">
                    <strong>Total Rides:</strong> ${acceptedRides.length + confirmedRides.length}
                </div>
                <div class="driver-info-item">
                    <strong>Completed Rides:</strong> ${confirmedRides.length}
                </div>
                <div class="driver-info-item" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--light-bg); background: #fff3cd; padding: 1rem; border-radius: 5px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <strong style="color: #856404;">Expected Service Fee (${serviceFeePercent}%):</strong>
                        <strong style="color: #856404; font-size: 1.1rem;">${formatPrice(expectedServiceFee)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <strong style="color: #155724;">Confirmed Service Fee (${serviceFeePercent}%):</strong>
                        <strong style="color: #155724; font-size: 1.1rem;">${formatPrice(confirmedServiceFee)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.5rem; border-top: 1px solid #ffc107;">
                        <strong style="color: #856404;">Total Service Fee (${serviceFeePercent}%):</strong>
                        <strong style="color: #856404; font-size: 1.2rem;">${formatPrice(expectedServiceFee + confirmedServiceFee)}</strong>
                    </div>
                </div>
                <div style="margin-top: 1rem; padding-top: 1rem; display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
                    <button style="padding: 0.5rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 0.9rem;" onclick="event.stopPropagation(); showDriverDetails('${driver.username}')">View Details</button>
                    <button style="padding: 0.5rem 1rem; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 0.9rem;" onclick="event.stopPropagation(); startConversationWithDriver('${driver.username}', '${driver.name}')">Message</button>
                    <button style="padding: 0.5rem 1rem; background: #17a2b8; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 0.9rem;" onclick="event.stopPropagation(); resetDriverPasswordHandler('${driver.username}')">Reset Password</button>
                    <button style="padding: 0.5rem 1rem; background: var(--error-color); color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 0.9rem;" onclick="event.stopPropagation(); deleteDriverHandler('${driver.username}')">Remove Driver</button>
                </div>
            </div>
        `;
    }).join('');
}

// Update driver service fee
async function updateDriverServiceFee(driverUsername) {
    const serviceFeeInput = document.getElementById('driverServiceFeeInput');
    if (!serviceFeeInput) {
        alert('Service fee input not found');
        return;
    }
    
    const serviceFee = parseFloat(serviceFeeInput.value);
    
    if (isNaN(serviceFee) || serviceFee < 0 || serviceFee > 100) {
        alert('Please enter a valid service fee between 0 and 100');
        return;
    }
    
    // Update driver using API
    if (typeof API !== 'undefined' && API.drivers) {
        try {
            await API.drivers.update(driverUsername, { serviceFee });
            // Reload driver details to show updated fee
            showDriverDetails(driverUsername);
            // Reload drivers list to show updated fee
            loadDrivers();
            alert(`Service fee updated to ${serviceFee}% for this driver.`);
        } catch (error) {
            console.error('Error updating service fee:', error);
            alert('Error updating service fee. Please try again.');
        }
    } else {
        // Fallback to local storage
        const drivers = getDrivers();
        const driver = drivers.find(d => d.username === driverUsername);
        if (driver) {
            driver.serviceFee = serviceFee;
            saveDrivers(drivers);
            showDriverDetails(driverUsername);
            loadDrivers();
            alert(`Service fee updated to ${serviceFee}% for this driver.`);
        }
    }
}

// Delete driver handler
function deleteDriverHandler(driverUsername) {
    const drivers = getDrivers();
    const driver = drivers.find(d => d.username === driverUsername);
    
    if (!driver) {
        alert('Driver not found');
        return;
    }
    
    const driverRides = getRides().filter(r => r.driverId === driverUsername);
    const activeRides = driverRides.filter(r => r.status === 'accepted');
    
    let confirmMessage = `Are you sure you want to remove ${driver.name}?`;
    if (activeRides.length > 0) {
        confirmMessage += `\n\nThis driver has ${activeRides.length} active ride(s) that will be returned to pending status.`;
    }
    confirmMessage += '\n\nThis action cannot be undone.';
    
    if (confirm(confirmMessage)) {
        const deleted = deleteDriver(driverUsername);
        if (deleted) {
            alert(`${driver.name} has been removed successfully.`);
            loadDrivers();
        } else {
            alert('Error removing driver. Please try again.');
        }
    }
}

// Reset driver password handler
function resetDriverPasswordHandler(driverUsername) {
    const drivers = getDrivers();
    const driver = drivers.find(d => d.username === driverUsername);
    
    if (!driver) {
        alert('Driver not found');
        return;
    }
    
    const newPassword = prompt(`Reset password for ${driver.name} (${driver.username}):\n\nEnter new password (minimum 6 characters):`);
    
    if (!newPassword) {
        return; // User cancelled
    }
    
    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
    }
    
    if (confirm(`Are you sure you want to reset the password for ${driver.name}?\n\nNew password: ${newPassword}`)) {
        const reset = resetDriverPassword(driverUsername, newPassword);
        if (reset) {
            alert(`Password has been reset successfully for ${driver.name}.\n\nNew password: ${newPassword}\n\nPlease inform the driver of their new password.`);
            loadDrivers();
        } else {
            alert('Error resetting password. Please try again.');
        }
    }
}

// Show driver details modal
function showDriverDetails(driverUsername) {
    const drivers = getDrivers();
    const driver = drivers.find(d => d.username === driverUsername);
    
    if (!driver) {
        alert('Driver not found');
        return;
    }
    
    const rides = getRides();
    // Filter out archived rides (only show active completed rides)
    const driverRides = rides.filter(r => r.driverId === driverUsername);
    const completedRides = driverRides.filter(r => r.status === 'completed');
    
    // Calculate expected and confirmed service fees
    const expectedRides = driverRides.filter(r => r.status === 'accepted');
    let expectedIncome = 0;
    
    // Build expected ride details
    const expectedRideDetails = [];
    expectedRides.forEach(ride => {
        let pricing;
        if (ride.recalculatedPrice && ride.priceBreakdown) {
            pricing = {
                totalPrice: ride.recalculatedPrice,
                breakdown: ride.priceBreakdown
            };
        } else {
            pricing = calculatePricing(ride, ratesData);
        }
        expectedIncome += pricing.totalPrice;
        
        // Parse date using local time components to avoid timezone issues
        const dateParts = ride.date.split('-');
        const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        const time = formatTime(ride.time);
        const acceptedDate = ride.acceptedAt ? formatDateTime(ride.acceptedAt) : 'N/A';
        
        expectedRideDetails.push({
            date: date,
            time: time,
            pickup: ride.pickup,
            destination: ride.destination,
            passengers: ride.passengers,
            price: pricing.totalPrice,
            acceptedDate: acceptedDate,
            customerName: ride.name,
            customerEmail: ride.email,
            customerPhone: ride.phone
        });
    });
    
    let confirmedIncome = 0;
    const completedRideDetails = [];
    completedRides.forEach(ride => {
        let pricing;
        if (ride.recalculatedPrice && ride.priceBreakdown) {
            pricing = {
                totalPrice: ride.recalculatedPrice,
                breakdown: ride.priceBreakdown
            };
        } else {
            pricing = calculatePricing(ride, ratesData);
        }
        confirmedIncome += pricing.totalPrice;
        
        // Parse date using local time components to avoid timezone issues
        const dateParts = ride.date.split('-');
        const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        const time = formatTime(ride.time);
        const completedDate = ride.completedAt ? formatDateTime(ride.completedAt) : 'N/A';
        
        completedRideDetails.push({
            date: date,
            time: time,
            pickup: ride.pickup,
            destination: ride.destination,
            passengers: ride.passengers,
            price: pricing.totalPrice,
            completedDate: completedDate,
            customerName: ride.name,
            customerEmail: ride.email,
            customerPhone: ride.phone
        });
    });
    
    // Use driver's individual service fee, default to 15% if not set
    const serviceFeePercent = driver.serviceFee !== undefined ? driver.serviceFee : 15;
    const serviceFeeDecimal = serviceFeePercent / 100;
    const expectedServiceFee = expectedIncome * serviceFeeDecimal;
    const confirmedServiceFee = confirmedIncome * serviceFeeDecimal;
    
    // Sort rides by date (newest first)
    expectedRideDetails.sort((a, b) => {
        // Parse dates using local time components to avoid timezone issues
        const datePartsA = a.date.split('-');
        const datePartsB = b.date.split('-');
        const dateA = new Date(parseInt(datePartsA[0]), parseInt(datePartsA[1]) - 1, parseInt(datePartsA[2]));
        const dateB = new Date(parseInt(datePartsB[0]), parseInt(datePartsB[1]) - 1, parseInt(datePartsB[2]));
        return dateB - dateA;
    });
    
    completedRideDetails.sort((a, b) => {
        // Parse dates using local time components to avoid timezone issues
        const datePartsA = a.date.split('-');
        const datePartsB = b.date.split('-');
        const dateA = new Date(parseInt(datePartsA[0]), parseInt(datePartsA[1]) - 1, parseInt(datePartsA[2]));
        const dateB = new Date(parseInt(datePartsB[0]), parseInt(datePartsB[1]) - 1, parseInt(datePartsB[2]));
        return dateB - dateA;
    });
    
    const modal = document.getElementById('driverDetailsModal');
    const modalTitle = document.getElementById('driverModalTitle');
    const modalContent = document.getElementById('driverDetailsContent');
    
    modalTitle.textContent = `${driver.name} - Driver Details`;
    
    modalContent.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Driver Information</h3>
            <div style="background: var(--light-bg); padding: 1.5rem; border-radius: 5px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div>
                        <strong>Name:</strong> ${driver.name}
                    </div>
                    <div>
                        <strong>Username:</strong> ${driver.username}
                    </div>
                    <div>
                        <strong>Email:</strong> ${driver.email}
                    </div>
                    <div>
                        <strong>Phone:</strong> ${driver.phone}
                    </div>
                    <div>
                        <strong>Vehicle:</strong> ${driver.vehicle}
                    </div>
                </div>
            </div>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Service Fee Settings</h3>
            <div style="background: var(--light-bg); padding: 1.5rem; border-radius: 5px; margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
                    <label style="font-weight: 600; color: var(--text-color);">
                        Service Fee Percentage:
                    </label>
                    <input 
                        type="number" 
                        id="driverServiceFeeInput" 
                        value="${serviceFeePercent}" 
                        min="0" 
                        max="100" 
                        step="0.1"
                        style="padding: 0.5rem; border: 2px solid var(--primary-color); border-radius: 5px; width: 100px; font-size: 1rem;"
                    />
                    <span style="font-weight: 600; color: var(--text-color);">%</span>
                    <button 
                        onclick="updateDriverServiceFee('${driver.username}')"
                        style="padding: 0.5rem 1.5rem; background: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 0.9rem;"
                    >
                        Update Service Fee
                    </button>
                </div>
                <div style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">
                    This percentage will be applied to all rides for this driver. Default is 15%.
                </div>
            </div>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Service Fee Summary</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                <div style="background: #fff3cd; padding: 1.5rem; border-radius: 5px; border: 2px solid #ffc107;">
                    <div style="font-weight: 700; color: #856404; margin-bottom: 0.5rem;">Expected Service Fee (${serviceFeePercent}%)</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #856404;">${formatPrice(expectedServiceFee)}</div>
                    <div style="font-size: 0.9rem; color: #856404; margin-top: 0.5rem;">From ${expectedRides.length} incomplete ride${expectedRides.length !== 1 ? 's' : ''}</div>
                </div>
                <div style="background: #d4edda; padding: 1.5rem; border-radius: 5px; border: 2px solid #28a745;">
                    <div style="font-weight: 700; color: #155724; margin-bottom: 0.5rem;">Confirmed Service Fee (${serviceFeePercent}%)</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #155724;">${formatPrice(confirmedServiceFee)}</div>
                    <div style="font-size: 0.9rem; color: #155724; margin-top: 0.5rem;">From ${completedRides.length} completed ride${completedRides.length !== 1 ? 's' : ''}</div>
                </div>
                <div style="background: #fff3cd; padding: 1.5rem; border-radius: 5px; border: 2px solid #ff9800;">
                    <div style="font-weight: 700; color: #856404; margin-bottom: 0.5rem;">Total Service Fee (${serviceFeePercent}%)</div>
                    <div style="font-size: 1.8rem; font-weight: 700; color: #856404;">${formatPrice(expectedServiceFee + confirmedServiceFee)}</div>
                    <div style="font-size: 0.9rem; color: #856404; margin-top: 0.5rem;">From all rides</div>
                </div>
            </div>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Expected Rides (${expectedRides.length})</h3>
            ${expectedRides.length === 0 ? `
                <div style="text-align: center; padding: 2rem; color: #666; background: var(--light-bg); border-radius: 5px;">
                    <p>No expected rides (incomplete rides)</p>
                </div>
            ` : `
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: var(--light-bg);">
                                <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #ffc107; color: var(--primary-color);">Date</th>
                                <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #ffc107; color: var(--primary-color);">Time</th>
                                <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #ffc107; color: var(--primary-color);">Route</th>
                                <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #ffc107; color: var(--primary-color);">Customer</th>
                                <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #ffc107; color: var(--primary-color);">Passengers</th>
                                <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #ffc107; color: var(--primary-color);">Amount</th>
                                <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #ffc107; color: var(--primary-color);">Accepted</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${expectedRideDetails.map(ride => `
                                <tr style="border-bottom: 1px solid var(--light-bg);">
                                    <td style="padding: 0.75rem;">${ride.date}</td>
                                    <td style="padding: 0.75rem;">${ride.time}</td>
                                    <td style="padding: 0.75rem;">${ride.pickup} → ${ride.destination}</td>
                                    <td style="padding: 0.75rem;">
                                        <div>${ride.customerName}</div>
                                        <div style="font-size: 0.85rem; color: #666;">${ride.customerEmail}</div>
                                        <div style="font-size: 0.85rem; color: #666;">${ride.customerPhone}</div>
                                    </td>
                                    <td style="padding: 0.75rem; text-align: center;">${ride.passengers}</td>
                                    <td style="padding: 0.75rem; text-align: right; font-weight: 600; color: var(--accent-color);">${formatPrice(ride.price)}</td>
                                    <td style="padding: 0.75rem; font-size: 0.9rem; color: #666;">${ride.acceptedDate}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr style="background: #fff3cd; font-weight: 700;">
                                <td colspan="5" style="padding: 0.75rem; text-align: right; color: #856404;">Expected Income:</td>
                                <td style="padding: 0.75rem; text-align: right; color: #856404;">${formatPrice(expectedIncome)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `}
        </div>
        
        <div>
            <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Completed Rides (${completedRides.length})</h3>
            ${completedRides.length === 0 ? `
                <div style="text-align: center; padding: 2rem; color: #666; background: var(--light-bg); border-radius: 5px;">
                    <p>No completed rides yet</p>
                </div>
            ` : `
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: var(--light-bg);">
                                <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--primary-color); color: var(--primary-color);">Date</th>
                                <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--primary-color); color: var(--primary-color);">Time</th>
                                <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--primary-color); color: var(--primary-color);">Route</th>
                                <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--primary-color); color: var(--primary-color);">Customer</th>
                                <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid var(--primary-color); color: var(--primary-color);">Passengers</th>
                                <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid var(--primary-color); color: var(--primary-color);">Amount</th>
                                <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--primary-color); color: var(--primary-color);">Completed</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${completedRideDetails.map(ride => `
                                <tr style="border-bottom: 1px solid var(--light-bg);">
                                    <td style="padding: 0.75rem;">${ride.date}</td>
                                    <td style="padding: 0.75rem;">${ride.time}</td>
                                    <td style="padding: 0.75rem;">${ride.pickup} → ${ride.destination}</td>
                                    <td style="padding: 0.75rem;">
                                        <div>${ride.customerName}</div>
                                        <div style="font-size: 0.85rem; color: #666;">${ride.customerEmail}</div>
                                        <div style="font-size: 0.85rem; color: #666;">${ride.customerPhone}</div>
                                    </td>
                                    <td style="padding: 0.75rem; text-align: center;">${ride.passengers}</td>
                                    <td style="padding: 0.75rem; text-align: right; font-weight: 600; color: var(--accent-color);">${formatPrice(ride.price)}</td>
                                    <td style="padding: 0.75rem; font-size: 0.9rem; color: #666;">${ride.completedDate}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr style="background: var(--light-bg); font-weight: 700;">
                                <td colspan="5" style="padding: 0.75rem; text-align: right; color: var(--primary-color);">Total Income:</td>
                                <td style="padding: 0.75rem; text-align: right; color: var(--accent-color);">${formatPrice(confirmedIncome)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `}
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Close driver details modal
function closeDriverDetailsModal() {
    const modal = document.getElementById('driverDetailsModal');
    modal.style.display = 'none';
}

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('driverDetailsModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeDriverDetailsModal();
            }
        });
    }
    
    // Admin reschedule form handler
    const adminRescheduleForm = document.getElementById('adminRescheduleForm');
    if (adminRescheduleForm) {
        adminRescheduleForm.addEventListener('submit', handleAdminReschedule);
    }
    
    // Close admin reschedule modal when clicking outside
    const adminRescheduleModal = document.getElementById('adminRescheduleModal');
    if (adminRescheduleModal) {
        adminRescheduleModal.addEventListener('click', function(e) {
            if (e.target === adminRescheduleModal) {
                closeAdminRescheduleModal();
            }
        });
    }
});

// Admin confirm pickup handler
async function adminConfirmPickupHandler(rideId) {
    const ride = getRides().find(r => r.id === rideId);
    if (!ride) {
        alert('Ride not found');
        return;
    }
    
    if (ride.status !== 'accepted') {
        alert('This ride cannot be confirmed');
        return;
    }
    
    if (ride.confirmed) {
        alert('This ride has already been confirmed');
        return;
    }
    
    // Parse date for display
    const dateParts = ride.date.split('-');
    const formattedDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
    const formattedTime = formatTime(ride.time);
    
    if (!confirm(`Confirm pickup for this ride?\n\n${ride.pickup} → ${ride.destination}\nDate: ${formattedDate}\nTime: ${formattedTime}\nDriver: ${ride.driverName || 'N/A'}\n\nThis will send a confirmation email to the customer.`)) {
        return;
    }
    
    // Disable button
    const confirmBtn = document.getElementById(`admin-confirm-${rideId}`) || document.getElementById(`admin-confirm-calendar-${rideId}`);
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Confirming...';
    }
    
    try {
        // Confirm the pickup (admin can confirm any ride)
        const updatedRide = confirmPickup(rideId, currentAdmin?.username || 'admin');
        
        if (updatedRide) {
            // Reload rides
            loadRides();
            
            // Update confirmation alert
            checkUnconfirmedRidesAdmin();
            
            alert('Pickup confirmed! Customer has been notified via email.');
        } else {
            alert('Unable to confirm pickup. Please try again.');
        }
    } catch (error) {
        console.error('Error confirming pickup:', error);
        alert(error.message || 'An error occurred while confirming the pickup. Please try again.');
    } finally {
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm Pickup';
        }
    }
}

// Admin ride action handlers
function adminAcceptRideHandler(rideId) {
    const ride = getRides().find(r => r.id === rideId);
    if (!ride) {
        alert('Ride not found');
        return;
    }
    
    if (ride.status !== 'pending') {
        alert('This ride cannot be accepted');
        return;
    }
    
    // Get first available driver (or admin can assign manually)
    const drivers = getDrivers();
    if (drivers.length === 0) {
        alert('No drivers available');
        return;
    }
    
    // For now, assign to first driver. Admin can manually assign later if needed
    const driver = drivers[0];
    
    if (!confirm(`Accept this ride and assign to ${driver.name}?\n\n${ride.pickup} → ${ride.destination}\nDate: ${ride.date}\nTime: ${ride.time}`)) {
        return;
    }
    
    const acceptBtn = document.getElementById(`admin-accept-${rideId}`) || document.getElementById(`admin-accept-calendar-${rideId}`);
    if (acceptBtn) {
        acceptBtn.disabled = true;
        acceptBtn.textContent = 'Accepting...';
    }
    
    try {
        const updatedRide = acceptRide(rideId, driver);
        if (updatedRide) {
            loadRides();
            alert('Ride accepted and assigned to driver!');
        } else {
            alert('Unable to accept ride. Please try again.');
        }
    } catch (error) {
        console.error('Error accepting ride:', error);
        // Display the validation error message
        alert(error.message || 'An error occurred while accepting the ride. Please try again.');
    } finally {
        if (acceptBtn) {
            acceptBtn.disabled = false;
            acceptBtn.textContent = 'Accept Ride';
        }
    }
}

function openAdminRescheduleModal(rideId) {
    const ride = getRides().find(r => r.id === rideId);
    if (!ride) {
        alert('Ride not found');
        return;
    }
    
    document.getElementById('adminRescheduleRideId').value = rideId;
    document.getElementById('adminRescheduleDate').value = ride.date;
    document.getElementById('adminRescheduleTime').value = ride.time;
    
    const modal = document.getElementById('adminRescheduleModal');
    modal.style.display = 'flex';
}

function closeAdminRescheduleModal() {
    const modal = document.getElementById('adminRescheduleModal');
    modal.style.display = 'none';
    document.getElementById('adminRescheduleForm').reset();
}

async function handleAdminReschedule(event) {
    event.preventDefault();
    
    const rideId = document.getElementById('adminRescheduleRideId').value;
    const newDate = document.getElementById('adminRescheduleDate').value;
    const newTime = document.getElementById('adminRescheduleTime').value;
    
    if (!rideId || !newDate || !newTime) {
        alert('Please fill in all fields');
        return;
    }
    
    const ride = getRides().find(r => r.id === rideId);
    if (!ride) {
        alert('Ride not found');
        return;
    }
    
    const submitBtn = event.target.querySelector('.modal-submit-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Rescheduling...';
    }
    
    try {
        // Use rescheduleRide function (admin can reschedule any ride)
        const updatedRide = rescheduleRide(rideId, newDate, newTime, 'admin');
        
        if (updatedRide) {
            // Recalculate pricing
            const newPricing = calculatePricing(updatedRide, ratesData);
            const rides = getRides();
            const rideIndex = rides.findIndex(r => r.id === rideId);
            if (rideIndex !== -1) {
                rides[rideIndex].recalculatedPrice = newPricing.totalPrice;
                rides[rideIndex].priceBreakdown = newPricing.breakdown;
                saveRides(rides);
            }
            
            closeAdminRescheduleModal();
            loadRides();
            alert('Ride rescheduled successfully! Pricing has been recalculated.');
        } else {
            alert('Unable to reschedule ride. Please try again.');
        }
    } catch (error) {
        console.error('Reschedule error:', error);
        alert('An error occurred while rescheduling. Please try again.');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reschedule & Notify';
        }
    }
}

function adminCancelRideHandler(rideId) {
    const ride = getRides().find(r => r.id === rideId);
    if (!ride) {
        alert('Ride not found');
        return;
    }
    
    if (ride.status === 'cancelled' || ride.status === 'cancelled_by_customer') {
        alert('This ride is already cancelled');
        return;
    }
    
    if (ride.status === 'completed') {
        alert('Cannot cancel a completed ride');
        return;
    }
    
    if (!confirm(`Cancel this ride?\n\n${ride.pickup} → ${ride.destination}\nDate: ${ride.date}\nTime: ${ride.time}\n\nThis action cannot be undone.`)) {
        return;
    }
    
    const cancelBtn = document.getElementById(`admin-cancel-${rideId}`) || document.getElementById(`admin-cancel-calendar-${rideId}`);
    if (cancelBtn) {
        cancelBtn.disabled = true;
        cancelBtn.textContent = 'Cancelling...';
    }
    
    try {
        const updatedRide = cancelRide(rideId);
        if (updatedRide) {
            loadRides();
            alert('Ride cancelled successfully!');
        } else {
            alert('Unable to cancel ride. Please try again.');
        }
    } catch (error) {
        console.error('Error cancelling ride:', error);
        alert('An error occurred while cancelling the ride. Please try again.');
    } finally {
        if (cancelBtn) {
            cancelBtn.disabled = false;
            cancelBtn.textContent = 'Cancel';
        }
    }
}

function adminDeleteRideHandler(rideId) {
    const ride = getRides().find(r => r.id === rideId);
    if (!ride) {
        alert('Ride not found');
        return;
    }
    
    if (!confirm(`Permanently delete this ride?\n\n${ride.pickup} → ${ride.destination}\nDate: ${ride.date}\nTime: ${ride.time}\n\nThis action cannot be undone!`)) {
        return;
    }
    
    const deleteBtn = document.getElementById(`admin-delete-${rideId}`) || document.getElementById(`admin-delete-calendar-${rideId}`);
    if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.textContent = 'Deleting...';
    }
    
    try {
        const deleted = deleteRide(rideId);
        if (deleted) {
            loadRides();
            alert('Ride deleted successfully!');
        } else {
            alert('Unable to delete ride. Please try again.');
        }
    } catch (error) {
        console.error('Error deleting ride:', error);
        alert('An error occurred while deleting the ride. Please try again.');
    } finally {
        if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.textContent = 'Delete';
        }
    }
}

// Load income analytics
function loadIncome() {
    const weeklyData = getWeeklyIncome();
    const monthlyData = getMonthlyIncome();
    
    // Calculate totals
    let weeklyTotal = 0;
    let monthlyTotal = 0;
    
    weeklyData.rides.forEach(ride => {
        const pricing = calculatePricing(ride, ratesData);
        weeklyTotal += pricing.totalPrice;
    });
    
    monthlyData.rides.forEach(ride => {
        const pricing = calculatePricing(ride, ratesData);
        monthlyTotal += pricing.totalPrice;
    });
    
    // Calculate commission for weekly and monthly periods
    const rides = getRides();
    const drivers = getDrivers();
    
    // Weekly commission - expected and confirmed
    let weeklyExpectedCommission = 0;
    let weeklyConfirmedCommission = 0;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    drivers.forEach(driver => {
        // Use driver's individual service fee, default to 15% if not set
        const serviceFeePercent = driver.serviceFee !== undefined ? driver.serviceFee : 15;
        const serviceFeeDecimal = serviceFeePercent / 100;
        
        const driverRides = rides.filter(r => 
            r.driverId === driver.username &&
            (r.status === 'accepted' || r.status === 'completed') &&
            r.acceptedAt &&
            new Date(r.acceptedAt) >= startOfWeek &&
            new Date(r.acceptedAt) <= endOfWeek
        );
        
        driverRides.forEach(ride => {
            let pricing;
            if (ride.recalculatedPrice && ride.priceBreakdown) {
                pricing = {
                    totalPrice: ride.recalculatedPrice,
                    breakdown: ride.priceBreakdown
                };
            } else {
                pricing = calculatePricing(ride, ratesData);
            }
            
            if (ride.status === 'accepted') {
                weeklyExpectedCommission += pricing.totalPrice * serviceFeeDecimal;
            } else if (ride.status === 'completed') {
                weeklyConfirmedCommission += pricing.totalPrice * serviceFeeDecimal;
            }
        });
    });
    
    const weeklyTotalCommission = weeklyExpectedCommission + weeklyConfirmedCommission;
    
    // Monthly commission - expected and confirmed
    let monthlyExpectedCommission = 0;
    let monthlyConfirmedCommission = 0;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    drivers.forEach(driver => {
        // Use driver's individual service fee, default to 15% if not set
        const serviceFeePercent = driver.serviceFee !== undefined ? driver.serviceFee : 15;
        const serviceFeeDecimal = serviceFeePercent / 100;
        
        const driverRides = rides.filter(r => 
            r.driverId === driver.username &&
            (r.status === 'accepted' || r.status === 'completed') &&
            r.acceptedAt &&
            new Date(r.acceptedAt) >= startOfMonth &&
            new Date(r.acceptedAt) <= endOfMonth
        );
        
        driverRides.forEach(ride => {
            let pricing;
            if (ride.recalculatedPrice && ride.priceBreakdown) {
                pricing = {
                    totalPrice: ride.recalculatedPrice,
                    breakdown: ride.priceBreakdown
                };
            } else {
                pricing = calculatePricing(ride, ratesData);
            }
            
            if (ride.status === 'accepted') {
                monthlyExpectedCommission += pricing.totalPrice * serviceFeeDecimal;
            } else if (ride.status === 'completed') {
                monthlyConfirmedCommission += pricing.totalPrice * serviceFeeDecimal;
            }
        });
    });
    
    const monthlyTotalCommission = monthlyExpectedCommission + monthlyConfirmedCommission;
    
    // All-time commission - expected and confirmed
    let allTimeExpectedCommission = 0;
    let allTimeConfirmedCommission = 0;
    
    drivers.forEach(driver => {
        // Use driver's individual service fee, default to 15% if not set
        const serviceFeePercent = driver.serviceFee !== undefined ? driver.serviceFee : 15;
        const serviceFeeDecimal = serviceFeePercent / 100;
        
        const driverRides = rides.filter(r => 
            r.driverId === driver.username &&
            (r.status === 'accepted' || r.status === 'completed')
        );
        
        driverRides.forEach(ride => {
            let pricing;
            if (ride.recalculatedPrice && ride.priceBreakdown) {
                pricing = {
                    totalPrice: ride.recalculatedPrice,
                    breakdown: ride.priceBreakdown
                };
            } else {
                pricing = calculatePricing(ride, ratesData);
            }
            
            if (ride.status === 'accepted') {
                allTimeExpectedCommission += pricing.totalPrice * serviceFeeDecimal;
            } else if (ride.status === 'completed') {
                allTimeConfirmedCommission += pricing.totalPrice * serviceFeeDecimal;
            }
        });
    });
    
    const allTimeTotalCommission = allTimeExpectedCommission + allTimeConfirmedCommission;
    
    // Calculate all-time total commission
    const totalCommission = calculateTotalCommission();
    
    const incomeAnalytics = document.getElementById('incomeAnalytics');
    incomeAnalytics.innerHTML = `
        <div class="income-period">
            <h3>This Week (${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })})</h3>
            <div class="income-breakdown">
                <div class="income-item">
                    <div class="income-item-label">Total Income</div>
                    <div class="income-item-value">${formatPrice(weeklyTotal)}</div>
                </div>
                <div class="income-item">
                    <div class="income-item-label">Rides Completed</div>
                    <div class="income-item-value">${weeklyData.count}</div>
                </div>
                <div class="income-item">
                    <div class="income-item-label">Average per Ride</div>
                    <div class="income-item-value">${weeklyData.count > 0 ? formatPrice(weeklyTotal / weeklyData.count) : '$0.00'}</div>
                </div>
                <div class="income-item" style="background: #fff3cd; border: 2px solid #ffc107;">
                    <div class="income-item-label" style="color: #856404; font-weight: 700;">Expected Service Fee</div>
                    <div class="income-item-value" style="color: #856404; font-size: 1.3rem;">${formatPrice(weeklyExpectedCommission)}</div>
                </div>
                <div class="income-item" style="background: #d4edda; border: 2px solid #28a745;">
                    <div class="income-item-label" style="color: #155724; font-weight: 700;">Confirmed Service Fee</div>
                    <div class="income-item-value" style="color: #155724; font-size: 1.3rem;">${formatPrice(weeklyConfirmedCommission)}</div>
                </div>
            </div>
        </div>
        <div class="income-period">
            <h3>This Month (${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})</h3>
            <div class="income-breakdown">
                <div class="income-item">
                    <div class="income-item-label">Total Income</div>
                    <div class="income-item-value">${formatPrice(monthlyTotal)}</div>
                </div>
                <div class="income-item">
                    <div class="income-item-label">Rides Completed</div>
                    <div class="income-item-value">${monthlyData.count}</div>
                </div>
                <div class="income-item">
                    <div class="income-item-label">Average per Ride</div>
                    <div class="income-item-value">${monthlyData.count > 0 ? formatPrice(monthlyTotal / monthlyData.count) : '$0.00'}</div>
                </div>
                <div class="income-item" style="background: #fff3cd; border: 2px solid #ffc107;">
                    <div class="income-item-label" style="color: #856404; font-weight: 700;">Expected Service Fee</div>
                    <div class="income-item-value" style="color: #856404; font-size: 1.3rem;">${formatPrice(monthlyExpectedCommission)}</div>
                </div>
                <div class="income-item" style="background: #d4edda; border: 2px solid #28a745;">
                    <div class="income-item-label" style="color: #155724; font-weight: 700;">Confirmed Service Fee</div>
                    <div class="income-item-value" style="color: #155724; font-size: 1.3rem;">${formatPrice(monthlyConfirmedCommission)}</div>
                </div>
            </div>
        </div>
        <div class="income-period" style="margin-top: 2rem; padding-top: 2rem; border-top: 3px solid var(--primary-color);">
            <h3 style="color: var(--primary-color);">All-Time Service Fee</h3>
            <div class="income-breakdown">
                <div class="income-item" style="background: #fff3cd; border: 3px solid #ffc107; padding: 1.5rem;">
                    <div class="income-item-label" style="color: #856404; font-weight: 700; font-size: 1.1rem;">Expected Service Fee from All Drivers</div>
                    <div class="income-item-value" style="color: #856404; font-size: 2rem; font-weight: 700;">${formatPrice(allTimeExpectedCommission)}</div>
                </div>
                <div class="income-item" style="background: #d4edda; border: 3px solid #28a745; padding: 1.5rem;">
                    <div class="income-item-label" style="color: #155724; font-weight: 700; font-size: 1.1rem;">Confirmed Service Fee from All Drivers</div>
                    <div class="income-item-value" style="color: #155724; font-size: 2rem; font-weight: 700;">${formatPrice(allTimeConfirmedCommission)}</div>
                </div>
            </div>
        </div>
    `;
}

// Load archive
function loadArchive() {
    const archive = getArchivedRides();
    const container = document.getElementById('archiveContent');
    
    if (archive.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No Archived Rides</h3>
                <p>Completed rides from previous months will appear here after archiving.</p>
            </div>
        `;
        return;
    }
    
    // Group by month
    container.innerHTML = archive.map(monthData => {
        const driversHtml = monthData.drivers.map(driver => {
            let driverTotal = 0;
            // Get driver's service fee from drivers list
            const drivers = getDrivers();
            const driverInfo = drivers.find(d => d.username === driver.driverId || d.name === driver.driverName);
            const serviceFeePercent = driverInfo && driverInfo.serviceFee !== undefined ? driverInfo.serviceFee : 15;
            const serviceFeeDecimal = serviceFeePercent / 100;
            
            const ridesHtml = driver.rides.map(ride => {
                let pricing;
                if (ride.recalculatedPrice && ride.priceBreakdown) {
                    pricing = {
                        totalPrice: ride.recalculatedPrice,
                        breakdown: ride.priceBreakdown
                    };
                } else {
                    pricing = calculatePricing(ride, ratesData);
                }
                driverTotal += pricing.totalPrice;
                
                // Parse date using local time components to avoid timezone issues
        const dateParts = ride.date.split('-');
        const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                });
                const time = formatTime(ride.time);
                const completedDate = ride.completedAt ? new Date(ride.completedAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                }) : 'N/A';
                
                return `
                    <tr style="border-bottom: 1px solid var(--light-bg);">
                        <td style="padding: 0.75rem;">${date}</td>
                        <td style="padding: 0.75rem;">${time}</td>
                        <td style="padding: 0.75rem;">${ride.pickup} → ${ride.destination}</td>
                        <td style="padding: 0.75rem;">
                            <div>${ride.name}</div>
                            <div style="font-size: 0.85rem; color: #666;">${ride.email}</div>
                            <div style="font-size: 0.85rem; color: #666;">${ride.phone}</div>
                        </td>
                        <td style="padding: 0.75rem; text-align: center;">${ride.passengers}</td>
                        <td style="padding: 0.75rem; text-align: right; font-weight: 600; color: var(--accent-color);">${formatPrice(pricing.totalPrice)}</td>
                        <td style="padding: 0.75rem; font-size: 0.9rem; color: #666;">${completedDate}</td>
                    </tr>
                `;
            }).join('');
            
            const serviceFee = driverTotal * serviceFeeDecimal;
            
            return `
                <div style="margin-bottom: 2rem; background: var(--white); padding: 1.5rem; border-radius: 10px; box-shadow: var(--shadow);">
                    <h4 style="color: var(--primary-color); margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--light-bg);">
                        ${driver.driverName}
                        <span style="font-size: 0.9rem; font-weight: normal; color: #666; margin-left: 1rem;">
                            (${driver.rides.length} ride${driver.rides.length !== 1 ? 's' : ''})
                        </span>
                    </h4>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: var(--light-bg);">
                                    <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--primary-color); color: var(--primary-color);">Date</th>
                                    <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--primary-color); color: var(--primary-color);">Time</th>
                                    <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--primary-color); color: var(--primary-color);">Route</th>
                                    <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--primary-color); color: var(--primary-color);">Customer</th>
                                    <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid var(--primary-color); color: var(--primary-color);">Passengers</th>
                                    <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid var(--primary-color); color: var(--primary-color);">Amount</th>
                                    <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--primary-color); color: var(--primary-color);">Completed</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${ridesHtml}
                            </tbody>
                            <tfoot>
                                <tr style="background: var(--light-bg); font-weight: 700;">
                                    <td colspan="5" style="padding: 0.75rem; text-align: right; color: var(--primary-color);">Total Income:</td>
                                    <td style="padding: 0.75rem; text-align: right; color: var(--accent-color);">${formatPrice(driverTotal)}</td>
                                    <td></td>
                                </tr>
                                <tr style="background: #fff3cd; font-weight: 700;">
                                    <td colspan="5" style="padding: 0.75rem; text-align: right; color: #856404;">Service Fee (15%):</td>
                                    <td style="padding: 0.75rem; text-align: right; color: #856404;">${formatPrice(serviceFee)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div style="margin-bottom: 3rem; background: var(--light-bg); padding: 2rem; border-radius: 10px; box-shadow: var(--shadow);">
                <h3 style="color: var(--primary-color); margin-bottom: 1.5rem; font-size: 1.5rem; padding-bottom: 0.5rem; border-bottom: 3px solid var(--primary-color);">
                    ${monthData.month}
                </h3>
                ${driversHtml}
            </div>
        `;
    }).join('');
}

// Load days off (all drivers)
function loadDaysOff() {
    const daysOff = getDaysOff();
    
    // Load admin days off
    const adminDaysOffList = document.getElementById('adminDaysOffList');
    if (adminDaysOffList && currentAdmin) {
        const adminDaysOff = daysOff.filter(d => d.driverId === currentAdmin.username || d.driverId === 'admin');
        if (adminDaysOff.length === 0) {
            adminDaysOffList.innerHTML = '<p style="color: #666; text-align: center;">No days off scheduled</p>';
        } else {
            adminDaysOffList.innerHTML = adminDaysOff.map(dayOff => {
                // Parse date string directly to avoid timezone issues
                const dateParts = dayOff.date.split('-');
                const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                const formattedDate = date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
                return `
                    <div class="day-off-item" style="background: var(--white); padding: 1rem; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; box-shadow: var(--shadow);">
                        <span style="font-weight: 600; color: var(--primary-color);">${formattedDate}</span>
                        <button onclick="removeAdminDayOffHandler('${dayOff.id}')" style="padding: 0.5rem 1rem; background: var(--error-color); color: var(--white); border: none; border-radius: 5px; cursor: pointer; font-size: 0.85rem;">Remove</button>
                    </div>
                `;
            }).join('');
        }
    }
    
    // Load all drivers' days off (excluding admin)
    const allDriversDaysOffList = document.getElementById('allDriversDaysOff');
    if (allDriversDaysOffList) {
        const driverDaysOff = daysOff.filter(d => d.driverId !== 'admin' && d.driverId !== currentAdmin?.username);
        if (driverDaysOff.length === 0) {
            allDriversDaysOffList.innerHTML = '<p style="color: #666; text-align: center;">No drivers have scheduled days off</p>';
        } else {
            // Group by date
            const groupedByDate = {};
            driverDaysOff.forEach(dayOff => {
                if (!groupedByDate[dayOff.date]) {
                    groupedByDate[dayOff.date] = [];
                }
                groupedByDate[dayOff.date].push(dayOff);
            });
            
            const sortedDates = Object.keys(groupedByDate).sort();
            allDriversDaysOffList.innerHTML = sortedDates.map(date => {
                // Parse date string directly to avoid timezone issues
                const dateParts = date.split('-');
                const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                const formattedDate = dateObj.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
                const drivers = groupedByDate[date].map(d => d.driverName).join(', ');
                return `
                    <div class="day-off-item">
                        <div>
                            <span style="font-weight: 600; color: var(--primary-color); display: block;">${formattedDate}</span>
                            <span style="font-size: 0.9rem; color: #666;">${drivers}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

// Add admin day off handler
function addAdminDayOff() {
    const dateInput = document.getElementById('adminDayOffDate');
    if (!dateInput) {
        alert('Date input not found');
        return;
    }
    
    const date = dateInput.value;
    
    if (!date) {
        alert('Please select a date');
        return;
    }
    
    if (!currentAdmin) {
        alert('Admin not found');
        return;
    }
    
    try {
        addDayOff(currentAdmin.username, date);
        dateInput.value = '';
        loadDaysOff();
        alert('Day off added successfully!');
    } catch (error) {
        console.error('Error adding day off:', error);
        alert('Error adding day off. Please try again.');
    }
}

// Remove admin day off handler
function removeAdminDayOffHandler(dayOffId) {
    if (confirm('Remove this day off?')) {
        try {
            removeDayOff(dayOffId);
            loadDaysOff();
            alert('Day off removed successfully!');
        } catch (error) {
            console.error('Error removing day off:', error);
            alert('Error removing day off. Please try again.');
        }
    }
}

// Notification filter state
let currentNotificationFilter = 'all';

function switchNotificationFilter(filter) {
    currentNotificationFilter = filter;
    
    // Update filter buttons
    document.querySelectorAll('#notificationsView .view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const filterBtnMap = {
        'all': 'btn-all-notifications',
        'new_ride': 'btn-new-ride-notifications',
        'ride_accepted': 'btn-accepted-notifications',
        'ride_rescheduled': 'btn-rescheduled-notifications',
        'ride_cancelled': 'btn-cancelled-notifications',
        'ride_completed': 'btn-completed-notifications',
        'review_pending': 'btn-review-notifications'
    };
    if (filterBtnMap[filter]) {
        document.getElementById(filterBtnMap[filter]).classList.add('active');
    }
    
    loadAdminNotifications();
}

// Load admin notifications
function loadAdminNotifications() {
    const notifications = getAdminNotifications();
    const container = document.getElementById('adminNotificationsList');
    
    if (!container) return;
    
    // Filter notifications based on current filter
    let filteredNotifications = notifications;
    if (currentNotificationFilter !== 'all') {
        filteredNotifications = notifications.filter(n => n.type === currentNotificationFilter);
    }
    
    // Sort by date (newest first)
    filteredNotifications.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    if (filteredNotifications.length === 0) {
        const filterLabel = currentNotificationFilter === 'all' ? '' : getNotificationTypeLabel(currentNotificationFilter);
        container.innerHTML = `<p style="color: #666; text-align: center; padding: 3rem;">No ${filterLabel} notifications found.</p>`;
    } else {
        container.innerHTML = filteredNotifications.map(notification => {
            const date = new Date(notification.createdAt);
            const formattedDate = formatDateTime(date);
            
            const unreadClass = notification.read ? 'read' : 'unread';
            let icon = '📋';
            let titleColor = 'var(--primary-color)';
            if (notification.type === 'ride_accepted') {
                icon = '✅';
            } else if (notification.type === 'ride_cancelled') {
                icon = '❌';
            } else if (notification.type === 'new_ride') {
                icon = '🚗';
            } else if (notification.type === 'ride_rescheduled') {
                icon = '🔄';
                titleColor = '#ff9800'; // Orange color to distinguish rescheduled rides
            } else if (notification.type === 'ride_completed') {
                icon = '✓';
            } else if (notification.type === 'review_pending') {
                icon = '⭐';
            }
            
            // Ensure title is correct - if type is ride_rescheduled, force title to be "Ride Rescheduled"
            let displayTitle = notification.title;
            if (notification.type === 'ride_rescheduled' && notification.title !== 'Ride Rescheduled') {
                displayTitle = 'Ride Rescheduled';
            }
            
            return `
                <div class="notification-item ${unreadClass}" onclick="markAdminNotificationReadHandler('${notification.id}')">
                    <div class="notification-header">
                        <div>
                            <span style="font-size: 1.2rem; margin-right: 0.5rem;">${icon}</span>
                            <span class="notification-title" style="color: ${titleColor};">${displayTitle}</span>
                        </div>
                        <span class="notification-time">${formattedDate}</span>
                    </div>
                    <div class="notification-body">${notification.message}</div>
                </div>
            `;
        }).join('');
    }
    
    updateAdminNotificationBadge();
}

// Helper function to get notification type label
function getNotificationTypeLabel(type) {
    const labels = {
        'new_ride': 'new ride',
        'ride_accepted': 'ride accepted',
        'ride_rescheduled': 'rescheduled',
        'ride_cancelled': 'cancelled',
        'ride_completed': 'completed',
        'review_pending': 'review'
    };
    return labels[type] || type;
}

// Update admin notification badge
function updateAdminNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        const unreadCount = getUnreadAdminNotificationCount();
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Mark admin notification as read handler
function markAdminNotificationReadHandler(notificationId) {
    markAdminNotificationRead(notificationId);
    loadAdminNotifications();
}

// Mark all admin notifications as read
function markAllAdminNotificationsReadHandler() {
    markAllAdminNotificationsRead();
    loadAdminNotifications();
}

// Review management
let currentReviewFilter = 'pending';

function switchReviewFilter(filter) {
    currentReviewFilter = filter;
    
    // Update filter buttons
    document.querySelectorAll('#reviewsView .view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const filterBtnMap = {
        'pending': 'btn-pending-reviews',
        'approved': 'btn-approved-reviews',
        'all': 'btn-all-reviews'
    };
    if (filterBtnMap[filter]) {
        document.getElementById(filterBtnMap[filter]).classList.add('active');
    }
    
    loadReviews();
}

// Survey filter variables
let surveyFilters = {
    startDate: null,
    endDate: null,
    sort: 'newest'
};

// Apply survey filters
function applySurveyFilters() {
    const startDate = document.getElementById('surveyStartDate').value;
    const endDate = document.getElementById('surveyEndDate').value;
    const sort = document.getElementById('surveySort').value;
    
    surveyFilters.startDate = startDate || null;
    surveyFilters.endDate = endDate || null;
    surveyFilters.sort = sort;
    
    loadSurveys();
}

// Clear survey filters
function clearSurveyFilters() {
    document.getElementById('surveyStartDate').value = '';
    document.getElementById('surveyEndDate').value = '';
    document.getElementById('surveySort').value = 'newest';
    
    surveyFilters = {
        startDate: null,
        endDate: null,
        sort: 'newest'
    };
    
    loadSurveys();
}

// Load surveys for admin
async function loadSurveys() {
    const container = document.getElementById('surveysList');
    if (!container) return;
    
    // Check if API is available - try both API and window.API
    const apiObj = typeof API !== 'undefined' ? API : (typeof window !== 'undefined' && window.API ? window.API : undefined);
    
    if (!apiObj || !apiObj.surveys) {
        // Wait a moment and try again (in case script is still loading)
        setTimeout(() => {
            const retryApi = typeof API !== 'undefined' ? API : (typeof window !== 'undefined' && window.API ? window.API : undefined);
            if (retryApi && retryApi.surveys) {
                loadSurveys(); // Retry
            } else {
                container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #dc3545;">Error: API client not loaded. Please check the browser console (F12) for errors and refresh the page.<br><br>Make sure api-client.js is loading correctly.</div>';
                console.error('API object not found. Make sure api-client.js is loaded before admin-dashboard.js');
                console.log('typeof API:', typeof API);
                console.log('typeof window.API:', typeof window !== 'undefined' ? typeof window.API : 'window not available');
                console.log('window.API:', typeof window !== 'undefined' ? window.API : 'window not available');
                console.log('Available window objects with "api":', typeof window !== 'undefined' ? Object.keys(window).filter(k => k.toLowerCase().includes('api')) : []);
            }
        }, 200);
        return;
    }
    
    container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">Loading surveys...</div>';
    
    try {
        const params = {};
        if (surveyFilters.startDate) {
            params.startDate = surveyFilters.startDate;
        }
        if (surveyFilters.endDate) {
            params.endDate = surveyFilters.endDate;
        }
        if (surveyFilters.sort) {
            params.sort = surveyFilters.sort;
        }
        
        const apiObj = typeof API !== 'undefined' ? API : window.API;
        const response = await apiObj.surveys.getAll(params);
        const surveys = response.surveys || [];
        
        if (surveys.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">No surveys found.</div>';
            return;
        }
        
        container.innerHTML = surveys.map(survey => {
            const completedDate = survey.completedAt ? formatDateTime(survey.completedAt) : 'Not completed';
            
            const createdDate = new Date(survey.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            // Calculate average rating
            const avgRating = survey.completed ? (
                (survey.rating + survey.overallSatisfaction + survey.driverRating + survey.vehicleRating + survey.punctuality) / 5
            ).toFixed(1) : 'N/A';
            
            // Star rating display
            const starRating = survey.completed ? '⭐'.repeat(Math.round(parseFloat(avgRating))) : '';
            
            return `
                <div class="notification-card" style="margin-bottom: 1rem; padding: 1.5rem; background: var(--white); border-radius: 10px; box-shadow: var(--shadow);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <h3 style="color: var(--primary-color); margin: 0 0 0.5rem 0; font-size: 1.1rem;">
                                ${survey.customerName} ${survey.completed ? '' : '<span style="color: #ff6b6b; font-size: 0.9rem;">(Not Completed)</span>'}
                            </h3>
                            <p style="color: #666; margin: 0; font-size: 0.9rem;">
                                ${survey.driverName ? `Driver: ${survey.driverName}` : 'No driver assigned'} | Created: ${createdDate}
                            </p>
                        </div>
                        <div style="text-align: right;">
                            ${survey.completed ? `
                                <div style="font-size: 1.2rem; color: #ffc107; margin-bottom: 0.25rem;">${starRating}</div>
                                <div style="color: #666; font-size: 0.9rem;">Avg: ${avgRating}/5</div>
                            ` : '<span style="color: #999; font-size: 0.9rem;">Pending</span>'}
                        </div>
                    </div>
                    ${survey.completed ? `
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 5px;">
                            <div>
                                <strong style="color: #666; font-size: 0.85rem;">Overall Rating:</strong>
                                <div style="color: var(--primary-color); font-size: 1.1rem; font-weight: bold;">${survey.rating}/5</div>
                            </div>
                            <div>
                                <strong style="color: #666; font-size: 0.85rem;">Satisfaction:</strong>
                                <div style="color: var(--primary-color); font-size: 1.1rem; font-weight: bold;">${survey.overallSatisfaction}/5</div>
                            </div>
                            <div>
                                <strong style="color: #666; font-size: 0.85rem;">Driver:</strong>
                                <div style="color: var(--primary-color); font-size: 1.1rem; font-weight: bold;">${survey.driverRating}/5</div>
                            </div>
                            <div>
                                <strong style="color: #666; font-size: 0.85rem;">Vehicle:</strong>
                                <div style="color: var(--primary-color); font-size: 1.1rem; font-weight: bold;">${survey.vehicleRating}/5</div>
                            </div>
                            <div>
                                <strong style="color: #666; font-size: 0.85rem;">Punctuality:</strong>
                                <div style="color: var(--primary-color); font-size: 1.1rem; font-weight: bold;">${survey.punctuality}/5</div>
                            </div>
                        </div>
                        ${survey.comments ? `
                            <div style="margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 5px; border-left: 4px solid var(--primary-color);">
                                <strong style="color: #666; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Comments:</strong>
                                <p style="color: #2c2c2c; margin: 0; line-height: 1.6;">${survey.comments}</p>
                            </div>
                        ` : ''}
                        <div style="display: flex; gap: 1rem; align-items: center; font-size: 0.9rem; color: #666;">
                            <span>${survey.wouldRecommend ? '✅ Would recommend' : '❌ Would not recommend'}</span>
                            <span>•</span>
                            <span>Completed: ${completedDate}</span>
                        </div>
                    ` : `
                        <div style="padding: 1rem; background: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
                            <p style="margin: 0; color: #856404;">Survey sent but not yet completed by customer.</p>
                        </div>
                    `}
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading surveys:', error);
        container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #dc3545;">Error loading surveys: ${error.message}</div>`;
    }
}

// Load reviews for admin
function loadReviews() {
    const reviews = getReviews();
    const container = document.getElementById('reviewsList');
    
    if (!container) return;
    
    // Filter reviews based on current filter
    let filteredReviews = reviews;
    if (currentReviewFilter === 'pending') {
        filteredReviews = reviews.filter(r => r.status === 'pending');
    } else if (currentReviewFilter === 'approved') {
        filteredReviews = reviews.filter(r => r.status === 'approved');
    }
    
    // Sort by date (newest first)
    filteredReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (filteredReviews.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #666;">
                <p>No ${currentReviewFilter === 'all' ? '' : currentReviewFilter} reviews found.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredReviews.map(review => {
        const date = new Date(review.createdAt);
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
        
        // Ensure rating is a valid number (handle both string and number)
        const ratingNum = typeof review.rating === 'number' ? review.rating : parseInt(review.rating) || 0;
        const validRating = Math.max(1, Math.min(5, ratingNum)); // Clamp between 1-5
        console.log('Admin display - Review ID:', review.id, 'Raw rating:', review.rating, 'Parsed:', ratingNum, 'Valid:', validRating);
        const stars = '⭐'.repeat(validRating);
        const statusBadge = review.status === 'pending' 
            ? '<span class="ride-status pending" style="font-size: 0.75rem; padding: 0.2rem 0.5rem;">Pending</span>'
            : review.status === 'approved'
            ? '<span class="ride-status accepted" style="font-size: 0.75rem; padding: 0.2rem 0.5rem;">Approved</span>'
            : '<span style="background: #f8d7da; color: #721c24; padding: 0.2rem 0.5rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">Rejected</span>';
        
        let actionButtons = '';
        if (review.status === 'pending') {
            actionButtons = `
                <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                    <button class="accept-btn" onclick="approveReviewHandler('${review.id}')" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem;">Approve</button>
                    <button class="give-up-btn" onclick="rejectReviewHandler('${review.id}')" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem;">Reject</button>
                </div>
            `;
        } else if (review.status === 'approved') {
            const approvedDate = review.approvedAt ? new Date(review.approvedAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            }) : 'N/A';
            actionButtons = `
                <div style="background: #d4edda; padding: 0.75rem; border-radius: 5px; margin-top: 1rem; border: 2px solid #28a745;">
                    <div style="color: #155724; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem;">
                        ✓ Live on Home Page • Approved: ${approvedDate}
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="give-up-btn" onclick="deleteReviewHandler('${review.id}')" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; background: #dc3545;">Remove from Home Page</button>
                    </div>
                </div>
            `;
        } else {
            actionButtons = `
                <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                    <button class="accept-btn" onclick="approveReviewHandler('${review.id}')" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem;">Approve</button>
                    <button class="give-up-btn" onclick="deleteReviewHandler('${review.id}')" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem;">Delete</button>
                </div>
            `;
        }
        
        return `
            <div class="notification-item" style="background: var(--white); padding: 1.5rem; border-radius: 10px; box-shadow: var(--shadow); margin-bottom: 1rem;">
                <div class="notification-header">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                            <span class="notification-title" style="font-size: 1.2rem;">${review.name}</span>
                            ${statusBadge}
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <span class="review-rating" title="${validRating} out of 5 stars">${stars}</span>
                            <span style="color: #666; font-size: 0.9rem; font-weight: 600;">(${validRating}/5)</span>
                            <span style="color: #999; font-size: 0.85rem;">${formattedDate}</span>
                        </div>
                        <div style="color: #666; font-size: 0.9rem; margin-bottom: 0.5rem;">Email: ${review.email}</div>
                    </div>
                </div>
                <div class="notification-body" style="background: var(--light-bg); padding: 1rem; border-radius: 5px; margin-top: 1rem;">
                    ${review.comment}
                </div>
                ${actionButtons}
            </div>
        `;
    }).join('');
    
    updateReviewsBadge();
}

// Update reviews badge
function updateReviewsBadge() {
    const badge = document.getElementById('reviewsBadge');
    if (badge) {
        const pendingCount = getPendingReviews().length;
        if (pendingCount > 0) {
            badge.textContent = pendingCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Approve review handler
function approveReviewHandler(reviewId) {
    if (!currentAdmin) {
        alert('Admin not found');
        return;
    }
    
    if (confirm('Approve this review? It will be published on the home page.')) {
        const approved = approveReview(reviewId, currentAdmin.username);
        if (approved) {
            alert('Review approved successfully!');
            loadReviews();
            updateReviewsBadge();
        } else {
            alert('Error approving review. Please try again.');
        }
    }
}

// Reject review handler
function rejectReviewHandler(reviewId) {
    if (!currentAdmin) {
        alert('Admin not found');
        return;
    }
    
    if (confirm('Reject this review? It will not be published.')) {
        const rejected = rejectReview(reviewId, currentAdmin.username);
        if (rejected) {
            alert('Review rejected.');
            loadReviews();
            updateReviewsBadge();
        } else {
            alert('Error rejecting review. Please try again.');
        }
    }
}

// Delete review handler
function deleteReviewHandler(reviewId) {
    const review = getReviews().find(r => r.id === reviewId);
    const isApproved = review && review.status === 'approved';
    const message = isApproved 
        ? 'Remove this review from the home page? This will permanently delete the review.'
        : 'Delete this review permanently? This action cannot be undone.';
    
    if (confirm(message)) {
        const deleted = deleteReview(reviewId);
        if (deleted) {
            alert(isApproved 
                ? 'Review removed from home page successfully.' 
                : 'Review deleted successfully.');
            loadReviews();
            updateReviewsBadge();
        } else {
            alert('Error deleting review. Please try again.');
        }
    }
}

// Load on page load
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Set admin name after DOM is loaded - do this FIRST to clear "Loading..."
        const adminNameEl = document.getElementById('adminName');
        if (adminNameEl) {
            if (currentAdmin && currentAdmin.name) {
                adminNameEl.textContent = currentAdmin.name;
            } else {
                adminNameEl.textContent = 'Administrator';
            }
        }
        
        // Handle admin settings form
        try {
            const adminSettingsForm = document.getElementById('adminSettingsForm');
            if (adminSettingsForm) {
                adminSettingsForm.addEventListener('submit', handleAdminSettingsSubmit);
            }
        } catch (error) {
            console.error('Error setting up admin settings form:', error);
        }
        
        // Set minimum date for admin day off input
        try {
            const adminDayOffDateInput = document.getElementById('adminDayOffDate');
            if (adminDayOffDateInput) {
                const today = new Date().toISOString().split('T')[0];
                adminDayOffDateInput.setAttribute('min', today);
            }
        } catch (error) {
            console.error('Error setting date input:', error);
        }
        
        // Load overview with error handling
        try {
            loadOverview();
        } catch (error) {
            console.error('Error in loadOverview:', error);
        }
        
        try {
            updateAdminNotificationBadge();
        } catch (error) {
            console.error('Error updating notification badge:', error);
        }
        
        try {
            updateReviewsBadge();
        } catch (error) {
            console.error('Error updating reviews badge:', error);
        }
        
        // Check for unconfirmed rides on load
        try {
            checkUnconfirmedRidesAdmin();
        } catch (error) {
            console.error('Error checking unconfirmed rides:', error);
        }
    } catch (error) {
        console.error('Critical error in DOMContentLoaded:', error);
        // Ensure admin name is set even if everything else fails
        const adminNameEl = document.getElementById('adminName');
        if (adminNameEl) {
            adminNameEl.textContent = currentAdmin?.name || 'Administrator';
        }
    }
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
        if (currentView === 'overview') {
            loadOverview();
        } else if (currentView === 'rides' || currentView === 'calendar') {
            loadRides();
        } else if (currentView === 'drivers') {
            loadDrivers();
        } else if (currentView === 'income') {
            loadIncome();
        } else if (currentView === 'days-off') {
            loadDaysOff();
        } else if (currentView === 'reviews') {
            loadReviews();
        } else if (currentView === 'notifications') {
            loadAdminNotifications();
        } else if (currentView === 'announcements') {
            loadAnnouncements();
        }
        updateAdminNotificationBadge();
        updateReviewsBadge();
        checkUnconfirmedRidesAdmin();
    }, 30000);
});

// Invite Management Functions
function loadInvites() {
    const invites = getInvites();
    const container = document.getElementById('invitesList');
    
    if (!container) return;
    
    // Sort by creation date (newest first)
    const sorted = [...invites].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (sorted.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No invite links created yet. Create your first invite link!</p>';
        return;
    }
    
    const baseUrl = window.location.origin + window.location.pathname.replace('admin-dashboard.html', '');
    
    container.innerHTML = sorted.map(invite => {
        const createdDate = new Date(invite.createdAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
        
        const usedDate = invite.usedAt ? new Date(invite.usedAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        }) : null;
        
        const inviteUrl = `${baseUrl}driver-register.html?code=${invite.code}`;
        const statusBadge = invite.used 
            ? '<span style="background: #6c757d; color: white; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.85rem; margin-left: 1rem;">Used</span>'
            : '<span style="background: #28a745; color: white; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.85rem; margin-left: 1rem;">Active</span>';
        
        return `
            <div style="background: var(--light-bg); padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; border-left: 4px solid ${invite.used ? '#6c757d' : '#28a745'};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div style="flex: 1;">
                        <h3 style="color: var(--primary-color); margin: 0 0 0.5rem 0; font-size: 1.3rem;">${invite.code}${statusBadge}</h3>
                        <p style="color: #666; margin: 0.25rem 0; font-size: 0.9rem;"><strong>Created:</strong> ${createdDate}</p>
                        ${invite.used ? `<p style="color: #666; margin: 0.25rem 0; font-size: 0.9rem;"><strong>Used by:</strong> ${invite.usedBy || 'Unknown'}</p><p style="color: #666; margin: 0.25rem 0; font-size: 0.9rem;"><strong>Used on:</strong> ${usedDate}</p>` : ''}
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-direction: column;">
                        ${!invite.used ? `<button onclick="copyInviteLink('${inviteUrl}')" style="padding: 0.5rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.9rem;">Copy Link</button>` : ''}
                        <button onclick="deleteInviteHandler('${invite.id}')" style="padding: 0.5rem 1rem; background: var(--error-color); color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.9rem;">Delete</button>
                    </div>
                </div>
                ${!invite.used ? `
                    <div style="background: white; padding: 1rem; border-radius: 5px; margin-top: 1rem;">
                        <p style="color: #666; margin: 0 0 0.5rem 0; font-size: 0.85rem; font-weight: 600;">Invite Link:</p>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <input type="text" value="${inviteUrl}" readonly style="flex: 1; padding: 0.5rem; border: 2px solid #e0e0e0; border-radius: 5px; font-size: 0.9rem; font-family: monospace; background: #f8f8f8;">
                            <button onclick="copyInviteLink('${inviteUrl}')" style="padding: 0.5rem 1rem; background: var(--accent-color); color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.9rem; white-space: nowrap;">Copy</button>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function createNewInvite() {
    const admin = getCurrentAdmin();
    const invite = createInviteLink(admin?.username || 'admin');
    loadInvites();
    
    // Show success message
    const container = document.getElementById('invitesList');
    if (container) {
        const successMsg = document.createElement('div');
        successMsg.style.cssText = 'background: #d4edda; color: #155724; padding: 1rem; border-radius: 5px; margin-bottom: 1rem; border: 1px solid #c3e6cb;';
        successMsg.textContent = `Invite link created successfully! Code: ${invite.code}`;
        container.insertBefore(successMsg, container.firstChild);
        setTimeout(() => successMsg.remove(), 5000);
    }
}

function copyInviteLink(url) {
    navigator.clipboard.writeText(url).then(() => {
        alert('Invite link copied to clipboard!');
    }).catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Invite link copied to clipboard!');
    });
}

function deleteInviteHandler(inviteId) {
    if (confirm('Are you sure you want to delete this invite link? This action cannot be undone.')) {
        const deleted = deleteInvite(inviteId);
        if (deleted) {
            loadInvites();
            alert('Invite link deleted successfully.');
        } else {
            alert('Error deleting invite link. Please try again.');
        }
    }
}

// Messages Management Functions
let currentChatWith = null;

async function loadMessages() {
    if (!currentAdmin) return;
    
    const conversationsList = document.getElementById('conversationsList');
    if (!conversationsList) return;
    
    // Use API to get conversations
    let conversations = [];
    if (typeof API !== 'undefined' && API.messages) {
        try {
            conversations = await API.messages.getConversations();
        } catch (error) {
            console.error('Error loading conversations:', error);
            conversations = [];
        }
    } else {
        // Fallback to local storage if API not available
        conversations = getUserConversations(currentAdmin.username);
    }
    
    if (conversations.length === 0) {
        conversationsList.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">No drivers available.</p>';
        document.getElementById('chatMessages').innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">Select a conversation to start messaging</p>';
        return;
    }
    
    conversationsList.innerHTML = conversations.map(conv => {
        const hasMessages = conv.lastMessage !== null;
        const lastMsgDate = hasMessages ? new Date(conv.lastMessage.timestamp) : null;
        const timeStr = lastMsgDate ? formatTime(lastMsgDate) : '';
        const dateStr = lastMsgDate ? lastMsgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
        const isToday = lastMsgDate ? new Date().toDateString() === lastMsgDate.toDateString() : false;
        
        const unreadBadge = conv.unreadCount > 0 
            ? `<span style="background: var(--error-color); color: white; border-radius: 50%; padding: 0.2rem 0.5rem; font-size: 0.75rem; margin-left: auto;">${conv.unreadCount}</span>`
            : '';
        
        return `
            <div class="conversation-item" onclick="openConversation('${conv.username}', '${conv.name}')" style="padding: 1rem; background: ${currentChatWith === conv.username ? '#e7f3ff' : 'var(--white)'}; border: 2px solid ${currentChatWith === conv.username ? 'var(--primary-color)' : '#e0e0e0'}; border-radius: 5px; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1.1rem;">
                    ${conv.name.charAt(0).toUpperCase()}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; color: var(--primary-color); margin-bottom: 0.25rem;">${conv.name}</div>
                    ${hasMessages ? `
                        <div style="font-size: 0.85rem; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${conv.lastMessage.message}</div>
                        <div style="font-size: 0.75rem; color: #999; margin-top: 0.25rem;">${isToday ? timeStr : dateStr}</div>
                    ` : `
                        <div style="font-size: 0.85rem; color: #999; font-style: italic;">No messages yet</div>
                    `}
                </div>
                ${unreadBadge}
            </div>
        `;
    }).join('');
    
    // If a conversation is already open, reload it
    if (currentChatWith) {
        openConversation(currentChatWith, conversations.find(c => c.username === currentChatWith)?.name || '');
    }
}

async function openConversation(username, name) {
    if (!currentAdmin) return;
    
    currentChatWith = username;
    
    // Update header
    document.getElementById('chatHeader').innerHTML = `
        <h3 style="color: var(--primary-color); margin: 0;">${name}</h3>
    `;
    
    // Show input area
    document.getElementById('chatInputArea').style.display = 'block';
    document.getElementById('chatWithUsername').value = username;
    
    // Load messages using API
    let messages = [];
    if (typeof API !== 'undefined' && API.messages) {
        try {
            messages = await API.messages.getConversation(username);
            // Mark as read
            await API.messages.markAsRead(username);
        } catch (error) {
            console.error('Error loading conversation:', error);
            messages = [];
        }
    } else {
        // Fallback to local storage
        messages = getConversation(currentAdmin.username, username);
        markConversationAsRead(currentAdmin.username, username);
    }
    
    const chatMessages = document.getElementById('chatMessages');
    
    if (messages.length === 0) {
        chatMessages.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">No messages yet. Start the conversation!</p>';
    } else {
        chatMessages.innerHTML = messages.map(msg => {
            const isFromMe = msg.fromUsername === currentAdmin.username;
            const msgDate = new Date(msg.timestamp);
            const timeStr = formatTime(msgDate);
            
            return `
                <div style="display: flex; justify-content: ${isFromMe ? 'flex-end' : 'flex-start'}; margin-bottom: 1rem;">
                    <div style="max-width: 70%; background: ${isFromMe ? 'var(--primary-color)' : 'var(--white)'}; color: ${isFromMe ? 'white' : 'var(--text-color)'}; padding: 0.75rem 1rem; border-radius: 10px; box-shadow: var(--shadow);">
                        <div style="font-size: 0.85rem; margin-bottom: 0.25rem; opacity: 0.8;">${isFromMe ? 'You' : msg.fromName}</div>
                        <div style="white-space: pre-wrap; word-wrap: break-word;">${msg.message}</div>
                        <div style="font-size: 0.75rem; margin-top: 0.5rem; opacity: 0.7;">${timeStr}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Reload conversations list to update unread counts
    loadMessages();
    
    // Update badge
    updateMessagesBadge();
}

// Handle message form submission
document.addEventListener('DOMContentLoaded', function() {
    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!currentAdmin) return;
            
            const toUsername = document.getElementById('chatWithUsername').value;
            const messageText = document.getElementById('messageInput').value.trim();
            
            if (!messageText || !toUsername) return;
            
            // Get recipient name
            const drivers = getDrivers();
            const recipient = drivers.find(d => d.username === toUsername);
            const recipientName = recipient ? recipient.name : toUsername;
            
            // Send message
            sendMessage(currentAdmin.username, currentAdmin.name, toUsername, recipientName, messageText);
            
            // Clear input
            document.getElementById('messageInput').value = '';
            
            // Reload conversation
            openConversation(toUsername, recipientName);
            
            // Update badge
            updateMessagesBadge();
        });
    }
});

function updateMessagesBadge() {
    if (!currentAdmin) return;
    
    const unreadCount = getUnreadMessageCount(currentAdmin.username);
    const badge = document.getElementById('messagesBadge');
    
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
    
    // Also update group chat badge
    updateGroupChatBadge();
}

// Switch between direct messages and group chat
let currentMessageView = 'direct';
let groupChatInterval = null;

function switchMessageView(view) {
    currentMessageView = view;
    const directView = document.getElementById('directMessagesView');
    const groupView = document.getElementById('groupChatView');
    const directBtn = document.getElementById('btn-directMessages');
    const groupBtn = document.getElementById('btn-groupChat');
    
    if (view === 'group') {
        if (directView) directView.style.display = 'none';
        if (groupView) groupView.style.display = 'flex';
        if (directBtn) {
            directBtn.style.background = 'var(--light-bg)';
            directBtn.style.color = 'var(--text-color)';
        }
        if (groupBtn) {
            groupBtn.style.background = 'var(--primary-color)';
            groupBtn.style.color = 'white';
        }
        loadGroupMessages();
        // Start auto-refresh for group chat
        if (groupChatInterval) clearInterval(groupChatInterval);
        groupChatInterval = setInterval(loadGroupMessages, 3000); // Refresh every 3 seconds
    } else {
        if (directView) directView.style.display = 'grid';
        if (groupView) groupView.style.display = 'none';
        if (directBtn) {
            directBtn.style.background = 'var(--primary-color)';
            directBtn.style.color = 'white';
        }
        if (groupBtn) {
            groupBtn.style.background = 'var(--light-bg)';
            groupBtn.style.color = 'var(--text-color)';
        }
        // Stop auto-refresh when not viewing group chat
        if (groupChatInterval) {
            clearInterval(groupChatInterval);
            groupChatInterval = null;
        }
    }
}

// Load group messages
async function loadGroupMessages() {
    if (!currentAdmin || typeof API === 'undefined' || !API.messages) return;
    
    const container = document.getElementById('groupChatMessages');
    if (!container) return;
    
    try {
        const messages = await API.messages.getGroup(100);
        
        if (messages.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #666; padding: 2rem;">No messages yet. Start the conversation!</div>';
            return;
        }
        
        container.innerHTML = messages.map(msg => {
            const isOwnMessage = msg.fromUsername === currentAdmin.username;
            const timestamp = formatDateTime(msg.timestamp, {
                month: 'short',
                day: 'numeric'
            });
            const roleBadge = msg.fromRole === 'admin' 
                ? '<span style="background: var(--primary-color); color: white; padding: 0.2rem 0.5rem; border-radius: 3px; font-size: 0.75rem; margin-left: 0.5rem;">Admin</span>'
                : '<span style="background: #28a745; color: white; padding: 0.2rem 0.5rem; border-radius: 3px; font-size: 0.75rem; margin-left: 0.5rem;">Driver</span>';
            
            return `
                <div style="margin-bottom: 1rem; display: flex; ${isOwnMessage ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}">
                    <div style="max-width: 70%; ${isOwnMessage ? 'background: var(--primary-color); color: white;' : 'background: white; border: 1px solid #e0e0e0;'} padding: 0.75rem 1rem; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        <div style="font-weight: 600; margin-bottom: 0.25rem; ${isOwnMessage ? 'color: white;' : 'color: var(--primary-color);'}">
                            ${msg.fromName}${roleBadge}
                        </div>
                        <div style="${isOwnMessage ? 'color: white;' : 'color: #333;'} margin-bottom: 0.25rem; line-height: 1.5;">
                            ${msg.message}
                        </div>
                        <div style="font-size: 0.75rem; ${isOwnMessage ? 'color: rgba(255,255,255,0.8);' : 'color: #666;'}">
                            ${timestamp}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    } catch (error) {
        console.error('Error loading group messages:', error);
        container.innerHTML = '<div style="text-align: center; color: #dc3545; padding: 2rem;">Error loading messages. Please refresh.</div>';
    }
}

// Send group message
async function sendGroupMessage(messageText) {
    if (!currentAdmin || typeof API === 'undefined' || !API.messages) return;
    
    if (!messageText || !messageText.trim()) return;
    
    try {
        await API.messages.sendGroup(messageText.trim());
        // Reload messages
        loadGroupMessages();
        // Update badge
        updateGroupChatBadge();
    } catch (error) {
        console.error('Error sending group message:', error);
        alert('Error sending message. Please try again.');
    }
}

// Update group chat badge
async function updateGroupChatBadge() {
    if (!currentAdmin || typeof API === 'undefined' || !API.messages) return;
    
    // Check if we're running from file:// protocol (local file)
    if (window.location.protocol === 'file:') {
        // Silently fail - API calls won't work from file:// protocol
        return;
    }
    
    try {
        const response = await API.messages.getGroupUnreadCount();
        const badge = document.getElementById('groupChatBadge');
        
        if (badge) {
            if (response && response.count > 0) {
                badge.textContent = response.count;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        // Silently fail for file:// protocol errors or CORS errors (expected when opening file://)
        if (error.isFileProtocol || (error.message && (error.message.includes('CORS') || error.message.includes('Failed to fetch')))) {
            return;
        }
        console.error('Error updating group chat badge:', error);
    }
}

// Handle group message form submission
document.addEventListener('DOMContentLoaded', function() {
    const groupMessageForm = document.getElementById('groupMessageForm');
    if (groupMessageForm) {
        groupMessageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!currentAdmin) return;
            
            const messageText = document.getElementById('groupMessageInput').value.trim();
            if (!messageText) return;
            
            sendGroupMessage(messageText);
            
            // Clear input
            document.getElementById('groupMessageInput').value = '';
        });
    }
    
    // Update group chat badge on load
    updateGroupChatBadge();
});

function startConversationWithDriver(driverUsername, driverName) {
    // Switch to messages view
    switchView('messages');
    
    // Wait a moment for the view to load, then open conversation
    setTimeout(() => {
        openConversation(driverUsername, driverName);
    }, 100);
}

// Announcement Management Functions
function loadAnnouncements() {
    const announcements = getAnnouncements();
    const container = document.getElementById('announcementsList');
    
    if (!container) return;
    
    if (announcements.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No announcements yet. Create your first announcement!</p>';
        return;
    }
    
    // Sort by date (newest first)
    const sorted = announcements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    container.innerHTML = sorted.map(announcement => {
        const date = new Date(announcement.createdAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
        
        const statusBadge = announcement.isActive !== false 
            ? '<span style="background: #28a745; color: white; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.85rem; margin-left: 1rem;">Active</span>'
            : '<span style="background: #6c757d; color: white; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.85rem; margin-left: 1rem;">Inactive</span>';
        
        return `
            <div style="background: var(--light-bg); padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; border-left: 4px solid var(--primary-color);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div style="flex: 1;">
                        <h3 style="color: var(--primary-color); margin: 0 0 0.5rem 0; font-size: 1.3rem;">${announcement.title}${statusBadge}</h3>
                        <p style="color: #666; margin: 0; font-size: 0.9rem;">Created: ${date}</p>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button onclick="editAnnouncement('${announcement.id}')" style="padding: 0.5rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.9rem;">Edit</button>
                        <button onclick="toggleAnnouncementStatus('${announcement.id}')" style="padding: 0.5rem 1rem; background: ${announcement.isActive !== false ? '#ffc107' : '#28a745'}; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.9rem;">${announcement.isActive !== false ? 'Deactivate' : 'Activate'}</button>
                        <button onclick="deleteAnnouncementHandler('${announcement.id}')" style="padding: 0.5rem 1rem; background: var(--error-color); color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.9rem;">Delete</button>
                    </div>
                </div>
                <div style="color: #333; line-height: 1.6; white-space: pre-wrap; background: white; padding: 1rem; border-radius: 5px;">${announcement.content}</div>
            </div>
        `;
    }).join('');
}

function openAnnouncementModal(announcementId = null) {
    const modal = document.getElementById('announcementModal');
    if (!modal) return;
    
    const form = document.getElementById('announcementForm');
    const titleInput = document.getElementById('announcementTitle');
    const contentInput = document.getElementById('announcementContent');
    const idInput = document.getElementById('announcementId');
    
    if (announcementId) {
        // Edit mode
        const announcement = getAnnouncements().find(a => a.id === announcementId);
        if (announcement) {
            titleInput.value = announcement.title;
            contentInput.value = announcement.content;
            idInput.value = announcement.id;
            const titleEl = document.getElementById('announcementModalTitle');
            if (titleEl) titleEl.textContent = 'Edit Announcement';
        }
    } else {
        // New mode
        titleInput.value = '';
        contentInput.value = '';
        idInput.value = '';
        const titleEl = document.getElementById('announcementModalTitle');
        if (titleEl) titleEl.textContent = 'New Announcement';
    }
    
    modal.style.display = 'flex';
}

function closeAnnouncementModal() {
    const modal = document.getElementById('announcementModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function handleAnnouncementSubmit(event) {
    event.preventDefault();
    
    const titleInput = document.getElementById('announcementTitle');
    const contentInput = document.getElementById('announcementContent');
    const idInput = document.getElementById('announcementId');
    
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const id = idInput.value;
    
    if (!title || !content) {
        alert('Please fill in both title and content.');
        return;
    }
    
    if (id) {
        // Update existing
        updateAnnouncement(id, title, content);
    } else {
        // Create new
        addAnnouncement(title, content);
    }
    
    closeAnnouncementModal();
    loadAnnouncements();
}

function editAnnouncement(announcementId) {
    openAnnouncementModal(announcementId);
}

function toggleAnnouncementStatus(announcementId) {
    const announcement = getAnnouncements().find(a => a.id === announcementId);
    if (!announcement) return;
    
    const newStatus = announcement.isActive !== false ? false : true;
    updateAnnouncement(announcementId, announcement.title, announcement.content, newStatus);
    loadAnnouncements();
}

function deleteAnnouncementHandler(announcementId) {
    if (!confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
        return;
    }
    
    deleteAnnouncement(announcementId);
    loadAnnouncements();
}

// Close announcement modal when clicking outside
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('announcementModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeAnnouncementModal();
            }
        });
    }
});

// Load pricing management interface
function loadPricing() {
    const container = document.getElementById('pricingContainer');
    if (!container) return;
    
    // Get current rates
    const currentRates = typeof getRates === 'function' ? getRates() : ratesData;
    
    let html = '<div style="margin-bottom: 2rem;">';
    html += '<p style="color: #666; margin-bottom: 1.5rem;">Manage pricing for all destinations. Changes will be saved automatically.</p>';
    
    // Create pricing editor for each destination
    Object.keys(currentRates).forEach(destKey => {
        const destination = currentRates[destKey];
        html += `
            <div style="background: var(--light-bg); padding: 1.5rem; border-radius: 10px; margin-bottom: 2rem; border: 2px solid #e0e0e0;">
                <h3 style="color: var(--primary-color); margin-bottom: 1rem; font-size: 1.3rem;">${destination.name}</h3>
                <p style="color: #666; margin-bottom: 1.5rem; font-size: 0.9rem;">${destination.description}</p>
                
                <div style="margin-bottom: 1.5rem;">
                    <h4 style="color: var(--secondary-color); margin-bottom: 1rem; font-size: 1.1rem;">Vehicle Rates</h4>
                    <div style="display: grid; gap: 1rem;">
        `;
        
        // Vehicle rates
        destination.rates.forEach((rate, index) => {
            html += `
                <div style="display: flex; align-items: center; gap: 1rem; background: var(--white); padding: 1rem; border-radius: 5px;">
                    <label style="min-width: 120px; font-weight: 600; color: var(--primary-color);">${rate.vehicle}:</label>
                    <span style="color: #666;">$</span>
                    <input type="number" 
                           id="rate-${destKey}-${index}" 
                           value="${rate.price.replace('$', '')}" 
                           min="0" 
                           step="0.01"
                           style="flex: 1; padding: 0.5rem; border: 2px solid #e0e0e0; border-radius: 5px; font-size: 1rem;"
                           onchange="updatePricingRate('${destKey}', ${index}, '${rate.vehicle}', this.value)">
                    <span style="color: #999; font-size: 0.9rem;">per ride</span>
                </div>
            `;
        });
        
        html += `
                    </div>
                </div>
                
                <div>
                    <h4 style="color: var(--secondary-color); margin-bottom: 1rem; font-size: 1.1rem;">Additional Fees</h4>
                    <div style="display: grid; gap: 1rem;">
        `;
        
        // Additional fees
        destination.additionalFees.forEach((fee, index) => {
            const feeKey = fee.name.toLowerCase().replace(/\s+/g, '-');
            html += `
                <div style="display: flex; align-items: center; gap: 1rem; background: var(--white); padding: 1rem; border-radius: 5px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--primary-color); margin-bottom: 0.25rem;">${fee.name}</div>
                        <div style="font-size: 0.85rem; color: #666;">${fee.description}</div>
                    </div>
                    <span style="color: #666;">$</span>
                    <input type="number" 
                           id="fee-${destKey}-${index}" 
                           value="${fee.price.replace('$', '')}" 
                           min="0" 
                           step="0.01"
                           style="width: 100px; padding: 0.5rem; border: 2px solid #e0e0e0; border-radius: 5px; font-size: 1rem;"
                           onchange="updatePricingFee('${destKey}', ${index}, '${feeKey}', this.value)">
                </div>
            `;
        });
        
        html += `
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    html += '<div style="margin-top: 2rem; padding-top: 2rem; border-top: 2px solid #e0e0e0;">';
    html += '<button onclick="resetPricingToDefaults()" style="padding: 0.75rem 2rem; background: #6c757d; color: var(--white); border: none; border-radius: 5px; font-weight: 600; cursor: pointer; font-size: 0.9rem;">Reset to Default Prices</button>';
    html += '</div>';
    
    container.innerHTML = html;
}

// Update pricing rate
function updatePricingRate(destKey, rateIndex, vehicleType, newPrice) {
    const currentRates = typeof getRates === 'function' ? getRates() : ratesData;
    
    if (!currentRates[destKey] || !currentRates[destKey].rates[rateIndex]) {
        alert('Error: Destination or rate not found');
        return;
    }
    
    // Update the rate
    currentRates[destKey].rates[rateIndex].price = '$' + parseFloat(newPrice).toFixed(2);
    
    // Save to localStorage
    if (typeof updateRates === 'function') {
        updateRates(currentRates);
    } else if (typeof saveRates === 'function') {
        saveRates(currentRates);
    }
    
    // Update global ratesData
    if (typeof ratesData !== 'undefined') {
        ratesData[destKey].rates[rateIndex].price = '$' + parseFloat(newPrice).toFixed(2);
    }
    
    // Show success message
    const input = document.getElementById(`rate-${destKey}-${rateIndex}`);
    if (input) {
        input.style.borderColor = '#28a745';
        setTimeout(() => {
            input.style.borderColor = '#e0e0e0';
        }, 1000);
    }
}

// Update pricing fee
function updatePricingFee(destKey, feeIndex, feeKey, newPrice) {
    const currentRates = typeof getRates === 'function' ? getRates() : ratesData;
    
    if (!currentRates[destKey] || !currentRates[destKey].additionalFees[feeIndex]) {
        alert('Error: Destination or fee not found');
        return;
    }
    
    // Update the fee
    currentRates[destKey].additionalFees[feeIndex].price = '$' + parseFloat(newPrice).toFixed(2);
    
    // Save to localStorage
    if (typeof updateRates === 'function') {
        updateRates(currentRates);
    } else if (typeof saveRates === 'function') {
        saveRates(currentRates);
    }
    
    // Update global ratesData
    if (typeof ratesData !== 'undefined') {
        ratesData[destKey].additionalFees[feeIndex].price = '$' + parseFloat(newPrice).toFixed(2);
    }
    
    // Show success message
    const input = document.getElementById(`fee-${destKey}-${feeIndex}`);
    if (input) {
        input.style.borderColor = '#28a745';
        setTimeout(() => {
            input.style.borderColor = '#e0e0e0';
        }, 1000);
    }
}

// Reset pricing to defaults
function resetPricingToDefaults() {
    if (!confirm('Are you sure you want to reset all pricing to default values? This cannot be undone.')) {
        return;
    }
    
    // Clear localStorage
    localStorage.removeItem('pricingRates');
    
    // Reload rates (will use defaults)
    if (typeof initializeRates === 'function') {
        initializeRates();
    }
    
    // Reload the pricing view
    loadPricing();
    
    alert('Pricing has been reset to default values.');
}





