// Initialize EmailJS (you'll need to add your public key)
// emailjs.init("YOUR_PUBLIC_KEY"); // Uncomment and add your EmailJS public key

// Get current driver from API session
let currentDriver = null;

// Load current driver from API
async function loadCurrentDriver() {
    try {
        const user = await API.auth.getCurrentUser();
        if (user && user.role === 'driver') {
            currentDriver = user;
            const driverNameEl = document.getElementById('driverName');
            if (driverNameEl) {
                driverNameEl.textContent = currentDriver.name;
            }
        } else {
            // Fallback to localStorage if API fails
            currentDriver = getCurrentDriver();
            if (currentDriver && document.getElementById('driverName')) {
                document.getElementById('driverName').textContent = currentDriver.name;
            }
        }
    } catch (error) {
        console.error('Error loading current driver:', error);
        // Fallback to localStorage
        currentDriver = getCurrentDriver();
        if (currentDriver && document.getElementById('driverName')) {
            document.getElementById('driverName').textContent = currentDriver.name;
        }
    }
}

// Logout function
function logout() {
    logoutDriver();
    window.location.href = 'driver-login.html';
}
// Expose to global scope for HTML onclick handlers
window.logout = logout;

// View switching
let currentView = 'list';
let allRides = []; // Store all rides from API

// Get current filter value
function getCurrentFilter() {
    const listFilter = document.getElementById('rideFilter');
    const calendarFilter = document.getElementById('calendarRideFilter');
    
    if (currentView === 'list' && listFilter) {
        return listFilter.value;
    } else if (currentView === 'calendar' && calendarFilter) {
        return calendarFilter.value;
    }
    return 'all'; // Default
}

// Apply filter to rides
function applyFilter(rides) {
    const filterValue = getCurrentFilter();
    
    if (filterValue === 'pending') {
        // Only show pending rides
        const filtered = rides.filter(ride => {
            return ride.status === 'pending';
        });
        
        console.log(`Filtered: ${filtered.length} pending rides out of ${rides.length} total`);
        return filtered;
    } else if (filterValue === 'my-rides') {
        // Only show rides accepted or completed by current driver
        if (!currentDriver) {
            console.warn('No current driver - cannot filter to my rides');
            return [];
        }
        
        const filtered = rides.filter(ride => {
            return (ride.status === 'accepted' || ride.status === 'completed') && 
                   ride.driverId === currentDriver.username;
        });
        
        console.log(`Filtered: ${filtered.length} rides (accepted/completed) for driver ${currentDriver.username} out of ${rides.length} total`);
        return filtered;
    } else {
        // Show all rides
        return rides;
    }
}

function switchView(view) {
    currentView = view;
// Expose to global scope for HTML onclick handlers
window.switchView = switchView;
    
    // Update buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const btnMap = {
        'list': 'btn-list',
        'calendar': 'btn-calendar',
        'days-off': 'btn-days-off',
        'notifications': 'btn-notifications',
        'messages': 'btn-messages',
        'profile': 'btn-profile'
    };
    if (btnMap[view]) {
        document.getElementById(btnMap[view]).classList.add('active');
    }
    
    // Update views
    document.getElementById('listView').classList.toggle('active', view === 'list');
    document.getElementById('calendarView').classList.toggle('active', view === 'calendar');
    document.getElementById('daysOffView').classList.toggle('active', view === 'days-off');
    document.getElementById('notificationsView').classList.toggle('active', view === 'notifications');
    document.getElementById('messagesView').classList.toggle('active', view === 'messages');
    document.getElementById('profileView').classList.toggle('active', view === 'profile');
    
    // Sync filter dropdowns when switching views
    const listFilter = document.getElementById('rideFilter');
    const calendarFilter = document.getElementById('calendarRideFilter');
    if (listFilter && calendarFilter) {
        if (view === 'list') {
            calendarFilter.value = listFilter.value;
        } else if (view === 'calendar') {
            listFilter.value = calendarFilter.value;
        }
    }
    
    // Reload data based on view
    if (view === 'list' || view === 'calendar') {
        loadRides();
    } else if (view === 'days-off') {
        loadDaysOff();
    } else if (view === 'notifications') {
        loadNotifications();
    } else if (view === 'messages') {
        loadDriverMessages();
    } else if (view === 'profile') {
        loadProfile();
    }
}

// Check for rides that need confirmation
function checkUnconfirmedRides() {
    if (!currentDriver) return;
    
    // Use allRides from API, not localStorage
    const rides = allRides.length > 0 ? allRides : getRides();
    const now = new Date();
    
    // Find rides that need confirmation (accepted, within 48 hours, not confirmed)
    const unconfirmedRides = rides.filter(ride => {
        if (ride.status !== 'accepted' || ride.driverId !== currentDriver.username || ride.confirmed) {
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
        
        if (unconfirmedRides.length === 1) {
            const ride = unconfirmedRides[0];
            const dateParts = ride.date.split('-');
            const formattedDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
            const formattedTime = new Date(`2000-01-01T${ride.time}`).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
            alertText.textContent = `You have 1 ride that needs confirmation: ${ride.pickup} → ${ride.destination} on ${formattedDate} at ${formattedTime}`;
        } else {
            alertText.textContent = `You have ${unconfirmedRides.length} rides that need confirmation within the next 48 hours. Please confirm them to ensure customers receive pickup notifications.`;
        }
    } else {
        alertDiv.style.display = 'none';
    }
}

// Load and display rides
async function loadRides() {
    try {
        // Ensure currentDriver is loaded
        if (!currentDriver) {
            await loadCurrentDriver();
        }
        
        // Fetch all rides from API
        allRides = await API.rides.getAll();
        
        // Apply filter
        const filteredRides = applyFilter(allRides);
        
        // Display filtered rides
        if (currentView === 'list') {
            displayListView(filteredRides);
        } else {
            displayCalendarView(filteredRides);
        }
        
        // Check for unconfirmed rides (use all rides, not filtered)
        checkUnconfirmedRides();
    } catch (error) {
        console.error('Error loading rides:', error);
        const container = currentView === 'list' 
            ? document.getElementById('ridesList')
            : document.getElementById('calendarGrid');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Error Loading Rides</h3>
                    <p>There was an error loading rides. Please try again.</p>
                </div>
            `;
        }
    }
}

// Display list view
function displayListView(rides) {
    const container = document.getElementById('ridesList');
    
    if (rides.length === 0) {
        const filterValue = getCurrentFilter();
        let emptyMessage = 'There are currently no ride requests.';
        if (filterValue === 'pending') {
            emptyMessage = 'There are currently no pending rides.';
        } else if (filterValue === 'my-rides') {
            emptyMessage = 'You have not accepted or completed any rides yet.';
        }
        container.innerHTML = `
            <div class="empty-state">
                <h3>No Rides Available</h3>
                <p>${emptyMessage}</p>
            </div>
        `;
        return;
    }
    
    // Sort rides by date/time: most upcoming (soonest) first, then farthest in the future
    const sortedRides = rides.sort((a, b) => {
        const dateTimeA = new Date(a.date + 'T' + a.time);
        const dateTimeB = new Date(b.date + 'T' + b.time);
        return dateTimeA - dateTimeB; // Ascending: soonest first
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
    
    // Sort weeks (soonest first)
    const sortedWeeks = Object.keys(ridesByWeek).sort((a, b) => new Date(a) - new Date(b));
    
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
                        </div>
                    </div>
                    <div style="font-size: 1.5rem; color: var(--primary-color); transition: transform 0.3s ease;" id="${weekId}-arrow">▼</div>
                </div>
                <div class="week-content" id="${weekId}-content" style="display: none; padding: 1.5rem;">
                    <div style="display: grid; gap: 1.5rem;">
                        ${weekData.rides.sort((a, b) => {
                            // Sort rides within each week by date/time (soonest first)
                            const dateTimeA = new Date(a.date + 'T' + a.time);
                            const dateTimeB = new Date(b.date + 'T' + b.time);
                            return dateTimeA - dateTimeB;
                        }).map(ride => createRideCard(ride)).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners to accept buttons, reschedule buttons, and give up buttons
    sortedRides.forEach(ride => {
        if (ride.status === 'pending') {
            const acceptBtn = document.getElementById(`accept-${ride.id}`);
            if (acceptBtn) {
                acceptBtn.addEventListener('click', () => acceptRideHandler(ride.id));
            }
        } else if (ride.status === 'accepted' && ride.driverId === currentDriver?.username) {
            const completeBtn = document.getElementById(`complete-${ride.id}`);
            if (completeBtn) {
                completeBtn.addEventListener('click', () => completeRideHandler(ride.id));
            }
            const rescheduleBtn = document.getElementById(`reschedule-${ride.id}`);
            if (rescheduleBtn) {
                rescheduleBtn.addEventListener('click', () => openRescheduleModal(ride.id));
            }
            const giveUpBtn = document.getElementById(`giveup-${ride.id}`);
            if (giveUpBtn) {
                giveUpBtn.addEventListener('click', () => giveUpRideHandler(ride.id));
            }
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

// Display calendar view
function displayCalendarView(rides) {
    const container = document.getElementById('calendarGrid');
    
    if (rides.length === 0) {
        const filterValue = getCurrentFilter();
        let emptyMessage = 'There are currently no ride requests.';
        if (filterValue === 'pending') {
            emptyMessage = 'There are currently no pending rides.';
        } else if (filterValue === 'my-rides') {
            emptyMessage = 'You have not accepted or completed any rides yet.';
        }
        container.innerHTML = `
            <div class="empty-state">
                <h3>No Rides Available</h3>
                <p>${emptyMessage}</p>
            </div>
        `;
        return;
    }
    
    // Group rides by date
    const ridesByDate = {};
    rides.forEach(ride => {
        const date = ride.date;
        if (!ridesByDate[date]) {
            ridesByDate[date] = [];
        }
        ridesByDate[date].push(ride);
    });
    
    // Sort dates (ascending: soonest first)
    const sortedDates = Object.keys(ridesByDate).sort((a, b) => {
        return new Date(a) - new Date(b);
    });
    
    // Create calendar days
    container.innerHTML = sortedDates.map(date => {
        const dayRides = ridesByDate[date].sort((a, b) => {
            // Sort rides within each day by time (soonest first)
            return new Date(`2000-01-01T${a.time}`) - new Date(`2000-01-01T${b.time}`);
        });
        // Parse date using local time components to avoid timezone issues
        const dateParts = date.split('-');
        const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        return `
            <div class="calendar-day">
                <div class="calendar-day-header">${formattedDate}</div>
                <div class="day-rides">
                    ${dayRides.map(ride => createCalendarRideItem(ride)).join('')}
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners
    rides.forEach(ride => {
        if (ride.status === 'pending') {
            const acceptBtn = document.getElementById(`accept-calendar-${ride.id}`);
            if (acceptBtn) {
                acceptBtn.addEventListener('click', () => acceptRideHandler(ride.id));
            }
        } else if (ride.status === 'accepted' && ride.driverId === currentDriver?.username) {
            const confirmBtn = document.getElementById(`confirm-calendar-${ride.id}`);
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => confirmPickupHandler(ride.id));
            }
            const completeBtn = document.getElementById(`complete-calendar-${ride.id}`);
            if (completeBtn) {
                completeBtn.addEventListener('click', () => completeRideHandler(ride.id));
            }
            const rescheduleBtn = document.getElementById(`reschedule-calendar-${ride.id}`);
            if (rescheduleBtn) {
                rescheduleBtn.addEventListener('click', () => openRescheduleModal(ride.id));
            }
            const giveUpBtn = document.getElementById(`giveup-calendar-${ride.id}`);
            if (giveUpBtn) {
                giveUpBtn.addEventListener('click', () => giveUpRideHandler(ride.id));
            }
        }
    });
}

// Create ride card for list view
// Check if a driver's vehicle type can handle a required vehicle type
// Hierarchy: XL SUV can do Sedans, SUV, XL SUV
//            SUV can do Sedans, SUV
//            Sedans can do Sedans only
function canVehicleTypeHandle(driverVehicleType, requiredVehicleType) {
    // Normalize vehicle type names
    const normalizedDriver = driverVehicleType.trim();
    const normalizedRequired = requiredVehicleType.trim();
    
    // If exact match, always allowed
    if (normalizedDriver === normalizedRequired) {
        return true;
    }
    
    // XL SUV can handle Sedans and SUV
    if (normalizedDriver === 'XL SUV') {
        return normalizedRequired === 'Sedans' || normalizedRequired === 'SUV';
    }
    
    // SUV can handle Sedans
    if (normalizedDriver === 'SUV') {
        return normalizedRequired === 'Sedans';
    }
    
    // Sedans can only handle Sedans (already checked above)
    return false;
}

// Check if driver can accept a ride based on vehicle type
function canDriverAcceptRide(ride) {
    if (!currentDriver) return false;
    
    // Get latest driver data from localStorage
    const drivers = getDrivers();
    const driver = drivers.find(d => d.username === currentDriver.username);
    if (!driver) return false;
    
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
        return false;
    }
    
    // Check if any of the driver's vehicles can handle the required vehicle type
    return driverVehicleTypes.some(driverVehicleType => 
        canVehicleTypeHandle(driverVehicleType, requiredVehicleType)
    );
}

// Check if driver can accept a ride based on all restrictions (vehicle type, day off, time conflicts)
// Returns an object with canAccept (boolean) and reason (string)
function canDriverAcceptRideWithRestrictions(ride) {
    if (!currentDriver) {
        return { canAccept: false, reason: 'Driver not logged in' };
    }
    
    // Get latest driver data from localStorage
    const drivers = getDrivers();
    const driver = drivers.find(d => d.username === currentDriver.username);
    if (!driver) {
        return { canAccept: false, reason: 'Driver not found' };
    }
    
    // Check vehicle type first
    const vehicleCheck = canDriverAcceptRide(ride);
    if (!vehicleCheck) {
        const requiredVehicleType = ride.vehicleType || 'Sedans';
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
        const vehicleTypesText = driverVehicleTypes.length > 0 ? driverVehicleTypes.join(', ') : 'none';
        return { 
            canAccept: false, 
            reason: `You need a ${requiredVehicleType} to accept this ride. You currently have: ${vehicleTypesText}` 
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
            
            // Ensure it's in YYYY-MM-DD format
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
            return { canAccept: false, reason: 'Cannot accept ride on a scheduled day off' };
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
        const conflictTime = new Date(`2000-01-01T${conflictingRide.time}`).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        return { 
            canAccept: false, 
            reason: `You already have a ride scheduled on ${conflictDate} at ${conflictTime}. Rides must be at least 2 hours apart (or 30 minutes if both are at the same airport).` 
        };
    }
    
    return { canAccept: true, reason: '' };
}

function createRideCard(ride) {
    // Parse date using local time components to avoid timezone issues
    const dateParts = ride.date.split('-');
    const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
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
        : '<span class="ride-status accepted">Accepted</span>';
    
    let actionButtons = '';
    if (ride.status === 'pending') {
        // Check if driver can accept this ride (including all restrictions)
        const acceptanceCheck = canDriverAcceptRideWithRestrictions(ride);
        
        if (acceptanceCheck.canAccept) {
            actionButtons = `<button class="accept-btn" id="accept-${ride.id}">Accept Ride</button>`;
        } else {
            actionButtons = `
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <button class="accept-btn" disabled style="opacity: 0.5; cursor: not-allowed;">
                        Cannot Accept
                    </button>
                    <div style="font-size: 0.85rem; color: #dc3545; padding: 0.5rem; background: #f8d7da; border-radius: 5px; border-left: 3px solid #dc3545;">
                        ${acceptanceCheck.reason}
                    </div>
                </div>
            `;
        }
    } else if (ride.status === 'accepted') {
        if (ride.driverId === currentDriver?.username) {
            // Check if ride is within 48 hour window for confirmation
            const rideDateTime = new Date(`${ride.date}T${ride.time}`);
            const now = new Date();
            const hoursUntilRide = (rideDateTime - now) / (1000 * 60 * 60);
            const canConfirm = hoursUntilRide >= 0 && hoursUntilRide <= 48 && !ride.confirmed;
            const isConfirmed = ride.confirmed === true;
            
            let confirmButton = '';
            if (canConfirm) {
                confirmButton = `<button class="accept-btn" id="confirm-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; background: #17a2b8; min-width: 120px;">Confirm Pickup</button>`;
            } else if (isConfirmed) {
                confirmButton = `<div style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; background: #d4edda; color: #155724; border-radius: 5px; text-align: center; min-width: 120px; display: flex; align-items: center; justify-content: center;">
                    ✓ Confirmed
                </div>`;
            }
            
            const completeButtonDisabled = !isConfirmed ? 'disabled' : '';
            const completeButtonStyle = !isConfirmed 
                ? 'flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; background: #6c757d; min-width: 120px; opacity: 0.5; cursor: not-allowed;'
                : 'flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; background: #28a745; min-width: 120px;';
            const completeButtonTitle = !isConfirmed ? 'title="Pickup must be confirmed before completing the ride"' : '';
            
            actionButtons = `
                <div class="detail-item"><span class="detail-label">Driver:</span><span class="detail-value">${ride.driverName || 'N/A'}</span></div>
                ${isConfirmed ? `<div class="detail-item"><span class="detail-label">Pickup Confirmed:</span><span class="detail-value">${ride.confirmedAt ? new Date(ride.confirmedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Yes'}</span></div>` : ''}
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;">
                    ${confirmButton}
                    <button class="accept-btn" id="complete-${ride.id}" ${completeButtonDisabled} style="${completeButtonStyle}" ${completeButtonTitle}>Mark as Complete</button>
                    <button class="accept-btn" id="reschedule-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 120px;">Reschedule</button>
                    <button class="give-up-btn" id="giveup-${ride.id}" style="flex: 1; min-width: 120px;">Give Up</button>
                </div>
                ${!isConfirmed && !canConfirm && hoursUntilRide > 48 ? '<div style="font-size: 0.85rem; color: #856404; padding: 0.5rem; background: #fff3cd; border-radius: 5px; margin-top: 0.5rem; border-left: 3px solid #ffc107;">Confirmation will be available within 48 hours before the ride.</div>' : ''}
            `;
        } else {
            actionButtons = `<div class="detail-item"><span class="detail-label">Driver:</span><span class="detail-value">${ride.driverName || 'N/A'}</span></div>`;
        }
    } else if (ride.status === 'completed') {
        actionButtons = `<div class="detail-item"><span class="detail-label">Driver:</span><span class="detail-value">${ride.driverName || 'N/A'}</span></div>
                         <div class="detail-item"><span class="detail-label">Completed:</span><span class="detail-value">${ride.completedAt ? new Date(ride.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'N/A'}</span></div>`;
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
            </div>
            ${pricingBreakdown}
            ${actionButtons}
        </div>
    `;
}

// Create calendar ride item
function createCalendarRideItem(ride) {
    const formattedTime = new Date(`2000-01-01T${ride.time}`).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    
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
        : '<span class="ride-status accepted" style="font-size: 0.75rem; padding: 0.2rem 0.5rem;">Accepted</span>';
    
    let actionButtons = '';
    if (ride.status === 'pending') {
        // Check if driver can accept this ride (including all restrictions)
        const acceptanceCheck = canDriverAcceptRideWithRestrictions(ride);
        
        if (acceptanceCheck.canAccept) {
            actionButtons = `<button class="accept-btn" id="accept-calendar-${ride.id}" style="padding: 0.5rem 1rem; font-size: 0.85rem; margin-top: 0.5rem;">Accept</button>`;
        } else {
            actionButtons = `
                <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
                    <button class="accept-btn" disabled style="opacity: 0.5; cursor: not-allowed; padding: 0.5rem 1rem; font-size: 0.85rem;">
                        Cannot Accept
                    </button>
                    <div style="font-size: 0.75rem; color: #dc3545; padding: 0.5rem; background: #f8d7da; border-radius: 5px; border-left: 3px solid #dc3545;">
                        ${acceptanceCheck.reason}
                    </div>
                </div>
            `;
        }
    } else if (ride.status === 'accepted') {
        if (ride.driverId === currentDriver?.username) {
            // Check if ride is within 48 hour window for confirmation
            const rideDateTime = new Date(`${ride.date}T${ride.time}`);
            const now = new Date();
            const hoursUntilRide = (rideDateTime - now) / (1000 * 60 * 60);
            const canConfirm = hoursUntilRide >= 0 && hoursUntilRide <= 48 && !ride.confirmed;
            const isConfirmed = ride.confirmed === true;
            
            let confirmButton = '';
            if (canConfirm) {
                confirmButton = `<button class="accept-btn" id="confirm-calendar-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; background: #17a2b8; min-width: 100px;">Confirm</button>`;
            } else if (isConfirmed) {
                confirmButton = `<div style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; background: #d4edda; color: #155724; border-radius: 5px; text-align: center; min-width: 100px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">
                    ✓ Confirmed
                </div>`;
            }
            
            const completeButtonDisabled = !isConfirmed ? 'disabled' : '';
            const completeButtonStyle = !isConfirmed 
                ? 'flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; background: #6c757d; min-width: 100px; opacity: 0.5; cursor: not-allowed;'
                : 'flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; background: #28a745; min-width: 100px;';
            const completeButtonTitle = !isConfirmed ? 'title="Pickup must be confirmed before completing the ride"' : '';
            
            actionButtons = `
                <div style="font-size: 0.85rem; margin-top: 0.25rem; color: #666;">Driver: ${ride.driverName || 'N/A'}</div>
                ${isConfirmed ? `<div style="font-size: 0.75rem; margin-top: 0.25rem; color: #155724;">✓ Confirmed ${ride.confirmedAt ? new Date(ride.confirmedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}</div>` : ''}
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;">
                    ${confirmButton}
                    <button class="accept-btn" id="complete-calendar-${ride.id}" ${completeButtonDisabled} style="${completeButtonStyle}" ${completeButtonTitle}>Complete</button>
                    <button class="accept-btn" id="reschedule-calendar-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 100px;">Reschedule</button>
                    <button class="give-up-btn" id="giveup-calendar-${ride.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem; min-width: 100px;">Give Up</button>
                </div>
            `;
        } else {
            actionButtons = `<div style="font-size: 0.85rem; margin-top: 0.25rem; color: #666;">Driver: ${ride.driverName || 'N/A'}</div>`;
        }
    } else if (ride.status === 'completed') {
        actionButtons = `<div style="font-size: 0.85rem; margin-top: 0.25rem; color: #666;">Driver: ${ride.driverName || 'N/A'}</div>
                         <div style="font-size: 0.85rem; margin-top: 0.25rem; color: #666;">Completed: ${ride.completedAt ? new Date(ride.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'N/A'}</div>`;
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

// Handle confirm pickup
async function confirmPickupHandler(rideId) {
    const ride = getRides().find(r => r.id === rideId);
    if (!ride) {
        alert('Ride not found');
        return;
    }
    
    if (ride.status !== 'accepted') {
        alert('This ride cannot be confirmed');
        return;
    }
    
    if (ride.driverId !== currentDriver?.username) {
        alert('You can only confirm rides you have accepted');
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
    const formattedTime = new Date(`2000-01-01T${ride.time}`).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    
    if (!confirm(`Confirm pickup for this ride?\n\n${ride.pickup} → ${ride.destination}\nDate: ${formattedDate}\nTime: ${formattedTime}\n\nThis will send a confirmation email to the customer.`)) {
        return;
    }
    
    // Disable button
    const confirmBtn = document.getElementById(`confirm-${rideId}`) || document.getElementById(`confirm-calendar-${rideId}`);
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Confirming...';
    }
    
    try {
        // Confirm the pickup
        const updatedRide = confirmPickup(rideId, currentDriver.username);
        
        if (updatedRide) {
            // Reload rides
            loadRides();
            
            // Update confirmation alert
            checkUnconfirmedRides();
            
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

// Handle complete ride
function completeRideHandler(rideId) {
    const ride = getRides().find(r => r.id === rideId);
    if (!ride) {
        alert('Ride not found');
        return;
    }
    
    if (ride.status !== 'accepted') {
        alert('This ride cannot be marked as complete');
        return;
    }
    
    if (ride.driverId !== currentDriver?.username) {
        alert('You can only complete rides you have accepted');
        return;
    }
    
    if (!ride.confirmed) {
        alert('Ride pickup must be confirmed before it can be completed. Please confirm the pickup first.');
        return;
    }
    
    if (!confirm(`Mark this ride as complete?\n\n${ride.pickup} → ${ride.destination}\nDate: ${ride.date}\nTime: ${ride.time}`)) {
        return;
    }
    
    // Disable button
    const completeBtn = document.getElementById(`complete-${rideId}`) || document.getElementById(`complete-calendar-${rideId}`);
    if (completeBtn) {
        completeBtn.disabled = true;
        completeBtn.textContent = 'Completing...';
    }
    
    try {
        // Complete the ride
        const updatedRide = completeRide(rideId, currentDriver.username);
        
        if (updatedRide) {
            // Reload rides
            loadRides();
            
            // Reload profile to update income
            if (currentView === 'profile') {
                loadProfile();
            }
            
            alert('Ride marked as complete!');
        } else {
            alert('Unable to complete ride. Please try again.');
        }
    } catch (error) {
        console.error('Error completing ride:', error);
        alert(error.message || 'An error occurred while completing the ride. Please try again.');
    } finally {
        if (completeBtn) {
            completeBtn.disabled = false;
            completeBtn.textContent = 'Mark as Complete';
        }
    }
}

// Handle accept ride
async function acceptRideHandler(rideId) {
    // Use allRides from API if available, otherwise fall back to getRides()
    const rides = allRides.length > 0 ? allRides : getRides();
    const ride = rides.find(r => r.id === rideId);
    if (!ride) {
        alert('Ride not found');
        return;
    }
    
    if (ride.status !== 'pending') {
        alert('This ride has already been accepted');
        return;
    }
    
    if (!confirm(`Accept this ride?\n\n${ride.pickup} → ${ride.destination}\nDate: ${ride.date}\nTime: ${ride.time}`)) {
        return;
    }
    
    // Disable button
    const acceptBtn = document.getElementById(`accept-${rideId}`) || document.getElementById(`accept-calendar-${rideId}`);
    if (acceptBtn) {
        acceptBtn.disabled = true;
        acceptBtn.textContent = 'Accepting...';
    }
    
    try {
        // Accept the ride
        const updatedRide = acceptRide(rideId, currentDriver);
        
        if (updatedRide) {
            // Send email to customer
            await sendAcceptanceEmail(updatedRide);
            
            // Reload rides
            loadRides();
            
            alert('Ride accepted! Customer has been notified via email.');
        } else {
            alert('Error accepting ride. Please try again.');
            if (acceptBtn) {
                acceptBtn.disabled = false;
                acceptBtn.textContent = 'Accept Ride';
            }
        }
    } catch (error) {
        console.error('Error accepting ride:', error);
        // Check if it's a validation error (from acceptRide) or email error
        if (error.message && (error.message.includes('day off') || error.message.includes('already have a ride') || error.message.includes('1.5 hours'))) {
            // Validation error from acceptRide
            alert(error.message);
        } else {
            // Email error or other error
            alert('Error sending confirmation email. Ride was accepted but email failed. Please contact the customer manually.');
            loadRides();
        }
        if (acceptBtn) {
            acceptBtn.disabled = false;
            acceptBtn.textContent = 'Accept Ride';
        }
    }
}

// Send acceptance email to customer
async function sendAcceptanceEmail(ride) {
    // Check if EmailJS is initialized
    if (typeof emailjs === 'undefined') {
        console.warn('EmailJS not initialized. Skipping email send.');
        return;
    }
    
    const templateParams = {
        to_email: ride.email,
        to_name: ride.name,
        driver_name: ride.driverName,
        driver_email: ride.driverEmail,
        driver_phone: ride.driverPhone,
        driver_vehicle: ride.driverVehicle,
        pickup: ride.pickup,
        destination: ride.destination,
        date: new Date(ride.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }),
        time: new Date(`2000-01-01T${ride.time}`).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        }),
        passengers: ride.passengers,
        message: `Your ride has been confirmed!

Driver Information:
Name: ${ride.driverName}
Phone: ${ride.driverPhone}
Vehicle: ${ride.driverVehicle}

Ride Details:
Pickup: ${ride.pickup}
Destination: ${ride.destination}
Date: ${new Date(ride.date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
})}
Time: ${new Date(`2000-01-01T${ride.time}`).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
})}
Passengers: ${ride.passengers}

Your driver will contact you if needed. Thank you for choosing South County Ride Share!`
    };
    
    try {
        // You'll need to create a separate EmailJS template for ride acceptance
        // Replace 'YOUR_SERVICE_ID' and 'YOUR_ACCEPTANCE_TEMPLATE_ID' with your actual IDs
        await emailjs.send(
            'YOUR_SERVICE_ID',              // Replace with your EmailJS Service ID
            'YOUR_ACCEPTANCE_TEMPLATE_ID',  // Replace with your Acceptance Template ID
            templateParams
        );
    } catch (error) {
        console.error('EmailJS Error:', error);
        throw error;
    }
}

// Load days off
function loadDaysOff() {
    const daysOff = getDaysOff();
    const myDaysOff = daysOff.filter(d => d.driverId === currentDriver?.username);
    const allDaysOff = daysOff;
    
    // Display my days off
    const myDaysOffList = document.getElementById('myDaysOffList');
    if (myDaysOffList) {
        if (myDaysOff.length === 0) {
            myDaysOffList.innerHTML = '<p style="color: #666; text-align: center;">No days off scheduled</p>';
        } else {
            myDaysOffList.innerHTML = myDaysOff.map(dayOff => {
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
                    <div class="day-off-item">
                        <span style="font-weight: 600; color: var(--primary-color);">${formattedDate}</span>
                        <button onclick="removeDayOffHandler('${dayOff.id}')">Remove</button>
                    </div>
                `;
            }).join('');
        }
    }
    
    // Display all drivers' days off
    const allDriversDaysOffList = document.getElementById('allDriversDaysOff');
    if (allDriversDaysOffList) {
        if (allDaysOff.length === 0) {
            allDriversDaysOffList.innerHTML = '<p style="color: #666; text-align: center;">No drivers have scheduled days off</p>';
        } else {
            // Group by date
            const groupedByDate = {};
            allDaysOff.forEach(dayOff => {
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

// Add day off handler (renamed to avoid conflict with driver-auth.js function)
function addDayOffHandler() {
    const dateInput = document.getElementById('dayOffDate');
    if (!dateInput) {
        alert('Date input not found');
        console.error('dayOffDate input element not found');
        return;
    }
    
    const date = dateInput.value;
    
    if (!date) {
        alert('Please select a date');
        return;
    }
    
    if (!currentDriver) {
        alert('Driver not found');
        console.error('currentDriver is not set');
        return;
    }
    
    try {
        // Call the function from driver-auth.js
        if (typeof addDayOff === 'function') {
            addDayOff(currentDriver.username, date);
        } else {
            // Fallback: directly add to localStorage
            const daysOff = getDaysOff();
            const newDayOff = {
                id: Date.now().toString(),
                driverId: currentDriver.username,
                driverName: currentDriver.name,
                date: date,
                createdAt: new Date().toISOString()
            };
            daysOff.push(newDayOff);
            saveDaysOff(daysOff);
        }
        
        dateInput.value = '';
        loadDaysOff();
        alert('Day off added successfully!');
    } catch (error) {
        console.error('Error adding day off:', error);
        alert('Error adding day off: ' + (error.message || 'Unknown error'));
    }
}

// Remove day off handler
function removeDayOffHandler(dayOffId) {
    if (confirm('Remove this day off?')) {
        removeDayOff(dayOffId);
        loadDaysOff();
    }
}

// Load notifications
function loadNotifications() {
    const notifications = getNotifications();
    const container = document.getElementById('notificationsList');
    
    if (!container) return;
    
    if (notifications.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 3rem;">No notifications</p>';
    } else {
        container.innerHTML = notifications.map(notification => {
            const date = new Date(notification.createdAt);
            const formattedDate = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
            
            const unreadClass = notification.read ? 'read' : 'unread';
            const icon = notification.type === 'new_ride' ? '🚗' : '🔄';
            
            let actionButton = '';
            if (notification.rideId) {
                const ride = getRides().find(r => r.id === notification.rideId);
                if (ride && ride.status === 'pending') {
                    actionButton = `<button class="accept-btn" onclick="viewRideFromNotification('${notification.rideId}', '${notification.id}')" style="padding: 0.5rem 1rem; font-size: 0.85rem;">View Ride</button>`;
                }
            }
            
            return `
                <div class="notification-item ${unreadClass}" onclick="markNotificationReadHandler('${notification.id}')">
                    <div class="notification-header">
                        <div>
                            <span style="font-size: 1.2rem; margin-right: 0.5rem;">${icon}</span>
                            <span class="notification-title">${notification.title}</span>
                        </div>
                        <span class="notification-time">${formattedDate}</span>
                    </div>
                    <div class="notification-body">${notification.message}</div>
                    ${actionButton ? `<div class="notification-actions">${actionButton}</div>` : ''}
                </div>
            `;
        }).join('');
    }
    
    updateNotificationBadge();
}

// Update notification badge
function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        const unreadCount = getUnreadNotificationCount();
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Mark notification as read handler
function markNotificationReadHandler(notificationId) {
    markNotificationRead(notificationId);
    loadNotifications();
}

// Mark all notifications as read
function markAllNotificationsReadHandler() {
    markAllNotificationsRead();
    loadNotifications();
}

// View ride from notification
function viewRideFromNotification(rideId, notificationId) {
    markNotificationRead(notificationId);
    switchView('list');
    loadRides();
    
    // Scroll to the ride after a short delay
    setTimeout(() => {
        const rideCard = document.getElementById(`ride-${rideId}`);
        if (rideCard) {
            rideCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            rideCard.style.border = '3px solid var(--accent-color)';
            setTimeout(() => {
                rideCard.style.border = '';
            }, 3000);
        }
    }, 100);
}

// Give up ride handler
function giveUpRideHandler(rideId) {
    if (!confirm('Are you sure you want to give up this ride? It will become available for other drivers.')) {
        return;
    }
    
    if (!currentDriver) {
        alert('Driver not found');
        return;
    }
    
    const ride = giveUpRide(rideId, currentDriver.username);
    if (ride) {
        alert('Ride has been released and is now available for other drivers.');
        loadRides();
    } else {
        alert('Unable to give up ride. Please try again.');
    }
}

// Open reschedule modal
function openRescheduleModal(rideId) {
    const ride = getRides().find(r => r.id === rideId);
    if (!ride) {
        alert('Ride not found');
        return;
    }
    
    if (ride.driverId !== currentDriver?.username) {
        alert('You can only reschedule rides you have accepted');
        return;
    }
    
    document.getElementById('rescheduleRideId').value = rideId;
    document.getElementById('rescheduleDate').value = ride.date;
    document.getElementById('rescheduleTime').value = ride.time;
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('rescheduleDate').setAttribute('min', today);
    
    document.getElementById('rescheduleModal').classList.add('active');
}

// Close reschedule modal
function closeRescheduleModal() {
    document.getElementById('rescheduleModal').classList.remove('active');
    document.getElementById('rescheduleForm').reset();
}

// Handle reschedule form submission
async function handleReschedule(event) {
    event.preventDefault();
    
    const rideId = document.getElementById('rescheduleRideId').value;
    const newDate = document.getElementById('rescheduleDate').value;
    const newTime = document.getElementById('rescheduleTime').value;
    
    if (!rideId || !newDate || !newTime) {
        alert('Please fill in all fields');
        return;
    }
    
    if (!currentDriver) {
        alert('Driver not found');
        return;
    }
    
    const ride = getRides().find(r => r.id === rideId);
    if (!ride) {
        alert('Ride not found');
        return;
    }
    
    if (ride.driverId !== currentDriver.username) {
        alert('You can only reschedule rides you have accepted');
        return;
    }
    
    // Disable submit button
    const submitBtn = event.target.querySelector('.modal-submit-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Rescheduling...';
    }
    
    try {
        // Ensure admin notifications are initialized
        if (typeof initializeAdminNotifications === 'function') {
            initializeAdminNotifications();
        }
        
        // Reschedule the ride (this will recalculate pricing and notify admin)
        const updatedRide = rescheduleRide(rideId, newDate, newTime, currentDriver.username);
        
        if (updatedRide) {
            // Recalculate pricing with new date/time to ensure it's updated
            const newPricing = calculatePricing(updatedRide, ratesData);
            
            // Update the ride with new pricing
            const rides = getRides();
            const rideIndex = rides.findIndex(r => r.id === rideId);
            if (rideIndex !== -1) {
                rides[rideIndex].recalculatedPrice = newPricing.totalPrice;
                rides[rideIndex].priceBreakdown = newPricing.breakdown;
                saveRides(rides);
            }
            
            // Verify and ensure admin notification was created
            const adminNotifications = getAdminNotifications();
            const rescheduleNotification = adminNotifications.find(n => 
                n.type === 'ride_rescheduled' && n.rideId === rideId
            );
            
            if (!rescheduleNotification) {
                // Manually create notification if it wasn't created by rescheduleRide
                console.log('Creating admin notification manually...');
                const date = new Date(newDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                });
                const time = new Date(`2000-01-01T${newTime}`).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                });
                const oldDate = updatedRide.oldDate;
                const oldTime = updatedRide.oldTime;
                const oldDateFormatted = new Date(oldDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                });
                const oldTimeFormatted = new Date(`2000-01-01T${oldTime}`).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                });
                createAdminNotification(
                    'ride_rescheduled',
                    'Ride Rescheduled',
                    `${updatedRide.driverName || 'A driver'} rescheduled a ride: ${updatedRide.pickup} → ${updatedRide.destination} from ${oldDateFormatted} at ${oldTimeFormatted} to ${date} at ${time}`,
                    rideId,
                    currentDriver.username
                );
            }
            
            // Send email to customer
            await sendRescheduleEmail(updatedRide);
            
            // Close modal and reload
            closeRescheduleModal();
            loadRides();
            alert('Ride rescheduled successfully! Customer has been notified via email. Pricing has been recalculated.');
        } else {
            alert('Unable to reschedule ride. Please try again.');
        }
    } catch (error) {
        console.error('Reschedule error:', error);
        alert('An error occurred while rescheduling. Please try again.');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reschedule & Notify Customer';
        }
    }
}

// Send reschedule email to customer
async function sendRescheduleEmail(ride) {
    // Check if EmailJS is initialized
    if (typeof emailjs === 'undefined') {
        console.warn('EmailJS not initialized. Skipping email send.');
        return;
    }
    
    const oldDate = new Date(ride.oldDate).toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
    });
    const oldTime = new Date(`2000-01-01T${ride.oldTime}`).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    const newDate = new Date(ride.date).toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
    });
    const newTime = new Date(`2000-01-01T${ride.time}`).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    
    const templateParams = {
        to_email: ride.email,
        to_name: ride.name,
        pickup: ride.pickup,
        destination: ride.destination,
        old_date: oldDate,
        old_time: oldTime,
        new_date: newDate,
        new_time: newTime,
        driver_name: ride.driverName,
        driver_phone: ride.driverPhone,
        driver_email: ride.driverEmail,
        driver_vehicle: ride.driverVehicle,
        message: `Your ride has been rescheduled!

Original Schedule:
Date: ${oldDate}
Time: ${oldTime}

New Schedule:
Date: ${newDate}
Time: ${newTime}

Ride Details:
Pickup: ${ride.pickup}
Destination: ${ride.destination}

Driver Information:
Name: ${ride.driverName}
Phone: ${ride.driverPhone}
Vehicle: ${ride.driverVehicle}

If you have any questions or concerns about this change, please contact your driver directly. Thank you for your understanding!`
    };
    
    try {
        // Note: You'll need to configure EmailJS with your credentials
        // Replace with your actual service ID and template ID for reschedule emails
        // await emailjs.send(
        //     "YOUR_SERVICE_ID",
        //     "YOUR_RESCHEDULE_TEMPLATE_ID",
        //     templateParams
        // );
        console.log('Reschedule email would be sent:', templateParams);
    } catch (error) {
        console.error('EmailJS Error:', error);
        throw error;
    }
}

// Load rides on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Load current driver from API first
    await loadCurrentDriver();
    
    // Add event listeners for filter dropdowns
    const listFilter = document.getElementById('rideFilter');
    const calendarFilter = document.getElementById('calendarRideFilter');
    
    if (listFilter) {
        listFilter.addEventListener('change', function() {
            console.log('Filter changed to:', this.value);
            // Sync calendar filter
            if (calendarFilter) {
                calendarFilter.value = this.value;
            }
            // Reload rides with new filter
            loadRides();
        });
    }
    
    if (calendarFilter) {
        calendarFilter.addEventListener('change', function() {
            console.log('Filter changed to:', this.value);
            // Sync list filter
            if (listFilter) {
                listFilter.value = this.value;
            }
            // Reload rides with new filter
            loadRides();
        });
    }
    
    // Then load rides
    loadRides();
    
    // Set minimum date for day off input
    const dayOffDateInput = document.getElementById('dayOffDate');
    if (dayOffDateInput) {
        const today = new Date().toISOString().split('T')[0];
        dayOffDateInput.setAttribute('min', today);
    }
    
    // Set minimum date for shift offer input
    const offerShiftDateInput = document.getElementById('offerShiftDate');
    if (offerShiftDateInput) {
        const today = new Date().toISOString().split('T')[0];
        offerShiftDateInput.setAttribute('min', today);
    }
    
    // Connect reschedule form handler
    const rescheduleForm = document.getElementById('rescheduleForm');
    if (rescheduleForm) {
        rescheduleForm.addEventListener('submit', handleReschedule);
    }
    
    // Update notification badge on load
    updateNotificationBadge();
    updateDriverMessagesBadge();
    
    // Check for unconfirmed rides on load
    checkUnconfirmedRides();
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
        if (currentView === 'list' || currentView === 'calendar') {
            loadRides();
        } else if (currentView === 'days-off') {
            loadDaysOff();
        } else if (currentView === 'notifications') {
            loadNotifications();
        }
        updateNotificationBadge();
        checkUnconfirmedRides();
    }, 30000);
});

// Profile Management Functions

// Load profile data
async function loadProfile() {
    if (!currentDriver) {
        return;
    }
    
    // Refresh driver data from API to get latest serviceFee
    await loadCurrentDriver();
    
    // Load driver photo if exists
    const driverPhoto = localStorage.getItem(`driver_photo_${currentDriver.username}`);
    const photoImg = document.getElementById('driverPhoto');
    const photoPlaceholder = document.getElementById('driverPhotoPlaceholder');
    
    if (driverPhoto) {
        photoImg.src = driverPhoto;
        photoImg.style.display = 'block';
        photoPlaceholder.style.display = 'none';
    } else {
        photoImg.style.display = 'none';
        photoPlaceholder.style.display = 'flex';
    }
    
    // Load driver info - try API first, then fallback to local storage
    let driver = currentDriver;
    if (!driver || !driver.serviceFee) {
        const drivers = getDrivers();
        driver = drivers.find(d => d.username === currentDriver.username) || currentDriver;
    }
    
    if (driver) {
        document.getElementById('profileName').value = driver.name || '';
        document.getElementById('profileUsername').value = driver.username || '';
        document.getElementById('profileEmail').value = driver.email || '';
        document.getElementById('profilePhone').value = driver.phone || '';
        
        // Load vehicles (support both old vehicle string and new vehicles array)
        loadVehicles(driver);
    }
    
    // Set current month as default
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('incomeMonth').value = currentMonth;
    
    // Load current month income
    loadMonthlyIncome();
}

// Handle photo upload
function handlePhotoUpload(event) {
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
        localStorage.setItem(`driver_photo_${currentDriver.username}`, photoData);
        
        const photoImg = document.getElementById('driverPhoto');
        const photoPlaceholder = document.getElementById('driverPhotoPlaceholder');
        photoImg.src = photoData;
        photoImg.style.display = 'block';
        photoPlaceholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// Load vehicles for driver profile
function loadVehicles(driver) {
    const vehiclesList = document.getElementById('vehiclesList');
    if (!vehiclesList) return;
    
    // Support both old vehicle string and new vehicles array
    let vehicles = [];
    if (driver.vehicles && Array.isArray(driver.vehicles)) {
        vehicles = driver.vehicles;
    } else if (driver.vehicle) {
        // Convert old vehicle string to array format
        vehicles = [driver.vehicle];
    }
    
    if (vehicles.length === 0) {
        vehiclesList.innerHTML = '<p style="color: #999; font-style: italic; padding: 1rem; background: var(--light-bg); border-radius: 5px;">No vehicles added yet. Add your vehicles below.</p>';
        return;
    }
    
    vehiclesList.innerHTML = vehicles.map((vehicle, index) => {
        // Parse vehicle string (format: "Type - Color Make Model")
        const parts = vehicle.split(' - ');
        const vehicleType = parts[0] || vehicle;
        const vehicleDetails = parts[1] || '';
        
        return `
            <div style="display: flex; align-items: center; gap: 1rem; background: var(--light-bg); padding: 1rem; border-radius: 5px; margin-bottom: 0.5rem;">
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: var(--primary-color);">${vehicleType}</div>
                    ${vehicleDetails ? `<div style="font-size: 0.9rem; color: #666;">${vehicleDetails}</div>` : ''}
                </div>
                <button type="button" onclick="removeVehicle(${index})" style="padding: 0.5rem 1rem; background: var(--error-color); color: var(--white); border: none; border-radius: 5px; cursor: pointer; font-size: 0.85rem;">Remove</button>
            </div>
        `;
    }).join('');
}

// Add vehicle
function addVehicle() {
    const vehicleType = document.getElementById('newVehicleType').value;
    const vehicleDetails = document.getElementById('newVehicleDetails').value.trim();
    
    if (!vehicleType) {
        alert('Please select a vehicle type');
        return;
    }
    
    if (!currentDriver) {
        alert('Driver not found');
        return;
    }
    
    const drivers = getDrivers();
    const driverIndex = drivers.findIndex(d => d.username === currentDriver.username);
    
    if (driverIndex === -1) {
        alert('Driver not found');
        return;
    }
    
    // Initialize vehicles array if it doesn't exist
    if (!drivers[driverIndex].vehicles || !Array.isArray(drivers[driverIndex].vehicles)) {
        // Convert old vehicle string to array if it exists
        if (drivers[driverIndex].vehicle) {
            drivers[driverIndex].vehicles = [drivers[driverIndex].vehicle];
        } else {
            drivers[driverIndex].vehicles = [];
        }
    }
    
    // Create vehicle string
    const vehicleString = vehicleDetails ? `${vehicleType} - ${vehicleDetails}` : vehicleType;
    
    // Check if vehicle already exists
    if (drivers[driverIndex].vehicles.includes(vehicleString)) {
        alert('This vehicle is already in your list');
        return;
    }
    
    // Add vehicle
    drivers[driverIndex].vehicles.push(vehicleString);
    
    // Save drivers
    localStorage.setItem('drivers', JSON.stringify(drivers));
    
    // Update current driver
    currentDriver = drivers[driverIndex];
    setCurrentDriver(currentDriver);
    
    // Reload vehicles list
    loadVehicles(currentDriver);
    
    // Reload rides to update accept button states
    if (currentView === 'list' || currentView === 'calendar') {
        loadRides();
    }
    
    // Clear inputs
    document.getElementById('newVehicleType').value = '';
    document.getElementById('newVehicleDetails').value = '';
}

// Remove vehicle
function removeVehicle(index) {
    if (!confirm('Remove this vehicle from your list?')) {
        return;
    }
    
    if (!currentDriver) {
        alert('Driver not found');
        return;
    }
    
    const drivers = getDrivers();
    const driverIndex = drivers.findIndex(d => d.username === currentDriver.username);
    
    if (driverIndex === -1) {
        alert('Driver not found');
        return;
    }
    
    // Initialize vehicles array if it doesn't exist
    if (!drivers[driverIndex].vehicles || !Array.isArray(drivers[driverIndex].vehicles)) {
        if (drivers[driverIndex].vehicle) {
            drivers[driverIndex].vehicles = [drivers[driverIndex].vehicle];
        } else {
            drivers[driverIndex].vehicles = [];
        }
    }
    
    // Remove vehicle
    drivers[driverIndex].vehicles.splice(index, 1);
    
    // Save drivers
    localStorage.setItem('drivers', JSON.stringify(drivers));
    
    // Update current driver
    currentDriver = drivers[driverIndex];
    setCurrentDriver(currentDriver);
    
    // Reload vehicles list
    loadVehicles(currentDriver);
    
    // Reload rides to update accept button states
    if (currentView === 'list' || currentView === 'calendar') {
        loadRides();
    }
}

// Update profile
function updateProfile(event) {
    event.preventDefault();
    
    if (!currentDriver) {
        alert('Driver not found');
        return;
    }
    
    const messageDiv = document.getElementById('profileMessage');
    messageDiv.style.display = 'none';
    
    const email = document.getElementById('profileEmail').value;
    const phone = document.getElementById('profilePhone').value;
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Update driver info
    const drivers = getDrivers();
    const driverIndex = drivers.findIndex(d => d.username === currentDriver.username);
    
    if (driverIndex === -1) {
        alert('Driver not found');
        return;
    }
    
    // Update email and phone
    drivers[driverIndex].email = email;
    drivers[driverIndex].phone = phone;
    
    // Update password if provided
    if (currentPassword || newPassword || confirmPassword) {
        if (!currentPassword) {
            messageDiv.textContent = 'Please enter your current password';
            messageDiv.style.display = 'block';
            messageDiv.style.background = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.style.border = '1px solid #f5c6cb';
            return;
        }
        
        if (drivers[driverIndex].password !== currentPassword) {
            messageDiv.textContent = 'Current password is incorrect';
            messageDiv.style.display = 'block';
            messageDiv.style.background = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.style.border = '1px solid #f5c6cb';
            return;
        }
        
        if (!newPassword) {
            messageDiv.textContent = 'Please enter a new password';
            messageDiv.style.display = 'block';
            messageDiv.style.background = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.style.border = '1px solid #f5c6cb';
            return;
        }
        
        if (newPassword !== confirmPassword) {
            messageDiv.textContent = 'New passwords do not match';
            messageDiv.style.display = 'block';
            messageDiv.style.background = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.style.border = '1px solid #f5c6cb';
            return;
        }
        
        if (newPassword.length < 6) {
            messageDiv.textContent = 'New password must be at least 6 characters';
            messageDiv.style.display = 'block';
            messageDiv.style.background = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.style.border = '1px solid #f5c6cb';
            return;
        }
        
        drivers[driverIndex].password = newPassword;
    }
    
    // Save updated drivers
    localStorage.setItem('drivers', JSON.stringify(drivers));
    
    // Update current driver session
    currentDriver = drivers[driverIndex];
    setCurrentDriver(currentDriver);
    
    // Update driver name in header
    const driverNameEl = document.getElementById('driverName');
    if (driverNameEl) {
        driverNameEl.textContent = currentDriver.name;
    }
    
    // Clear password fields
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    
    // Show success message
    messageDiv.textContent = 'Profile updated successfully!';
    messageDiv.className = 'success';
    messageDiv.style.display = 'block';
    messageDiv.style.background = '#d4edda';
    messageDiv.style.color = '#155724';
    messageDiv.style.border = '1px solid #c3e6cb';
}

// Load monthly income
async function loadMonthlyIncome() {
    if (!currentDriver) {
        return;
    }
    
    // Refresh driver data from API to get latest serviceFee
    await loadCurrentDriver();
    
    const monthInput = document.getElementById('incomeMonth');
    const monthValue = monthInput.value;
    
    if (!monthValue) {
        document.getElementById('monthlyIncomeDisplay').innerHTML = '<p style="color: #666;">Please select a month</p>';
        return;
    }
    
    const [year, month] = monthValue.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);
    
    // Get all rides for this driver in the selected month
    const rides = getRides();
    const driverRides = rides.filter(ride => 
        ride.driverId === currentDriver.username &&
        (ride.status === 'accepted' || ride.status === 'completed') &&
        ride.acceptedAt &&
        new Date(ride.acceptedAt) >= startDate &&
        new Date(ride.acceptedAt) <= endDate
    );
    
    // Separate expected (accepted) vs confirmed (completed) rides
    const expectedRides = driverRides.filter(ride => ride.status === 'accepted');
    const confirmedRides = driverRides.filter(ride => ride.status === 'completed');
    
    // Calculate expected income (accepted but not completed)
    let expectedIncome = 0;
    const expectedDetails = [];
    
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
        
        const date = new Date(ride.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        const time = new Date(`2000-01-01T${ride.time}`).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        
        expectedDetails.push({
            date: date,
            time: time,
            pickup: ride.pickup,
            destination: ride.destination,
            price: pricing.totalPrice,
            passengers: ride.passengers,
            status: 'Expected'
        });
    });
    
    // Calculate confirmed income (completed)
    let confirmedIncome = 0;
    const confirmedDetails = [];
    
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
        
        const date = new Date(ride.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        const time = new Date(`2000-01-01T${ride.time}`).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        
        confirmedDetails.push({
            date: date,
            time: time,
            pickup: ride.pickup,
            destination: ride.destination,
            price: pricing.totalPrice,
            passengers: ride.passengers,
            status: 'Confirmed'
        });
    });
    
    // Calculate totals
    const totalIncome = expectedIncome + confirmedIncome;
    
    // Get driver's service fee from currentDriver or drivers list, default to 15% if not set
    let serviceFeePercent = 15;
    if (currentDriver && currentDriver.serviceFee !== undefined) {
        serviceFeePercent = currentDriver.serviceFee;
    } else {
        // Try to get from drivers list
        const drivers = getDrivers();
        const driver = drivers.find(d => d.username === currentDriver?.username);
        if (driver && driver.serviceFee !== undefined) {
            serviceFeePercent = driver.serviceFee;
        }
    }
    const serviceFeeDecimal = serviceFeePercent / 100;
    
    // Calculate commission using driver's individual service fee
    const expectedCommission = expectedIncome * serviceFeeDecimal;
    const confirmedCommission = confirmedIncome * serviceFeeDecimal;
    const totalCommission = expectedCommission + confirmedCommission;
    
    // Net income calculations
    const expectedNetIncome = expectedIncome - expectedCommission;
    const confirmedNetIncome = confirmedIncome - confirmedCommission;
    const totalNetIncome = totalIncome - totalCommission;
    
    // Combine ride details for display, sorted by date/time (soonest first)
    const rideDetails = [...expectedDetails, ...confirmedDetails].sort((a, b) => {
        // Parse the formatted date string back to Date object for comparison
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        // If dates are the same, sort by time
        if (dateA.getTime() === dateB.getTime()) {
            const timeA = a.time ? new Date(`2000-01-01T${a.time}`).getTime() : 0;
            const timeB = b.time ? new Date(`2000-01-01T${b.time}`).getTime() : 0;
            return timeA - timeB;
        }
        return dateA - dateB; // Ascending: soonest first
    });
    
    // Display income statement
    const monthName = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const displayDiv = document.getElementById('monthlyIncomeDisplay');
    
    if (driverRides.length === 0) {
        displayDiv.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #666;">
                <p>No rides in ${monthName}</p>
            </div>
        `;
        return;
    }
    
    displayDiv.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Income Summary for ${monthName}</h3>
            
            <!-- Expected Income Section -->
            <div style="background: #fff3cd; padding: 1.5rem; border-radius: 5px; border: 2px solid #ffc107; margin-bottom: 1rem;">
                <h4 style="color: #856404; margin-bottom: 1rem; font-size: 1.1rem; font-weight: 700;">Expected Income (Incomplete Rides)</h4>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <span style="font-size: 1rem; font-weight: 600; color: #856404;">Expected Income:</span>
                    <span style="font-size: 1.3rem; font-weight: 700; color: #856404;">${formatPrice(expectedIncome)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <span style="color: #856404;">Rides (Accepted):</span>
                    <span style="font-weight: 600; color: #856404;">${expectedRides.length}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <span style="font-size: 0.9rem; font-weight: 600; color: #856404;">Expected Service Fee (${serviceFeePercent}%):</span>
                    <span style="font-size: 1.1rem; font-weight: 700; color: #856404;">${formatPrice(expectedCommission)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.9rem; font-weight: 600; color: #856404;">Expected Net Income:</span>
                    <span style="font-size: 1.1rem; font-weight: 700; color: #856404;">${formatPrice(expectedNetIncome)}</span>
                </div>
            </div>

            <!-- Confirmed Income Section -->
            <div style="background: #d4edda; padding: 1.5rem; border-radius: 5px; border: 2px solid #28a745; margin-bottom: 1rem;">
                <h4 style="color: #155724; margin-bottom: 1rem; font-size: 1.1rem; font-weight: 700;">Confirmed Income (Completed Rides)</h4>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <span style="font-size: 1rem; font-weight: 600; color: #155724;">Confirmed Income:</span>
                    <span style="font-size: 1.3rem; font-weight: 700; color: #155724;">${formatPrice(confirmedIncome)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <span style="color: #155724;">Rides (Completed):</span>
                    <span style="font-weight: 600; color: #155724;">${confirmedRides.length}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <span style="font-size: 0.9rem; font-weight: 600; color: #155724;">Confirmed Service Fee (${serviceFeePercent}%):</span>
                    <span style="font-size: 1.1rem; font-weight: 700; color: #155724;">${formatPrice(confirmedCommission)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.9rem; font-weight: 600; color: #155724;">Confirmed Net Income:</span>
                    <span style="font-size: 1.1rem; font-weight: 700; color: #155724;">${formatPrice(confirmedNetIncome)}</span>
                </div>
            </div>

            <!-- Total Summary -->
            <div style="background: var(--light-bg); padding: 1.5rem; border-radius: 5px; margin-bottom: 1rem;">
                <h4 style="color: var(--primary-color); margin-bottom: 1rem; font-size: 1.1rem; font-weight: 700;">Total Summary</h4>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <span style="font-size: 1.1rem; font-weight: 600; color: var(--primary-color);">Total Income (Gross):</span>
                    <span style="font-size: 1.5rem; font-weight: 700; color: var(--accent-color);">${formatPrice(totalIncome)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span style="color: #666;">Total Rides:</span>
                    <span style="font-weight: 600; color: var(--primary-color);">${driverRides.length}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <span style="color: #666;">Average per Ride:</span>
                    <span style="font-weight: 600; color: var(--primary-color);">${driverRides.length > 0 ? formatPrice(totalIncome / driverRides.length) : '$0.00'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; padding-top: 0.75rem; border-top: 1px solid #ddd;">
                    <span style="font-size: 0.95rem; font-weight: 600; color: #856404;">Total Service Fee (${serviceFeePercent}%):</span>
                    <span style="font-size: 1.2rem; font-weight: 700; color: #856404;">${formatPrice(totalCommission)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.75rem; border-top: 2px solid var(--primary-color);">
                    <span style="font-size: 1.2rem; font-weight: 700; color: #155724;">Your Total Net Income:</span>
                    <span style="font-size: 1.8rem; font-weight: 700; color: #155724;">${formatPrice(totalNetIncome)}</span>
                </div>
            </div>
        </div>
        
        <div>
            <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Ride Details</h3>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: var(--light-bg);">
                            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--primary-color); color: var(--primary-color);">Date</th>
                            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--primary-color); color: var(--primary-color);">Time</th>
                            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--primary-color); color: var(--primary-color);">Route</th>
                            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid var(--primary-color); color: var(--primary-color);">Passengers</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid var(--primary-color); color: var(--primary-color);">Status</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid var(--primary-color); color: var(--primary-color);">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rideDetails.map(ride => `
                            <tr style="border-bottom: 1px solid var(--light-bg);">
                                <td style="padding: 0.75rem;">${ride.date}</td>
                                <td style="padding: 0.75rem;">${ride.time}</td>
                                <td style="padding: 0.75rem;">${ride.pickup} → ${ride.destination}</td>
                                <td style="padding: 0.75rem;">${ride.passengers}</td>
                                <td style="padding: 0.75rem; text-align: center;">
                                    <span style="padding: 0.25rem 0.5rem; border-radius: 3px; font-size: 0.85rem; font-weight: 600; ${ride.status === 'Confirmed' ? 'background: #d4edda; color: #155724;' : 'background: #fff3cd; color: #856404;'}">${ride.status}</span>
                                </td>
                                <td style="padding: 0.75rem; text-align: right; font-weight: 600; color: var(--accent-color);">${formatPrice(ride.price)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="background: var(--light-bg); font-weight: 700;">
                            <td colspan="5" style="padding: 0.75rem; text-align: right; color: var(--primary-color);">Total:</td>
                            <td style="padding: 0.75rem; text-align: right; color: var(--accent-color);">${formatPrice(totalIncome)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    `;
}

// Driver Messages Functions
let currentDriverChatWith = null;

async function loadDriverMessages() {
    if (!currentDriver) return;
    
    const conversationsList = document.getElementById('driverConversationsList');
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
        conversations = getUserConversations(currentDriver.username);
    }
    
    if (conversations.length === 0) {
        conversationsList.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">No team members available.</p>';
        const chatMessages = document.getElementById('driverChatMessages');
        if (chatMessages) {
            chatMessages.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">Select a conversation to start messaging</p>';
        }
        return;
    }
    
    conversationsList.innerHTML = conversations.map(conv => {
        const hasMessages = conv.lastMessage !== null;
        const lastMsgDate = hasMessages ? new Date(conv.lastMessage.timestamp) : null;
        const timeStr = lastMsgDate ? lastMsgDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '';
        const dateStr = lastMsgDate ? lastMsgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
        const isToday = lastMsgDate ? new Date().toDateString() === lastMsgDate.toDateString() : false;
        
        const unreadBadge = conv.unreadCount > 0 
            ? `<span style="background: var(--error-color); color: white; border-radius: 50%; padding: 0.2rem 0.5rem; font-size: 0.75rem; margin-left: auto;">${conv.unreadCount}</span>`
            : '';
        
        return `
            <div class="conversation-item" onclick="openDriverConversation('${conv.username}', '${conv.name}')" style="padding: 1rem; background: ${currentDriverChatWith === conv.username ? '#e7f3ff' : 'var(--white)'}; border: 2px solid ${currentDriverChatWith === conv.username ? 'var(--primary-color)' : '#e0e0e0'}; border-radius: 5px; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 0.75rem;">
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
    if (currentDriverChatWith) {
        openDriverConversation(currentDriverChatWith, conversations.find(c => c.username === currentDriverChatWith)?.name || '');
    }
}

async function openDriverConversation(username, name) {
    if (!currentDriver) return;
    
    currentDriverChatWith = username;
    
    // Update header
    const chatHeader = document.getElementById('driverChatHeader');
    if (chatHeader) {
        chatHeader.innerHTML = `<h3 style="color: var(--primary-color); margin: 0;">${name}</h3>`;
    }
    
    // Show input area
    const chatInputArea = document.getElementById('driverChatInputArea');
    if (chatInputArea) {
        chatInputArea.style.display = 'block';
    }
    const chatWithUsername = document.getElementById('driverChatWithUsername');
    if (chatWithUsername) {
        chatWithUsername.value = username;
    }
    
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
        messages = getConversation(currentDriver.username, username);
        markConversationAsRead(currentDriver.username, username);
    }
    
    const chatMessages = document.getElementById('driverChatMessages');
    if (!chatMessages) return;
    
    if (messages.length === 0) {
        chatMessages.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">No messages yet. Start the conversation!</p>';
    } else {
        chatMessages.innerHTML = messages.map(msg => {
            const isFromMe = msg.fromUsername === currentDriver.username;
            const msgDate = new Date(msg.timestamp);
            const timeStr = msgDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            
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
    loadDriverMessages();
    
    // Update badge
    updateDriverMessagesBadge();
}

// Handle driver message form submission
document.addEventListener('DOMContentLoaded', function() {
    const driverMessageForm = document.getElementById('driverMessageForm');
    if (driverMessageForm) {
        driverMessageForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!currentDriver) return;
            
            const toUsername = document.getElementById('driverChatWithUsername').value;
            const messageText = document.getElementById('driverMessageInput').value.trim();
            
            if (!messageText || !toUsername) return;
            
            // Get recipient name (could be admin or another driver)
            let recipientName = toUsername;
            const admins = getAdmins();
            const admin = admins.find(a => a.username === toUsername);
            if (admin) {
                recipientName = admin.name;
            } else {
                const drivers = getDrivers();
                const driver = drivers.find(d => d.username === toUsername);
                if (driver) {
                    recipientName = driver.name;
                }
            }
            
            // Send message using API
            if (typeof API !== 'undefined' && API.messages) {
                try {
                    await API.messages.send(toUsername, recipientName, messageText);
                    // Clear input
                    document.getElementById('driverMessageInput').value = '';
                    // Reload conversation
                    openDriverConversation(toUsername, recipientName);
                    // Update badge
                    updateDriverMessagesBadge();
                } catch (error) {
                    console.error('Error sending message:', error);
                    alert('Error sending message. Please try again.');
                }
            } else {
                // Fallback to local storage
                sendMessage(currentDriver.username, currentDriver.name, toUsername, recipientName, messageText);
                // Clear input
                document.getElementById('driverMessageInput').value = '';
                // Reload conversation
                openDriverConversation(toUsername, recipientName);
                // Update badge
                updateDriverMessagesBadge();
            }
        });
    }
});

function updateDriverMessagesBadge() {
    if (!currentDriver) return;
    
    const unreadCount = getUnreadMessageCount(currentDriver.username);
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
    updateDriverGroupChatBadge();
}

// Switch between direct messages and group chat (driver)
let currentDriverMessageView = 'direct';
let driverGroupChatInterval = null;

function switchDriverMessageView(view) {
    currentDriverMessageView = view;
    const directView = document.getElementById('driverDirectMessagesView');
    const groupView = document.getElementById('driverGroupChatView');
    const directBtn = document.getElementById('btn-driverDirectMessages');
    const groupBtn = document.getElementById('btn-driverGroupChat');
    
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
        loadDriverGroupMessages();
        // Start auto-refresh for group chat
        if (driverGroupChatInterval) clearInterval(driverGroupChatInterval);
        driverGroupChatInterval = setInterval(loadDriverGroupMessages, 3000); // Refresh every 3 seconds
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
        if (driverGroupChatInterval) {
            clearInterval(driverGroupChatInterval);
            driverGroupChatInterval = null;
        }
    }
}

// Load group messages (driver)
async function loadDriverGroupMessages() {
    if (!currentDriver || typeof API === 'undefined' || !API.messages) return;
    
    const container = document.getElementById('driverGroupChatMessages');
    if (!container) return;
    
    try {
        const messages = await API.messages.getGroup(100);
        
        if (messages.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #666; padding: 2rem;">No messages yet. Start the conversation!</div>';
            return;
        }
        
        container.innerHTML = messages.map(msg => {
            const isOwnMessage = msg.fromUsername === currentDriver.username;
            const timestamp = new Date(msg.timestamp).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
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

// Send group message (driver)
async function sendDriverGroupMessage(messageText) {
    if (!currentDriver || typeof API === 'undefined' || !API.messages) return;
    
    if (!messageText || !messageText.trim()) return;
    
    try {
        await API.messages.sendGroup(messageText.trim());
        // Reload messages
        loadDriverGroupMessages();
        // Update badge
        updateDriverGroupChatBadge();
    } catch (error) {
        console.error('Error sending group message:', error);
        alert('Error sending message. Please try again.');
    }
}

// Update group chat badge (driver)
async function updateDriverGroupChatBadge() {
    if (!currentDriver || typeof API === 'undefined' || !API.messages) return;
    
    try {
        const response = await API.messages.getGroupUnreadCount();
        const badge = document.getElementById('driverGroupChatBadge');
        
        if (badge) {
            if (response.count > 0) {
                badge.textContent = response.count;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error updating group chat badge:', error);
    }
}

// Handle driver group message form submission
document.addEventListener('DOMContentLoaded', function() {
    const driverGroupMessageForm = document.getElementById('driverGroupMessageForm');
    if (driverGroupMessageForm) {
        driverGroupMessageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!currentDriver) return;
            
            const messageText = document.getElementById('driverGroupMessageInput').value.trim();
            if (!messageText) return;
            
            sendDriverGroupMessage(messageText);
            
            // Clear input
            document.getElementById('driverGroupMessageInput').value = '';
        });
    }
    
    // Update group chat badge on load
    updateDriverGroupChatBadge();
});

// Expose functions to global scope for HTML handlers
window.loadMonthlyIncome = loadMonthlyIncome;
window.loadProfile = loadProfile;

// ========== Manual Ride Entry Functions ==========

// Set minimum date for add ride form and add event listeners
document.addEventListener('DOMContentLoaded', function() {
    const addRideDateInput = document.getElementById('addRideDate');
    if (addRideDateInput) {
        const today = new Date().toISOString().split('T')[0];
        addRideDateInput.setAttribute('min', today);
        addRideDateInput.addEventListener('change', function() {
            if (document.getElementById('addRideAssignSelf').checked) {
                checkAddRideConflict();
            }
        });
    }
    
    const addRideTimeInput = document.getElementById('addRideTime');
    if (addRideTimeInput) {
        addRideTimeInput.addEventListener('change', function() {
            if (document.getElementById('addRideAssignSelf').checked) {
                checkAddRideConflict();
            }
        });
    }
});

// Handle location change for add ride form
function handleAddRideLocationChange(locationType) {
    const prefix = 'addRide';
    const locationSelect = document.getElementById(prefix + (locationType === 'pickup' ? 'Pickup' : 'Destination'));
    const otherAddressDiv = document.getElementById(prefix + (locationType === 'pickup' ? 'Pickup' : 'Destination') + 'OtherAddress');
    const homeAddressDiv = document.getElementById(prefix + (locationType === 'pickup' ? 'Pickup' : 'Destination') + 'HomeAddress');
    
    if (!locationSelect) return;
    
    const selectedValue = locationSelect.value;
    
    // Handle "Other" option
    if (otherAddressDiv) {
        if (selectedValue === 'Other') {
            otherAddressDiv.style.display = 'block';
            const streetInput = document.getElementById(prefix + (locationType === 'pickup' ? 'Pickup' : 'Destination') + 'Street');
            const cityInput = document.getElementById(prefix + (locationType === 'pickup' ? 'Pickup' : 'Destination') + 'City');
            const stateInput = document.getElementById(prefix + (locationType === 'pickup' ? 'Pickup' : 'Destination') + 'State');
            const zipInput = document.getElementById(prefix + (locationType === 'pickup' ? 'Pickup' : 'Destination') + 'Zip');
            
            if (streetInput) streetInput.required = true;
            if (cityInput) cityInput.required = true;
            if (stateInput) stateInput.required = true;
            if (zipInput) zipInput.required = true;
        } else {
            otherAddressDiv.style.display = 'none';
            const streetInput = document.getElementById(prefix + (locationType === 'pickup' ? 'Pickup' : 'Destination') + 'Street');
            const cityInput = document.getElementById(prefix + (locationType === 'pickup' ? 'Pickup' : 'Destination') + 'City');
            const stateInput = document.getElementById(prefix + (locationType === 'pickup' ? 'Pickup' : 'Destination') + 'State');
            const zipInput = document.getElementById(prefix + (locationType === 'pickup' ? 'Pickup' : 'Destination') + 'Zip');
            
            if (streetInput) { streetInput.required = false; streetInput.value = ''; }
            if (cityInput) { cityInput.required = false; cityInput.value = ''; }
            if (stateInput) { stateInput.required = false; stateInput.value = ''; }
            if (zipInput) { zipInput.required = false; zipInput.value = ''; }
        }
    }
    
    // Handle "Home" option
    if (homeAddressDiv) {
        if (selectedValue === 'Home') {
            homeAddressDiv.style.display = 'block';
            const streetInput = document.getElementById(prefix + (locationType === 'pickup' ? 'Pickup' : 'Destination') + 'HomeStreet');
            const cityInput = document.getElementById(prefix + (locationType === 'pickup' ? 'Pickup' : 'Destination') + 'HomeCity');
            const stateInput = document.getElementById(prefix + (locationType === 'pickup' ? 'Pickup' : 'Destination') + 'HomeState');
            const zipInput = document.getElementById(prefix + (locationType === 'pickup' ? 'Pickup' : 'Destination') + 'HomeZip');
            
            if (streetInput) streetInput.required = true;
            if (cityInput) cityInput.required = true;
            if (stateInput) stateInput.required = true;
            if (zipInput) zipInput.required = true;
        } else {
            homeAddressDiv.style.display = 'none';
            const streetInput = document.getElementById(prefix + (locationType === 'pickup' ? 'Pickup' : 'Destination') + 'HomeStreet');
            const cityInput = document.getElementById(prefix + (locationType === 'pickup' ? 'Pickup' : 'Destination') + 'HomeCity');
            const stateInput = document.getElementById(prefix + (locationType === 'pickup' ? 'Pickup' : 'Destination') + 'HomeState');
            const zipInput = document.getElementById(prefix + (locationType === 'pickup' ? 'Pickup' : 'Destination') + 'HomeZip');
            
            if (streetInput) { streetInput.required = false; streetInput.value = ''; }
            if (cityInput) { cityInput.required = false; cityInput.value = ''; }
            if (stateInput) { stateInput.required = false; stateInput.value = ''; }
            if (zipInput) { zipInput.required = false; zipInput.value = ''; }
        }
    }
    
    // Check pickup location for baggage claim
    if (locationType === 'pickup') {
        checkAddRidePickupLocation();
    }
}

// Check if add ride pickup location is an airport
function checkAddRidePickupLocation() {
    const pickupSelect = document.getElementById('addRidePickup');
    const pickupOtherStreetInput = document.getElementById('addRidePickupStreet');
    const pickupHomeStreetInput = document.getElementById('addRidePickupHomeStreet');
    const baggageClaimGroup = document.getElementById('addRideBaggageClaimGroup');
    const baggageClaim = document.getElementById('addRideBaggageClaim');
    
    if (!pickupSelect || !baggageClaimGroup) return;
    
    let pickupValue = pickupSelect.value;
    if (pickupValue === 'Other' && pickupOtherStreetInput) {
        pickupValue = pickupOtherStreetInput.value;
    } else if (pickupValue === 'Home' && pickupHomeStreetInput) {
        pickupValue = pickupHomeStreetInput.value;
    }
    
    const pickupValueLower = pickupValue.toLowerCase().trim();
    
    const excludedLocations = ['cbx', 'cross border', 'long beach cruise terminal', 'cruise terminal'];
    const isExcluded = excludedLocations.some(excluded => pickupValueLower.includes(excluded));
    
    if (isExcluded) {
        baggageClaimGroup.style.display = 'none';
        if (baggageClaim) baggageClaim.checked = false;
        return;
    }
    
    const airportKeywords = [
        'airport', 'sna', 'lax', 'san', 'lgb', 'ont',
        'john wayne', 'los angeles', 'san diego',
        'ontario', 'orange county airport',
        'john wayne airport', 'los angeles airport', 'san diego airport',
        'long beach airport', 'ontario airport'
    ];
    
    const isAirport = airportKeywords.some(keyword => pickupValueLower.includes(keyword));
    
    if (isAirport) {
        baggageClaimGroup.style.display = 'block';
    } else {
        baggageClaimGroup.style.display = 'none';
        if (baggageClaim) baggageClaim.checked = false;
    }
}

// Toggle flight info for add ride form
function toggleAddRideFlightInfo() {
    const isAirportTrip = document.getElementById('addRideIsAirportTrip').checked;
    const flightInfoSection = document.getElementById('addRideFlightInfoSection');
    const flightNumber = document.getElementById('addRideFlightNumber');
    const airline = document.getElementById('addRideAirline');
    const baggageClaimGroup = document.getElementById('addRideBaggageClaimGroup');
    
    if (isAirportTrip) {
        if (flightInfoSection) flightInfoSection.style.display = 'block';
        checkAddRidePickupLocation();
    } else {
        if (flightInfoSection) flightInfoSection.style.display = 'none';
        if (flightNumber) flightNumber.value = '';
        if (airline) airline.value = '';
        if (baggageClaimGroup) baggageClaimGroup.style.display = 'none';
    }
}

// Update vehicle type options for add ride form
function updateAddRideVehicleTypeOptions() {
    const passengersInput = document.getElementById('addRidePassengers');
    const vehicleTypeSelect = document.getElementById('addRideVehicleType');
    
    if (!passengersInput || !vehicleTypeSelect) return;
    
    const passengerCount = parseInt(passengersInput.value) || 0;
    const sedanOption = vehicleTypeSelect.querySelector('option[value="Sedans"]');
    const suvOption = vehicleTypeSelect.querySelector('option[value="SUV"]');
    const xlSuvOption = vehicleTypeSelect.querySelector('option[value="XL SUV"]');
    
    // Reset all options
    if (sedanOption) { sedanOption.disabled = false; sedanOption.style.display = 'block'; }
    if (suvOption) { suvOption.disabled = false; suvOption.style.display = 'block'; }
    if (xlSuvOption) { xlSuvOption.disabled = false; xlSuvOption.style.display = 'block'; }
    
    if (passengerCount > 4) {
        // 5-6 passengers: Only XL SUV
        if (sedanOption) { sedanOption.disabled = true; sedanOption.style.display = 'none'; }
        if (suvOption) { suvOption.disabled = true; suvOption.style.display = 'none'; }
        if (vehicleTypeSelect.value === '' || vehicleTypeSelect.value === 'Sedans' || vehicleTypeSelect.value === 'SUV') {
            vehicleTypeSelect.value = 'XL SUV';
        }
    } else if (passengerCount === 4) {
        // 4 passengers: Only SUV and XL SUV
        if (sedanOption) { sedanOption.disabled = true; sedanOption.style.display = 'none'; }
        if (vehicleTypeSelect.value === 'Sedans') {
            vehicleTypeSelect.value = '';
        }
    }
}

// Check for conflicts when driver selects themselves
function checkAddRideConflict() {
    const conflictMessage = document.getElementById('addRideConflictMessage');
    const assignSelf = document.getElementById('addRideAssignSelf').checked;
    
    if (!assignSelf) {
        conflictMessage.style.display = 'none';
        return;
    }
    
    if (!currentDriver) {
        conflictMessage.style.display = 'block';
        conflictMessage.style.background = '#f8d7da';
        conflictMessage.style.color = '#721c24';
        conflictMessage.textContent = 'Error: Driver information not loaded.';
        return;
    }
    
    // Get form data
    const date = document.getElementById('addRideDate').value;
    const time = document.getElementById('addRideTime').value;
    
    if (!date || !time) {
        conflictMessage.style.display = 'none';
        return;
    }
    
    // Create a temporary ride object for conflict checking
    const tempRide = {
        id: 'temp',
        date: date,
        time: time,
        pickup: document.getElementById('addRidePickup').value,
        destination: document.getElementById('addRideDestination').value,
        vehicleType: document.getElementById('addRideVehicleType').value,
        passengers: parseInt(document.getElementById('addRidePassengers').value) || 0
    };
    
    // Use existing conflict checking function
    const conflictCheck = canDriverAcceptRideWithRestrictions(tempRide);
    
    if (!conflictCheck.canAccept) {
        conflictMessage.style.display = 'block';
        conflictMessage.style.background = '#fff3cd';
        conflictMessage.style.color = '#856404';
        conflictMessage.textContent = `⚠️ ${conflictCheck.reason}`;
    } else {
        conflictMessage.style.display = 'block';
        conflictMessage.style.background = '#d4edda';
        conflictMessage.style.color = '#155724';
        conflictMessage.textContent = '✓ No conflicts found. You can assign this ride to yourself.';
    }
}

// Handle add ride form submission
async function handleAddRide(event) {
    event.preventDefault();
    
    const messageDiv = document.getElementById('addRideMessage');
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';
    messageDiv.style.display = 'none';
    
    try {
        // Get form data
        const name = document.getElementById('addRideName').value.trim();
        const email = document.getElementById('addRideEmail').value.trim();
        const phone = document.getElementById('addRidePhone').value.trim();
        const pickup = document.getElementById('addRidePickup').value;
        const destination = document.getElementById('addRideDestination').value;
        const date = document.getElementById('addRideDate').value;
        const time = document.getElementById('addRideTime').value;
        const passengers = parseInt(document.getElementById('addRidePassengers').value) || 0;
        const vehicleType = document.getElementById('addRideVehicleType').value;
        const isAirportTrip = document.getElementById('addRideIsAirportTrip').checked;
        const flightNumber = isAirportTrip ? document.getElementById('addRideFlightNumber').value.trim() : '';
        const airline = isAirportTrip ? document.getElementById('addRideAirline').value.trim() : '';
        const baggageClaim = document.getElementById('addRideBaggageClaim').checked;
        const assignSelf = document.getElementById('addRideAssignSelf').checked;
        
        // Validate
        if (passengers > 6) {
            throw new Error('Maximum 6 passengers per ride.');
        }
        
        if (passengers > 4 && vehicleType !== 'XL SUV') {
            throw new Error('For 5 or more passengers, XL SUV is required.');
        }
        
        // Get actual pickup and destination values
        let actualPickup = pickup;
        let pickupAddress = null;
        
        if (pickup === 'Other') {
            const street = document.getElementById('addRidePickupStreet').value.trim();
            const city = document.getElementById('addRidePickupCity').value.trim();
            const state = document.getElementById('addRidePickupState').value.trim();
            const zip = document.getElementById('addRidePickupZip').value.trim();
            
            if (!street || !city || !state || !zip) {
                throw new Error('Please fill in all pickup address fields.');
            }
            
            actualPickup = `${street}, ${city}, ${state} ${zip}`;
            pickupAddress = { street, city, state, zip };
        } else if (pickup === 'Home') {
            const street = document.getElementById('addRidePickupHomeStreet').value.trim();
            const city = document.getElementById('addRidePickupHomeCity').value.trim();
            const state = document.getElementById('addRidePickupHomeState').value.trim();
            const zip = document.getElementById('addRidePickupHomeZip').value.trim();
            
            if (!street || !city || !state || !zip) {
                throw new Error('Please fill in all pickup address fields.');
            }
            
            actualPickup = `${street}, ${city}, ${state} ${zip}`;
            pickupAddress = { street, city, state, zip };
        }
        
        let actualDestination = destination;
        let destinationAddress = null;
        
        if (destination === 'Other') {
            const street = document.getElementById('addRideDestinationStreet').value.trim();
            const city = document.getElementById('addRideDestinationCity').value.trim();
            const state = document.getElementById('addRideDestinationState').value.trim();
            const zip = document.getElementById('addRideDestinationZip').value.trim();
            
            if (!street || !city || !state || !zip) {
                throw new Error('Please fill in all destination address fields.');
            }
            
            actualDestination = `${street}, ${city}, ${state} ${zip}`;
            destinationAddress = { street, city, state, zip };
        } else if (destination === 'Home') {
            const street = document.getElementById('addRideDestinationHomeStreet').value.trim();
            const city = document.getElementById('addRideDestinationHomeCity').value.trim();
            const state = document.getElementById('addRideDestinationHomeState').value.trim();
            const zip = document.getElementById('addRideDestinationHomeZip').value.trim();
            
            if (!street || !city || !state || !zip) {
                throw new Error('Please fill in all destination address fields.');
            }
            
            actualDestination = `${street}, ${city}, ${state} ${zip}`;
            destinationAddress = { street, city, state, zip };
        }
        
        // If assigning to self, check for conflicts again
        if (assignSelf) {
            const tempRide = {
                id: 'temp',
                date: date,
                time: time,
                pickup: actualPickup,
                destination: actualDestination,
                vehicleType: vehicleType,
                passengers: passengers
            };
            
            const conflictCheck = canDriverAcceptRideWithRestrictions(tempRide);
            if (!conflictCheck.canAccept) {
                throw new Error(conflictCheck.reason);
            }
        }
        
        // Create ride data
        const rideData = {
            customerName: name,
            customerEmail: email,
            customerPhone: phone,
            pickup: actualPickup,
            pickupAddress: pickupAddress,
            destination: actualDestination,
            destinationAddress: destinationAddress,
            date: date,
            time: time,
            passengers: passengers,
            vehicleType: vehicleType,
            baggageClaim: baggageClaim,
            flightNumber: flightNumber,
            airline: airline
        };
        
        // Submit via API
        if (typeof API !== 'undefined' && API.rides) {
            const response = await API.rides.create(rideData);
            
            // If assigning to self, accept the ride
            if (assignSelf && currentDriver) {
                // Get ride ID from response (could be response.ride.id or response.id or response.rideId)
                const rideId = response.ride?.id || response.id || response.rideId;
                if (rideId) {
                    await API.rides.accept(rideId);
                }
            }
            
            // Success
            messageDiv.style.display = 'block';
            messageDiv.style.background = '#d4edda';
            messageDiv.style.color = '#155724';
            messageDiv.textContent = assignSelf 
                ? 'Ride added and assigned to you successfully!'
                : 'Ride added successfully! It has been posted for other drivers to accept.';
            
            resetAddRideForm();
        } else {
            throw new Error('Ride system not available.');
        }
        
    } catch (error) {
        messageDiv.style.display = 'block';
        messageDiv.style.background = '#f8d7da';
        messageDiv.style.color = '#721c24';
        messageDiv.textContent = error.message || 'Error adding ride. Please try again.';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add Ride';
    }
}

// Reset add ride form
function resetAddRideForm() {
    document.getElementById('addRideForm').reset();
    document.getElementById('addRideFlightInfoSection').style.display = 'none';
    document.getElementById('addRideBaggageClaimGroup').style.display = 'none';
    document.getElementById('addRidePickupOtherAddress').style.display = 'none';
    document.getElementById('addRidePickupHomeAddress').style.display = 'none';
    document.getElementById('addRideDestinationOtherAddress').style.display = 'none';
    document.getElementById('addRideDestinationHomeAddress').style.display = 'none';
    document.getElementById('addRideConflictMessage').style.display = 'none';
    document.getElementById('addRideAssignOthers').checked = true;
    
    // Reload rides if on list/calendar view
    if (currentView === 'list' || currentView === 'calendar') {
        loadRides();
    }
}

// Expose functions to global scope
window.handleAddRide = handleAddRide;
window.handleAddRideLocationChange = handleAddRideLocationChange;
window.toggleAddRideFlightInfo = toggleAddRideFlightInfo;
window.updateAddRideVehicleTypeOptions = updateAddRideVehicleTypeOptions;
window.checkAddRideConflict = checkAddRideConflict;
window.resetAddRideForm = resetAddRideForm;

