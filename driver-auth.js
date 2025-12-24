// Driver authentication and data management

// EmailJS Configuration
// Initialize EmailJS - Replace with your actual public key
let EMAILJS_INITIALIZED = false;
if (typeof window !== 'undefined' && typeof emailjs !== 'undefined') {
    // Uncomment and add your EmailJS public key:
    // emailjs.init("YOUR_PUBLIC_KEY");
    // EMAILJS_INITIALIZED = true;
}

// Email utility functions
async function sendEmailToCustomer(ride, emailType, driver = null) {
    // Check if EmailJS is available
    if (typeof window === 'undefined' || typeof emailjs === 'undefined' || !EMAILJS_INITIALIZED) {
        console.warn('EmailJS not initialized. Skipping customer email.');
        return;
    }
    
    try {
        // Get driver information if not provided
        if (!driver && ride.driverId) {
            const drivers = getDrivers();
            driver = drivers.find(d => d.username === ride.driverId);
        }
        
        // Get driver photo from localStorage
        let driverPhoto = null;
        if (driver && driver.username) {
            driverPhoto = localStorage.getItem(`driver_photo_${driver.username}`);
        }
        
        // Format date and time - parse date using local time components to avoid timezone issues
        const dateParts = ride.date.split('-');
        const formattedDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        const formattedTime = new Date(`2000-01-01T${ride.time}`).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        
        // Parse vehicle info (format: "Type - Color Make Model")
        let vehicleType = '';
        let vehicleColor = '';
        let vehicleMakeModel = '';
        if (driver && driver.vehicle) {
            const vehicleParts = driver.vehicle.split(' - ');
            if (vehicleParts.length >= 2) {
                vehicleType = vehicleParts[0];
                const colorMakeModel = vehicleParts[1].split(' ');
                if (colorMakeModel.length >= 3) {
                    vehicleColor = colorMakeModel[0];
                    vehicleMakeModel = colorMakeModel.slice(1).join(' ');
                } else {
                    vehicleMakeModel = vehicleParts[1];
                }
            } else {
                vehicleMakeModel = driver.vehicle;
            }
        }
        
        let subject = '';
        let message = '';
        let templateId = '';
        
        if (emailType === 'accepted') {
            subject = `Your Ride Has Been Confirmed - ${formattedDate}`;
            templateId = 'YOUR_ACCEPTANCE_TEMPLATE_ID'; // Replace with your EmailJS template ID
            message = `Dear ${ride.name},

Your ride has been confirmed!

DRIVER INFORMATION:
${driver ? `
Name: ${driver.name}
Phone: ${driver.phone}
Email: ${driver.email}
Vehicle Type: ${vehicleType}
Vehicle: ${vehicleColor} ${vehicleMakeModel}
` : 'Driver information will be provided soon.'}

RIDE DETAILS:
Pickup Location: ${ride.pickup}
Destination: ${ride.destination}
Date: ${formattedDate}
Time: ${formattedTime}
Number of Passengers: ${ride.passengers}
${ride.isAirportTrip && ride.flightNumber ? `Flight Number: ${ride.flightNumber}
Airline: ${ride.airline}` : ''}
${ride.baggageClaim === 'Y' ? 'Meeting Location: Baggage Claim Area' : ''}

${driver ? `Your driver ${driver.name} will contact you if needed.` : 'Your driver will contact you soon.'}

Thank you for choosing South County Ride Share!`;
        } else if (emailType === 'rescheduled') {
            // Parse old date using local time components to avoid timezone issues
            const oldDate = ride.oldDate ? (() => {
                const oldDateParts = ride.oldDate.split('-');
                return new Date(parseInt(oldDateParts[0]), parseInt(oldDateParts[1]) - 1, parseInt(oldDateParts[2])).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            })() : '';
            const oldTime = ride.oldTime ? new Date(`2000-01-01T${ride.oldTime}`).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            }) : '';
            
            subject = `Your Ride Has Been Rescheduled - ${formattedDate}`;
            templateId = 'YOUR_RESCHEDULE_TEMPLATE_ID'; // Replace with your EmailJS template ID
            message = `Dear ${ride.name},

Your ride has been rescheduled.

PREVIOUS SCHEDULE:
Date: ${oldDate}
Time: ${oldTime}

NEW SCHEDULE:
Date: ${formattedDate}
Time: ${formattedTime}

DRIVER INFORMATION:
${driver ? `
Name: ${driver.name}
Phone: ${driver.phone}
Email: ${driver.email}
Vehicle Type: ${vehicleType}
Vehicle: ${vehicleColor} ${vehicleMakeModel}
` : 'Driver information will be provided soon.'}

RIDE DETAILS:
Pickup Location: ${ride.pickup}
Destination: ${ride.destination}
Number of Passengers: ${ride.passengers}
${ride.isAirportTrip && ride.flightNumber ? `Flight Number: ${ride.flightNumber}
Airline: ${ride.airline}` : ''}

${driver ? `Your driver ${driver.name} will contact you if needed.` : 'Your driver will contact you soon.'}

Thank you for choosing South County Ride Share!`;
        } else if (emailType === 'cancelled') {
            subject = `Your Ride Has Been Cancelled - ${formattedDate}`;
            templateId = 'YOUR_CANCELLATION_TEMPLATE_ID'; // Replace with your EmailJS template ID
            message = `Dear ${ride.name},

We regret to inform you that your ride has been cancelled.

CANCELLED RIDE DETAILS:
Pickup Location: ${ride.pickup}
Destination: ${ride.destination}
Date: ${formattedDate}
Time: ${formattedTime}
Number of Passengers: ${ride.passengers}

${ride.driverId ? 'Your ride has been reassigned to a different driver. You will receive a new confirmation email shortly.' : 'If you need to reschedule, please contact us or submit a new reservation request.'}

We apologize for any inconvenience. If you have any questions, please contact us.

Thank you for choosing South County Ride Share!`;
        }
        
        const templateParams = {
            to_email: ride.email,
            to_name: ride.name,
            subject: subject,
            message: message,
            driver_name: driver ? driver.name : 'TBD',
            driver_phone: driver ? driver.phone : 'TBD',
            driver_email: driver ? driver.email : 'TBD',
            driver_vehicle_type: vehicleType,
            driver_vehicle_color: vehicleColor,
            driver_vehicle_make_model: vehicleMakeModel,
            driver_vehicle_full: driver ? driver.vehicle : 'TBD',
            driver_photo: driverPhoto || '',
            pickup: ride.pickup,
            destination: ride.destination,
            date: formattedDate,
            time: formattedTime,
            passengers: ride.passengers,
            flight_number: ride.flightNumber || 'N/A',
            airline: ride.airline || 'N/A',
            baggage_claim: ride.baggageClaim === 'Y' ? 'Yes - Driver will meet in baggage claim area' : 'No'
        };
        
        await emailjs.send(
            'YOUR_SERVICE_ID', // Replace with your EmailJS Service ID
            templateId,
            templateParams
        );
        
        console.log(`Email sent to customer ${ride.email} for ${emailType}`);
    } catch (error) {
        console.error('Error sending email to customer:', error);
        // Don't throw error - email failure shouldn't break the app
    }
}

async function sendEmailToAllDrivers(ride, emailType) {
    // Check if EmailJS is available
    if (typeof window === 'undefined' || typeof emailjs === 'undefined' || !EMAILJS_INITIALIZED) {
        console.warn('EmailJS not initialized. Skipping driver notification emails.');
        return;
    }
    
    try {
        const drivers = getDrivers();
        const acceptingDriver = drivers.find(d => d.username === ride.driverId);
        
        // Format date and time - parse date using local time components to avoid timezone issues
        const dateParts = ride.date.split('-');
        const formattedDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        const formattedTime = new Date(`2000-01-01T${ride.time}`).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        
        if (emailType === 'ride_accepted') {
            const subject = `Ride Accepted by ${acceptingDriver ? acceptingDriver.name : 'Another Driver'}`;
            const message = `A ride has been accepted by ${acceptingDriver ? acceptingDriver.name : 'another driver'}.

RIDE DETAILS:
Passenger: ${ride.name}
Pickup: ${ride.pickup}
Destination: ${ride.destination}
Date: ${formattedDate}
Time: ${formattedTime}
Number of Passengers: ${ride.passengers}

This ride is no longer available.`;

            // Send email to all drivers except the one who accepted
            const otherDrivers = drivers.filter(d => d.username !== ride.driverId);
            
            for (const driver of otherDrivers) {
                try {
                    await emailjs.send(
                        'YOUR_SERVICE_ID', // Replace with your EmailJS Service ID
                        'YOUR_DRIVER_NOTIFICATION_TEMPLATE_ID', // Replace with your EmailJS template ID
                        {
                            to_email: driver.email,
                            to_name: driver.name,
                            subject: subject,
                            message: message
                        }
                    );
                } catch (error) {
                    console.error(`Error sending email to driver ${driver.email}:`, error);
                }
            }
            
            console.log(`Notification emails sent to ${otherDrivers.length} drivers`);
        }
    } catch (error) {
        console.error('Error sending emails to drivers:', error);
        // Don't throw error - email failure shouldn't break the app
    }
}

async function sendEmailToAdmin(notification) {
    // Check if EmailJS is available
    if (typeof window === 'undefined' || typeof emailjs === 'undefined' || !EMAILJS_INITIALIZED) {
        console.warn('EmailJS not initialized. Skipping admin email.');
        return;
    }
    
    try {
        const admins = getAdmins();
        if (admins.length === 0) {
            console.warn('No admins found to send email to');
            return;
        }
        
        // Send email to all admins
        for (const admin of admins) {
            try {
                await emailjs.send(
                    'YOUR_SERVICE_ID', // Replace with your EmailJS Service ID
                    'YOUR_ADMIN_NOTIFICATION_TEMPLATE_ID', // Replace with your EmailJS template ID
                    {
                        to_email: admin.email,
                        to_name: admin.name,
                        subject: `Notification: ${notification.title}`,
                        message: notification.message,
                        notification_type: notification.type,
                        notification_title: notification.title
                    }
                );
            } catch (error) {
                console.error(`Error sending email to admin ${admin.email}:`, error);
            }
        }
        
        console.log(`Notification email sent to ${admins.length} admin(s)`);
    } catch (error) {
        console.error('Error sending email to admin:', error);
        // Don't throw error - email failure shouldn't break the app
    }
}

// Default driver credentials (change these in production!)
const DEFAULT_DRIVERS = [
    {
        username: 'driver1',
        password: 'driver123', // Change this password!
        name: 'John Driver',
        email: 'driver1@example.com',
        phone: '(555) 123-4567',
        vehicle: 'Sedan - White Toyota Camry'
    },
    {
        username: 'driver2',
        password: 'driver123', // Change this password!
        name: 'Jane Driver',
        email: 'driver2@example.com',
        phone: '(555) 987-6543',
        vehicle: 'SUV - Black Ford Explorer'
    },
    {
        username: 'driver3',
        password: 'driver123', // Change this password!
        name: 'Mike Driver',
        email: 'driver3@example.com',
        phone: '(555) 456-7890',
        vehicle: 'Sedan - Silver Honda Accord'
    },
    {
        username: 'driver4',
        password: 'driver123', // Change this password!
        name: 'Sarah Driver',
        email: 'driver4@example.com',
        phone: '(555) 234-5678',
        vehicle: 'XL SUV - Gray Chevrolet Suburban'
    },
    {
        username: 'driver5',
        password: 'driver123', // Change this password!
        name: 'David Driver',
        email: 'driver5@example.com',
        phone: '(555) 345-6789',
        vehicle: 'SUV - Blue Nissan Pathfinder'
    }
];

// Default admin credentials (change these in production!)
const DEFAULT_ADMINS = [
    {
        username: 'admin',
        password: 'admin123', // Change this password!
        name: 'Administrator',
        email: 'admin@example.com'
    }
];

// Initialize drivers in localStorage if not exists
function initializeDrivers() {
    if (!localStorage.getItem('drivers')) {
        localStorage.setItem('drivers', JSON.stringify(DEFAULT_DRIVERS));
    }
}

// Initialize admins in localStorage if not exists
function initializeAdmins() {
    if (!localStorage.getItem('admins')) {
        localStorage.setItem('admins', JSON.stringify(DEFAULT_ADMINS));
    }
}

// Initialize rides array if not exists
function initializeRides() {
    if (!localStorage.getItem('rides')) {
        localStorage.setItem('rides', JSON.stringify([]));
    }
}

// Initialize days off array if not exists
function initializeDaysOff() {
    if (!localStorage.getItem('daysOff')) {
        localStorage.setItem('daysOff', JSON.stringify([]));
    }
}

// Initialize notifications array if not exists
function initializeNotifications() {
    if (!localStorage.getItem('notifications')) {
        localStorage.setItem('notifications', JSON.stringify([]));
    }
}

// Get all drivers
function getDrivers() {
    const drivers = localStorage.getItem('drivers');
    return drivers ? JSON.parse(drivers) : [];
}

// Save drivers
function saveDrivers(drivers) {
    localStorage.setItem('drivers', JSON.stringify(drivers));
}

// Delete a driver
function deleteDriver(driverUsername) {
    const drivers = getDrivers();
    const filtered = drivers.filter(d => d.username !== driverUsername);
    if (filtered.length < drivers.length) {
        saveDrivers(filtered);
        
        // Also remove any rides assigned to this driver (set them back to pending)
        const rides = getRides();
        rides.forEach(ride => {
            if (ride.driverId === driverUsername && ride.status === 'accepted') {
                ride.status = 'pending';
                ride.driverId = null;
                ride.driverName = null;
                ride.driverEmail = null;
                ride.driverPhone = null;
                ride.driverVehicle = null;
                ride.confirmed = false;
                ride.confirmedAt = null;
            }
        });
        saveRides(rides);
        
        return true;
    }
    return false;
}

// Reset driver password
function resetDriverPassword(driverUsername, newPassword) {
    const drivers = getDrivers();
    const driverIndex = drivers.findIndex(d => d.username === driverUsername);
    if (driverIndex !== -1) {
        drivers[driverIndex].password = newPassword;
        saveDrivers(drivers);
        return true;
    }
    return false;
}

// Get all admins
function getAdmins() {
    const admins = localStorage.getItem('admins');
    return admins ? JSON.parse(admins) : [];
}

// Authenticate admin
function authenticateAdmin(username, password) {
    const admins = getAdmins();
    const admin = admins.find(a => a.username === username && a.password === password);
    return admin || null;
}

// Check if admin is logged in
function isAdminLoggedIn() {
    return sessionStorage.getItem('adminLoggedIn') === 'true';
}

// Get current admin
function getCurrentAdmin() {
    const adminData = sessionStorage.getItem('currentAdmin');
    return adminData ? JSON.parse(adminData) : null;
}

// Set current admin
function setCurrentAdmin(admin) {
    sessionStorage.setItem('adminLoggedIn', 'true');
    sessionStorage.setItem('currentAdmin', JSON.stringify(admin));
}

// Logout admin
function logoutAdmin() {
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('currentAdmin');
}

// Get all rides
function getRides() {
    const rides = localStorage.getItem('rides');
    return rides ? JSON.parse(rides) : [];
}

// Save rides
function saveRides(rides) {
    localStorage.setItem('rides', JSON.stringify(rides));
}

// Add a new ride request
function addRide(rideData) {
    const rides = getRides();
    const newRide = {
        id: Date.now().toString(),
        ...rideData,
        status: 'pending', // pending, accepted, completed
        driverId: null,
        driverName: null,
        driverEmail: null,
        driverPhone: null,
        driverVehicle: null,
        createdAt: new Date().toISOString()
    };
    rides.push(newRide);
    saveRides(rides);
    
    // Create notification for all drivers
    const drivers = getDrivers();
    // Parse date using local time components to avoid timezone issues
    const dateParts = rideData.date.split('-');
    const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
    const time = new Date(`2000-01-01T${rideData.time}`).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    drivers.forEach(driver => {
        createNotification(
            'new_ride',
            'New Ride Request',
            `New ride request: ${rideData.pickup} → ${rideData.destination} on ${date} at ${time}`,
            newRide.id,
            null
        );
    });
    
    // Create notification for admin
    createAdminNotification(
        'new_ride',
        'New Ride Request',
        `New ride request submitted: ${rideData.pickup} → ${rideData.destination} on ${date} at ${time} by ${rideData.name}`,
        newRide.id,
        null
    );
    
    return newRide;
}

// Accept a ride
function acceptRide(rideId, driver) {
    const rides = getRides();
    const rideIndex = rides.findIndex(r => r.id === rideId);
    if (rideIndex === -1) {
        return null;
    }
    
    const ride = rides[rideIndex];
    
    // Validation: Check if ride is on a day off
    const daysOff = getDaysOff();
    
    // Normalize ride date to YYYY-MM-DD format
    // ride.date should already be in YYYY-MM-DD format from the form
    let rideDateString = ride.date;
    if (rideDateString && rideDateString.includes('T')) {
        // If it's an ISO string, extract just the date part
        rideDateString = rideDateString.split('T')[0];
    }
    // Ensure it's in YYYY-MM-DD format
    if (rideDateString && rideDateString.length === 10 && rideDateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Already in correct format
    } else if (rideDateString) {
        // Try to parse and reformat
        const rideDate = new Date(rideDateString);
        if (!isNaN(rideDate.getTime())) {
            const year = rideDate.getFullYear();
            const month = String(rideDate.getMonth() + 1).padStart(2, '0');
            const day = String(rideDate.getDate()).padStart(2, '0');
            rideDateString = `${year}-${month}-${day}`;
        }
    }
    
    // Check day off validation - only block the exact day, not adjacent days
    if (rideDateString && daysOff.length > 0) {
        const isDayOff = daysOff.some(dayOff => {
            // Normalize day off date to YYYY-MM-DD format
            let dayOffDateString = dayOff.date;
            if (!dayOffDateString) {
                return false;
            }
            
            if (dayOffDateString.includes('T')) {
                dayOffDateString = dayOffDateString.split('T')[0];
            }
            
            // Ensure it's in YYYY-MM-DD format
            if (dayOffDateString.length === 10 && dayOffDateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // Already in correct format
            } else {
                // Try to parse and reformat using local time components to avoid timezone issues
                const dateParts = dayOffDateString.split('-');
                if (dateParts.length === 3) {
                    // Already in YYYY-MM-DD format, just ensure it's valid
                    dayOffDateString = `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`;
                } else {
                    // Try parsing as Date object
                    const dayOffDate = new Date(dayOffDateString);
                    if (!isNaN(dayOffDate.getTime())) {
                        // Use local time components to avoid timezone shift
                        const year = dayOffDate.getFullYear();
                        const month = String(dayOffDate.getMonth() + 1).padStart(2, '0');
                        const day = String(dayOffDate.getDate()).padStart(2, '0');
                        dayOffDateString = `${year}-${month}-${day}`;
                    } else {
                        return false; // Invalid date
                    }
                }
            }
            
            // Check if dates match exactly (string comparison) and driver matches
            const driverMatches = dayOff.driverId === driver.username || dayOff.driverId === 'all';
            const dateMatches = dayOffDateString === rideDateString;
            
            return dateMatches && driverMatches;
        });
        
        if (isDayOff) {
            throw new Error('Cannot accept ride on a scheduled day off.');
        }
    }
    
    // Helper function to check if a location is an airport
    function isAirportLocation(location) {
        if (!location) return false;
        const locationLower = location.toLowerCase().trim();
        
        // Exclude these locations (not airports)
        const excludedLocations = ['cbx', 'cross border', 'long beach cruise terminal', 'cruise terminal'];
        if (excludedLocations.some(excluded => locationLower.includes(excluded))) {
            return false;
        }
        
        // Airport keywords
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
        
        // Airport codes mapping
        const airportCodes = {
            'sna': ['john wayne', 'sna', 'orange county'],
            'lax': ['los angeles', 'lax'],
            'san': ['san diego', 'san'],
            'lgb': ['long beach', 'lgb'],
            'ont': ['ontario', 'ont']
        };
        
        // Check if both are airports
        if (!isAirportLocation(location1) || !isAirportLocation(location2)) {
            return false;
        }
        
        // Check for exact match
        if (loc1 === loc2) {
            return true;
        }
        
        // Check if they share the same airport code
        for (const [code, keywords] of Object.entries(airportCodes)) {
            const loc1Matches = keywords.some(k => loc1.includes(k));
            const loc2Matches = keywords.some(k => loc2.includes(k));
            if (loc1Matches && loc2Matches) {
                return true;
            }
        }
        
        return false;
    }
    
    // Validation: Check for time conflicts (same time or within 2 hours)
    // Exception: If conflicting ride's destination is an airport and new ride's pickup is the same airport,
    // allow it if at least 30 minutes apart
    const rideDateTime = new Date(`${ride.date}T${ride.time}`);
    const conflictingRide = rides.find(r => {
        // Only check accepted rides for the same driver
        if (r.status !== 'accepted' || r.driverId !== driver.username || r.id === rideId) {
            return false;
        }
        
        const otherRideDateTime = new Date(`${r.date}T${r.time}`);
        const timeDiff = Math.abs(rideDateTime - otherRideDateTime);
        const hoursDiff = timeDiff / (1000 * 60 * 60); // Convert to hours
        
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
        // Parse conflict date using local time components to avoid timezone issues
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
        throw new Error(`Cannot accept ride. You already have a ride scheduled on ${conflictDate} at ${conflictTime}. Rides must be at least 2 hours apart (or 30 minutes if both are at the same airport).`);
    }
    
    // Validation: Check if driver has a vehicle type that can handle the required vehicle type
    // Hierarchy: XL SUV can do Sedans, SUV, XL SUV
    //            SUV can do Sedans, SUV
    //            Sedans can do Sedans only
    const requiredVehicleType = ride.vehicleType || 'Sedans';
    
    // Get driver's available vehicle types
    let driverVehicleTypes = [];
    if (driver.vehicles && Array.isArray(driver.vehicles)) {
        // Extract vehicle types from vehicles array
        driverVehicleTypes = driver.vehicles.map(v => {
            const parts = v.split(' - ');
            return parts[0] || v;
        });
    } else if (driver.vehicle) {
        // Support old vehicle string format
        const parts = driver.vehicle.split(' - ');
        driverVehicleTypes = [parts[0] || driver.vehicle];
    }
    
    // Check if driver has at least one vehicle
    if (driverVehicleTypes.length === 0) {
        throw new Error('You must add at least one vehicle to your profile before accepting rides.');
    }
    
    // Helper function to check if a driver's vehicle type can handle a required vehicle type
    function canVehicleTypeHandle(driverVehicleType, requiredVehicleType) {
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
    
    // Check if any of the driver's vehicles can handle the required vehicle type
    const canHandle = driverVehicleTypes.some(driverVehicleType => 
        canVehicleTypeHandle(driverVehicleType, requiredVehicleType)
    );
    
    if (!canHandle) {
        throw new Error(`You cannot accept this ride. It requires a ${requiredVehicleType}, but your vehicles (${driverVehicleTypes.join(', ')}) cannot handle this ride type. XL SUV can handle all rides, SUV can handle Sedans and SUV rides, and Sedans can only handle Sedan rides.`);
    }
    
    // All validations passed, accept the ride
    rides[rideIndex].status = 'accepted';
    rides[rideIndex].driverId = driver.username;
    rides[rideIndex].driverName = driver.name;
    rides[rideIndex].driverEmail = driver.email;
    rides[rideIndex].driverPhone = driver.phone;
    // Set driver vehicle (use first vehicle that matches the required type or can handle it)
    const rideVehicleType = ride.vehicleType || 'Sedans';
    let assignedVehicle = null;
    
    if (driver.vehicles && Array.isArray(driver.vehicles)) {
        // Try to find a vehicle that matches the rideVehicleType exactly
        assignedVehicle = driver.vehicles.find(v => {
            const parts = v.split(' - ');
            return (parts[0] || v) === rideVehicleType;
        });
        
        // If no exact match, find a vehicle that can handle the required type
        if (!assignedVehicle) {
            assignedVehicle = driver.vehicles.find(v => {
                const parts = v.split(' - ');
                const vehicleType = parts[0] || v;
                return canVehicleTypeHandle(vehicleType, rideVehicleType);
            });
        }
        
        // If still no match, use the first available vehicle (shouldn't happen due to validation)
        if (!assignedVehicle) {
            assignedVehicle = driver.vehicles[0];
        }
    } else if (driver.vehicle) {
        assignedVehicle = driver.vehicle;
    }
    
    rides[rideIndex].driverVehicle = assignedVehicle;
    rides[rideIndex].acceptedAt = new Date().toISOString();
    saveRides(rides);
    
    // Create notification for admin
    // Parse date using local time components to avoid timezone issues
    const dateParts = ride.date.split('-');
    const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
    const time = new Date(`2000-01-01T${ride.time}`).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    const adminNotification = createAdminNotification(
        'ride_accepted',
        'Ride Accepted',
        `${driver.name} accepted a ride: ${ride.pickup} → ${ride.destination} on ${date} at ${time}`,
        rideId,
        driver.username
    );
    
    // Send emails
    if (typeof sendEmailToCustomer === 'function') {
        sendEmailToCustomer(rides[rideIndex], 'accepted', driver).catch(err => console.error('Customer email error:', err));
    }
    if (typeof sendEmailToAllDrivers === 'function') {
        sendEmailToAllDrivers(rides[rideIndex], 'ride_accepted').catch(err => console.error('Driver notification email error:', err));
    }
    // Note: Admin email is sent automatically in createAdminNotification function
    
    return rides[rideIndex];
}

// Confirm pickup (must be done within 48 hours before ride)
// driverId can be the actual driver or 'admin' for admin confirmation
function confirmPickup(rideId, driverId) {
    const rides = getRides();
    const rideIndex = rides.findIndex(r => r.id === rideId);
    if (rideIndex === -1 || rides[rideIndex].status !== 'accepted') {
        throw new Error('Ride not found or not accepted');
    }
    
    // Allow admin to confirm any ride, or driver to confirm their own ride
    const ride = rides[rideIndex];
    const admin = getCurrentAdmin();
    const isAdmin = driverId === 'admin' || driverId === admin?.username;
    if (!isAdmin && ride.driverId !== driverId) {
        throw new Error('Ride not accepted by this driver');
    }
    
    // Check if already confirmed
    if (ride.confirmed) {
        throw new Error('Ride pickup has already been confirmed');
    }
    
    // Check if within 48 hour window
    const rideDateTime = new Date(`${ride.date}T${ride.time}`);
    const now = new Date();
    const hoursUntilRide = (rideDateTime - now) / (1000 * 60 * 60);
    
    if (hoursUntilRide > 48) {
        throw new Error('Pickup confirmation can only be done within 48 hours before the ride');
    }
    if (hoursUntilRide < 0) {
        throw new Error('Cannot confirm pickup for a ride that has already passed');
    }
    
    // Mark as confirmed
    rides[rideIndex].confirmed = true;
    rides[rideIndex].confirmedAt = new Date().toISOString();
    saveRides(rides);
    
    // Send confirmation email to customer
    sendConfirmationEmail(ride);
    
    // Create notification for admin
    const dateParts = ride.date.split('-');
    const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
    const time = new Date(`2000-01-01T${ride.time}`).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    createAdminNotification(
        'pickup_confirmed',
        'Pickup Confirmed',
        `${ride.driverName} confirmed pickup for ride: ${ride.pickup} → ${ride.destination} on ${date} at ${time}`,
        rideId,
        driverId
    );
    
    return rides[rideIndex];
}

// Send confirmation email to customer
async function sendConfirmationEmail(ride) {
    if (typeof window === 'undefined' || typeof emailjs === 'undefined' || !EMAILJS_INITIALIZED) {
        console.warn('EmailJS not initialized. Skipping confirmation email.');
        return;
    }
    
    try {
        // Get driver information
        const drivers = getDrivers();
        const driver = drivers.find(d => d.username === ride.driverId);
        
        // Get driver photo from localStorage
        let driverPhoto = null;
        if (driver && driver.username) {
            driverPhoto = localStorage.getItem(`driver_photo_${driver.username}`);
        }
        
        // Format date and time - parse date using local time components to avoid timezone issues
        const dateParts = ride.date.split('-');
        const formattedDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        const formattedTime = new Date(`2000-01-01T${ride.time}`).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        
        // Parse vehicle info
        let vehicleType = '';
        let vehicleColor = '';
        let vehicleMakeModel = '';
        if (driver && driver.vehicle) {
            const vehicleParts = driver.vehicle.split(' - ');
            if (vehicleParts.length >= 2) {
                vehicleType = vehicleParts[0] || '';
                const rest = vehicleParts.slice(1).join(' - ');
                const colorMakeModel = rest.split(' ');
                if (colorMakeModel.length >= 2) {
                    vehicleColor = colorMakeModel[0] || '';
                    vehicleMakeModel = colorMakeModel.slice(1).join(' ') || '';
                } else {
                    vehicleMakeModel = rest;
                }
            } else {
                vehicleType = driver.vehicle;
            }
        }
        
        // If driver has multiple vehicles, use assigned vehicle
        if (ride.assignedVehicle) {
            const vehicleParts = ride.assignedVehicle.split(' - ');
            if (vehicleParts.length >= 2) {
                vehicleType = vehicleParts[0] || '';
                const rest = vehicleParts.slice(1).join(' - ');
                const colorMakeModel = rest.split(' ');
                if (colorMakeModel.length >= 2) {
                    vehicleColor = colorMakeModel[0] || '';
                    vehicleMakeModel = colorMakeModel.slice(1).join(' ') || '';
                } else {
                    vehicleMakeModel = rest;
                }
            } else {
                vehicleType = ride.assignedVehicle;
            }
        }
        
        await emailjs.send(
            'YOUR_SERVICE_ID', // Replace with your EmailJS service ID
            'pickup_confirmation', // Template ID for pickup confirmation
            {
                customer_name: ride.name,
                customer_email: ride.email,
                pickup_location: ride.pickup,
                destination: ride.destination,
                ride_date: formattedDate,
                ride_time: formattedTime,
                driver_name: driver ? driver.name : 'Your driver',
                driver_email: driver ? driver.email : '',
                driver_phone: driver ? driver.phone : '',
                vehicle_type: vehicleType,
                vehicle_color: vehicleColor,
                vehicle_make_model: vehicleMakeModel,
                driver_photo: driverPhoto || '',
                flight_number: ride.flightNumber || 'N/A',
                airline: ride.airline || 'N/A',
                passengers: ride.passengers || 1
            }
        );
        
        console.log(`Confirmation email sent to ${ride.email}`);
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        // Don't throw error - email failure shouldn't break the app
    }
}

// Complete a ride
function completeRide(rideId, driverId) {
    const rides = getRides();
    const rideIndex = rides.findIndex(r => r.id === rideId);
    if (rideIndex === -1 || rides[rideIndex].status !== 'accepted' || rides[rideIndex].driverId !== driverId) {
        throw new Error('Ride not found or not accepted by this driver');
    }
    
    const ride = rides[rideIndex];
    
    // Check if pickup has been confirmed
    if (!ride.confirmed) {
        throw new Error('Ride pickup must be confirmed before it can be completed. Please confirm the pickup first.');
    }
    
    rides[rideIndex].status = 'completed';
    rides[rideIndex].completedAt = new Date().toISOString();
    saveRides(rides);
    
    // Create notification for admin
    const dateParts = ride.date.split('-');
    const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
    const time = new Date(`2000-01-01T${ride.time}`).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    createAdminNotification(
        'ride_completed',
        'Ride Completed',
        `${ride.driverName} completed a ride: ${ride.pickup} → ${ride.destination} on ${date} at ${time}`,
        rideId,
        driverId
    );
    
    return rides[rideIndex];
}

// Authenticate driver
function authenticateDriver(username, password) {
    const drivers = getDrivers();
    const driver = drivers.find(d => d.username === username && d.password === password);
    return driver || null;
}

// Check if driver is logged in
function isDriverLoggedIn() {
    return sessionStorage.getItem('driverLoggedIn') === 'true';
}

// Get current driver
function getCurrentDriver() {
    const driverData = sessionStorage.getItem('currentDriver');
    return driverData ? JSON.parse(driverData) : null;
}

// Set current driver
function setCurrentDriver(driver) {
    sessionStorage.setItem('driverLoggedIn', 'true');
    sessionStorage.setItem('currentDriver', JSON.stringify(driver));
}

// Logout driver
function logoutDriver() {
    sessionStorage.removeItem('driverLoggedIn');
    sessionStorage.removeItem('currentDriver');
}

// Get all days off
function getDaysOff() {
    const daysOff = localStorage.getItem('daysOff');
    return daysOff ? JSON.parse(daysOff) : [];
}

// Save days off
function saveDaysOff(daysOff) {
    localStorage.setItem('daysOff', JSON.stringify(daysOff));
}

// Add a day off
function addDayOff(driverId, date) {
    const daysOff = getDaysOff();
    const newDayOff = {
        id: Date.now().toString(),
        driverId: driverId,
        driverName: getDrivers().find(d => d.username === driverId)?.name || 'Unknown',
        date: date,
        createdAt: new Date().toISOString()
    };
    daysOff.push(newDayOff);
    saveDaysOff(daysOff);
    return newDayOff;
}

// Remove a day off
function removeDayOff(dayOffId) {
    const daysOff = getDaysOff();
    const filtered = daysOff.filter(d => d.id !== dayOffId);
    saveDaysOff(filtered);
    return filtered.length < daysOff.length;
}

// Get all notifications
function getNotifications() {
    const notifications = localStorage.getItem('notifications');
    return notifications ? JSON.parse(notifications) : [];
}

// Save notifications
function saveNotifications(notifications) {
    localStorage.setItem('notifications', JSON.stringify(notifications));
}

// Create a notification
function createNotification(type, title, message, rideId, driverId) {
    const notifications = getNotifications();
    const newNotification = {
        id: Date.now().toString(),
        type: type, // 'new_ride', 'ride_given_up'
        title: title,
        message: message,
        rideId: rideId || null,
        driverId: driverId || null, // For ride_given_up, this is the driver who gave it up
        read: false,
        createdAt: new Date().toISOString()
    };
    notifications.unshift(newNotification); // Add to beginning
    saveNotifications(notifications);
    return newNotification;
}

// Mark notification as read
function markNotificationRead(notificationId) {
    const notifications = getNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
        notification.read = true;
        saveNotifications(notifications);
        return true;
    }
    return false;
}

// Mark all notifications as read
function markAllNotificationsRead() {
    const notifications = getNotifications();
    notifications.forEach(n => n.read = true);
    saveNotifications(notifications);
}

// Get unread notification count
function getUnreadNotificationCount() {
    const notifications = getNotifications();
    return notifications.filter(n => !n.read).length;
}

// Initialize admin notifications array if not exists
function initializeAdminNotifications() {
    if (!localStorage.getItem('adminNotifications')) {
        localStorage.setItem('adminNotifications', JSON.stringify([]));
    }
}

// Get all admin notifications
function getAdminNotifications() {
    const notifications = localStorage.getItem('adminNotifications');
    return notifications ? JSON.parse(notifications) : [];
}

// Save admin notifications
function saveAdminNotifications(notifications) {
    localStorage.setItem('adminNotifications', JSON.stringify(notifications));
}

// Create an admin notification
function createAdminNotification(type, title, message, rideId, driverId) {
    const notifications = getAdminNotifications();
    const newNotification = {
        id: Date.now().toString(),
        type: type, // 'ride_accepted', 'ride_cancelled'
        title: title,
        message: message,
        rideId: rideId || null,
        driverId: driverId || null,
        read: false,
        createdAt: new Date().toISOString()
    };
    notifications.unshift(newNotification); // Add to beginning
    saveAdminNotifications(notifications);
    
    // Send email to admin for all notifications
    if (typeof sendEmailToAdmin === 'function') {
        sendEmailToAdmin(newNotification).catch(err => console.error('Admin email error:', err));
    }
    
    return newNotification;
}

// Mark admin notification as read
function markAdminNotificationRead(notificationId) {
    const notifications = getAdminNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
        notification.read = true;
        saveAdminNotifications(notifications);
        return true;
    }
    return false;
}

// Mark all admin notifications as read
function markAllAdminNotificationsRead() {
    const notifications = getAdminNotifications();
    notifications.forEach(n => n.read = true);
    saveAdminNotifications(notifications);
}

// Get unread admin notification count
function getUnreadAdminNotificationCount() {
    const notifications = getAdminNotifications();
    return notifications.filter(n => !n.read).length;
}

// Calculate income for a date range
function calculateIncome(startDate, endDate) {
    const rides = getRides();
    const acceptedRides = rides.filter(r => 
        r.status === 'accepted' && 
        r.acceptedAt &&
        new Date(r.acceptedAt) >= startDate &&
        new Date(r.acceptedAt) <= endDate
    );
    
    // We need to calculate pricing for each ride
    // This will require the ratesData from rates.js
    let totalIncome = 0;
    
    acceptedRides.forEach(ride => {
        // This will be calculated in the dashboard using the pricing calculator
        // For now, we'll return the rides and calculate in the dashboard
    });
    
    return {
        rides: acceptedRides,
        count: acceptedRides.length
    };
}

// Get income for current week
function getWeeklyIncome() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return calculateIncome(startOfWeek, endOfWeek);
}

// Get income for current month
function getMonthlyIncome() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    return calculateIncome(startOfMonth, endOfMonth);
}

// Reschedule a ride
function rescheduleRide(rideId, newDate, newTime, driverId) {
    const rides = getRides();
    const rideIndex = rides.findIndex(r => r.id === rideId);
    if (rideIndex !== -1 && rides[rideIndex].status === 'accepted' && rides[rideIndex].driverId === driverId) {
        const ride = rides[rideIndex];
        const oldDate = ride.date;
        const oldTime = ride.time;
        
        // Update date and time
        rides[rideIndex].date = newDate;
        rides[rideIndex].time = newTime;
        rides[rideIndex].rescheduledAt = new Date().toISOString();
        rides[rideIndex].rescheduledBy = driverId;
        rides[rideIndex].oldDate = oldDate;
        rides[rideIndex].oldTime = oldTime;
        
        // Recalculate pricing with new date/time (if ratesData is available)
        if (typeof ratesData !== 'undefined' && typeof calculatePricing !== 'undefined') {
            const updatedRideData = {
                ...rides[rideIndex],
                date: newDate,
                time: newTime
            };
            const newPricing = calculatePricing(updatedRideData, ratesData);
            // Store the recalculated total price (you might want to store the full breakdown too)
            rides[rideIndex].recalculatedPrice = newPricing.totalPrice;
            rides[rideIndex].priceBreakdown = newPricing.breakdown;
        }
        
        saveRides(rides);
        
        // Create notification for admin
        // Parse date using local time components to avoid timezone issues
        const dateParts = newDate.split('-');
        const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        const time = new Date(`2000-01-01T${newTime}`).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        // Parse old date using local time components to avoid timezone issues
        const oldDateParts = oldDate.split('-');
        const oldDateFormatted = new Date(parseInt(oldDateParts[0]), parseInt(oldDateParts[1]) - 1, parseInt(oldDateParts[2])).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        const oldTimeFormatted = new Date(`2000-01-01T${oldTime}`).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        
        // Ensure admin notifications are initialized
        if (typeof initializeAdminNotifications === 'function') {
            initializeAdminNotifications();
        }
        
        const adminNotification = createAdminNotification(
            'ride_rescheduled',
            'Ride Rescheduled',
            `${ride.driverName || 'A driver'} rescheduled a ride: ${ride.pickup} → ${ride.destination} from ${oldDateFormatted} at ${oldTimeFormatted} to ${date} at ${time}`,
            rideId,
            driverId
        );
        
        // Get driver information
        const drivers = getDrivers();
        const driver = drivers.find(d => d.username === driverId);
        
        // Send emails
        if (typeof sendEmailToCustomer === 'function') {
            sendEmailToCustomer(rides[rideIndex], 'rescheduled', driver).catch(err => console.error('Customer email error:', err));
        }
        // Note: Admin email is sent automatically in createAdminNotification function
        
        return rides[rideIndex];
    }
    return null;
}

// Cancel a ride (admin only - changes status to cancelled)
function cancelRide(rideId) {
    const rides = getRides();
    const rideIndex = rides.findIndex(r => r.id === rideId);
    if (rideIndex !== -1) {
        const ride = rides[rideIndex];
        rides[rideIndex].status = 'cancelled';
        rides[rideIndex].cancelledAt = new Date().toISOString();
        saveRides(rides);
        
        // Create notification for admin
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
        
        const adminNotification = createAdminNotification(
            'ride_cancelled',
            'Ride Cancelled',
            `Ride cancelled: ${ride.pickup} → ${ride.destination} on ${date} at ${time}`,
            rideId,
            null
        );
        
        // Get driver information if ride was assigned
        let driver = null;
        if (ride.driverId) {
            const drivers = getDrivers();
            driver = drivers.find(d => d.username === ride.driverId);
        }
        
        // Send emails
        if (typeof sendEmailToCustomer === 'function') {
            sendEmailToCustomer(ride, 'cancelled', driver).catch(err => console.error('Customer email error:', err));
        }
        // Note: Admin email is sent automatically in createAdminNotification function
        
        return rides[rideIndex];
    }
    return null;
}

// Delete a ride (admin only - permanently removes from system)
function deleteRide(rideId) {
    const rides = getRides();
    const rideIndex = rides.findIndex(r => r.id === rideId);
    if (rideIndex !== -1) {
        const ride = rides[rideIndex];
        rides.splice(rideIndex, 1);
        saveRides(rides);
        
        // Create notification for admin
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
        
        createAdminNotification(
            'ride_deleted',
            'Ride Deleted',
            `Ride deleted: ${ride.pickup} → ${ride.destination} on ${date} at ${time}`,
            null,
            null
        );
        
        return true;
    }
    return false;
}

// Give up an accepted ride (make it available again)
function giveUpRide(rideId, driverId) {
    const rides = getRides();
    const rideIndex = rides.findIndex(r => r.id === rideId);
    if (rideIndex !== -1 && rides[rideIndex].status === 'accepted') {
        const ride = rides[rideIndex];
        rides[rideIndex].status = 'pending';
        rides[rideIndex].driverId = null;
        rides[rideIndex].driverName = null;
        rides[rideIndex].driverEmail = null;
        rides[rideIndex].driverPhone = null;
        rides[rideIndex].driverVehicle = null;
        // Reset confirmation status - new driver will need to confirm
        rides[rideIndex].confirmed = false;
        rides[rideIndex].confirmedAt = null;
        rides[rideIndex].givenUpAt = new Date().toISOString();
        rides[rideIndex].givenUpBy = driverId || null;
        saveRides(rides);
        
        // Create notification for all other drivers
        const drivers = getDrivers();
        const driverWhoGaveUp = drivers.find(d => d.username === driverId);
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
        
        drivers.forEach(driver => {
            if (driver.username !== driverId) {
                createNotification(
                    'ride_given_up',
                    'Ride Available Again',
                    `${driverWhoGaveUp?.name || 'A driver'} gave up a ride: ${ride.pickup} → ${ride.destination} on ${date} at ${time}`,
                    rideId,
                    driverId
                );
            }
        });
        
        // Create notification for admin
        createAdminNotification(
            'ride_cancelled',
            'Ride Cancelled',
            `${driverWhoGaveUp?.name || 'A driver'} cancelled a ride: ${ride.pickup} → ${ride.destination} on ${date} at ${time}`,
            rideId,
            driverId
        );
        
        return rides[rideIndex];
    }
    return null;
}

// Initialize reviews array if not exists
function initializeReviews() {
    if (!localStorage.getItem('reviews')) {
        localStorage.setItem('reviews', JSON.stringify([]));
    }
}

// Initialize archive array if not exists
function initializeArchive() {
    if (!localStorage.getItem('rideArchive')) {
        localStorage.setItem('rideArchive', JSON.stringify([]));
    }
}

// Get archived rides
function getArchivedRides() {
    const archive = localStorage.getItem('rideArchive');
    return archive ? JSON.parse(archive) : [];
}

// Save archived rides
function saveArchivedRides(archive) {
    localStorage.setItem('rideArchive', JSON.stringify(archive));
}

// Archive completed rides from previous month
function archiveCompletedRides() {
    const rides = getRides();
    const archive = getArchivedRides();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Get the last time archiving was done
    const lastArchiveDate = localStorage.getItem('lastArchiveDate');
    const lastArchive = lastArchiveDate ? new Date(lastArchiveDate) : null;
    
    // Check if we need to archive (at start of new month)
    const shouldArchive = !lastArchive || 
        (lastArchive.getMonth() !== currentMonth || lastArchive.getFullYear() !== currentYear);
    
    if (!shouldArchive) {
        return; // Already archived this month
    }
    
    // Find completed rides from previous month
    const completedRides = rides.filter(ride => {
        if (ride.status !== 'completed' || !ride.completedAt) {
            return false;
        }
        
        const completedDate = new Date(ride.completedAt);
        const completedMonth = completedDate.getMonth();
        const completedYear = completedDate.getFullYear();
        
        // Archive rides from previous month
        if (completedYear < currentYear || 
            (completedYear === currentYear && completedMonth < currentMonth)) {
            return true;
        }
        
        return false;
    });
    
    if (completedRides.length === 0) {
        // Update last archive date even if no rides to archive
        localStorage.setItem('lastArchiveDate', now.toISOString());
        return;
    }
    
    // Group rides by month and driver
    const ridesByMonth = {};
    completedRides.forEach(ride => {
        const completedDate = new Date(ride.completedAt);
        const monthKey = `${completedDate.getFullYear()}-${String(completedDate.getMonth() + 1).padStart(2, '0')}`;
        const monthName = completedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        if (!ridesByMonth[monthKey]) {
            ridesByMonth[monthKey] = {
                month: monthName,
                monthKey: monthKey,
                drivers: {}
            };
        }
        
        if (!ride.driverId || !ride.driverName) {
            return; // Skip rides without driver info
        }
        
        if (!ridesByMonth[monthKey].drivers[ride.driverId]) {
            ridesByMonth[monthKey].drivers[ride.driverId] = {
                driverId: ride.driverId,
                driverName: ride.driverName,
                rides: []
            };
        }
        
        ridesByMonth[monthKey].drivers[ride.driverId].rides.push(ride);
    });
    
    // Add to archive
    Object.keys(ridesByMonth).forEach(monthKey => {
        const existingMonthIndex = archive.findIndex(a => a.monthKey === monthKey);
        if (existingMonthIndex !== -1) {
            // Merge with existing month data
            const existingMonth = archive[existingMonthIndex];
            Object.keys(ridesByMonth[monthKey].drivers).forEach(driverId => {
                const existingDriverIndex = existingMonth.drivers.findIndex(d => d.driverId === driverId);
                if (existingDriverIndex !== -1) {
                    // Merge rides
                    const existingRides = existingMonth.drivers[existingDriverIndex].rides.map(r => r.id);
                    ridesByMonth[monthKey].drivers[driverId].rides.forEach(ride => {
                        if (!existingRides.includes(ride.id)) {
                            existingMonth.drivers[existingDriverIndex].rides.push(ride);
                        }
                    });
                } else {
                    // Add new driver
                    existingMonth.drivers.push(ridesByMonth[monthKey].drivers[driverId]);
                }
            });
        } else {
            // Add new month
            archive.push({
                month: ridesByMonth[monthKey].month,
                monthKey: monthKey,
                drivers: Object.values(ridesByMonth[monthKey].drivers)
            });
        }
    });
    
    // Sort archive by month (newest first)
    archive.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
    
    saveArchivedRides(archive);
    
    // Remove archived rides from active rides
    const archivedRideIds = completedRides.map(r => r.id);
    const remainingRides = rides.filter(r => !archivedRideIds.includes(r.id));
    saveRides(remainingRides);
    
    // Update last archive date
    localStorage.setItem('lastArchiveDate', now.toISOString());
    
    return completedRides.length;
}

// Get all reviews
function getReviews() {
    const reviews = localStorage.getItem('reviews');
    return reviews ? JSON.parse(reviews) : [];
}

// Get approved reviews only
function getApprovedReviews() {
    const reviews = getReviews();
    return reviews.filter(r => r.status === 'approved').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Get pending reviews
function getPendingReviews() {
    const reviews = getReviews();
    return reviews.filter(r => r.status === 'pending').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Save reviews
function saveReviews(reviews) {
    localStorage.setItem('reviews', JSON.stringify(reviews));
}

// Add a new review (starts as pending)
function addReview(reviewData) {
    const reviews = getReviews();
    // Ensure rating is stored as a number
    const rating = typeof reviewData.rating === 'number' ? reviewData.rating : parseInt(reviewData.rating) || 0;
    console.log('addReview - Input rating:', reviewData.rating, 'Parsed rating:', rating);
    const newReview = {
        id: Date.now().toString(),
        name: reviewData.name,
        email: reviewData.email,
        rating: rating, // Store as number
        comment: reviewData.comment,
        status: 'pending', // pending, approved, rejected
        createdAt: new Date().toISOString(),
        approvedAt: null,
        approvedBy: null
    };
    console.log('addReview - Saved review with rating:', newReview.rating);
    reviews.push(newReview);
    saveReviews(reviews);
    
    // Create notification for admin
    createAdminNotification(
        'new_review',
        'New Review Submitted',
        `New review submitted by ${reviewData.name} (${reviewData.rating} stars). Review is pending approval.`,
        newReview.id,
        null
    );
    
    return newReview;
}

// Approve a review
function approveReview(reviewId, adminUsername) {
    const reviews = getReviews();
    const reviewIndex = reviews.findIndex(r => r.id === reviewId);
    if (reviewIndex !== -1) {
        reviews[reviewIndex].status = 'approved';
        reviews[reviewIndex].approvedAt = new Date().toISOString();
        reviews[reviewIndex].approvedBy = adminUsername;
        saveReviews(reviews);
        return reviews[reviewIndex];
    }
    return null;
}

// Reject a review
function rejectReview(reviewId, adminUsername) {
    const reviews = getReviews();
    const reviewIndex = reviews.findIndex(r => r.id === reviewId);
    if (reviewIndex !== -1) {
        reviews[reviewIndex].status = 'rejected';
        reviews[reviewIndex].approvedAt = new Date().toISOString();
        reviews[reviewIndex].approvedBy = adminUsername;
        saveReviews(reviews);
        return reviews[reviewIndex];
    }
    return null;
}

// Delete a review
function deleteReview(reviewId) {
    const reviews = getReviews();
    const filtered = reviews.filter(r => r.id !== reviewId);
    saveReviews(filtered);
    return filtered.length < reviews.length;
}

// Invite Link Management
function initializeInvites() {
    if (!localStorage.getItem('driverInvites')) {
        localStorage.setItem('driverInvites', JSON.stringify([]));
    }
}

function getInvites() {
    const invites = localStorage.getItem('driverInvites');
    return invites ? JSON.parse(invites) : [];
}

function saveInvites(invites) {
    localStorage.setItem('driverInvites', JSON.stringify(invites));
}

function createInviteLink(createdBy = 'admin') {
    const invites = getInvites();
    const inviteCode = 'DRIVER-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const newInvite = {
        id: Date.now().toString(),
        code: inviteCode,
        createdAt: new Date().toISOString(),
        createdBy: createdBy,
        used: false,
        usedBy: null,
        usedAt: null
    };
    invites.push(newInvite);
    saveInvites(invites);
    return newInvite;
}

function validateInviteCode(code) {
    const invites = getInvites();
    const invite = invites.find(inv => inv.code === code && !inv.used);
    return invite || null;
}

function markInviteAsUsed(code, username) {
    const invites = getInvites();
    const inviteIndex = invites.findIndex(inv => inv.code === code);
    if (inviteIndex !== -1) {
        invites[inviteIndex].used = true;
        invites[inviteIndex].usedBy = username;
        invites[inviteIndex].usedAt = new Date().toISOString();
        saveInvites(invites);
        return true;
    }
    return false;
}

function deleteInvite(inviteId) {
    const invites = getInvites();
    const filtered = invites.filter(inv => inv.id !== inviteId);
    saveInvites(filtered);
    return filtered.length < invites.length;
}

function registerDriver(driverData, inviteCode) {
    // Validate invite code
    const invite = validateInviteCode(inviteCode);
    if (!invite) {
        throw new Error('Invalid or already used invite code');
    }
    
    // Check if username already exists
    const drivers = getDrivers();
    if (drivers.find(d => d.username === driverData.username)) {
        throw new Error('Username already exists');
    }
    
    // Check if email already exists
    if (drivers.find(d => d.email === driverData.email)) {
        throw new Error('Email already registered');
    }
    
    // Create new driver
    const newDriver = {
        username: driverData.username,
        password: driverData.password,
        name: driverData.name,
        email: driverData.email,
        phone: driverData.phone || '',
        age: driverData.age || null,
        address: driverData.address || '',
        vehicle: driverData.vehicle || 'Vehicle TBD',
        vehicles: driverData.vehicles || []
    };
    
    drivers.push(newDriver);
    localStorage.setItem('drivers', JSON.stringify(drivers));
    
    // Mark invite as used
    markInviteAsUsed(inviteCode, driverData.username);
    
    return newDriver;
}

// Initialize on page load
if (typeof window !== 'undefined') {
    initializeDrivers();
    initializeAdmins();
    initializeRides();
    initializeDaysOff();
    initializeNotifications();
    initializeAdminNotifications();
    initializeReviews();
    initializeArchive();
    // Archive completed rides at start of each month
    archiveCompletedRides();
    
    // Initialize announcements
    if (typeof initializeAnnouncements === 'function') {
        initializeAnnouncements();
    }
    
    // Initialize invites
    initializeInvites();
    
    // Initialize messages
    initializeMessages();
}

// Messaging System
function initializeMessages() {
    if (!localStorage.getItem('messages')) {
        localStorage.setItem('messages', JSON.stringify([]));
    }
}

function getMessages() {
    const messages = localStorage.getItem('messages');
    return messages ? JSON.parse(messages) : [];
}

function saveMessages(messages) {
    localStorage.setItem('messages', JSON.stringify(messages));
}

// Send a message
function sendMessage(fromUsername, fromName, toUsername, toName, messageText) {
    const messages = getMessages();
    const newMessage = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        fromUsername: fromUsername,
        fromName: fromName,
        toUsername: toUsername,
        toName: toName,
        message: messageText,
        timestamp: new Date().toISOString(),
        read: false
    };
    messages.push(newMessage);
    saveMessages(messages);
    return newMessage;
}

// Get conversation between two users
function getConversation(user1Username, user2Username) {
    const messages = getMessages();
    return messages.filter(msg => 
        (msg.fromUsername === user1Username && msg.toUsername === user2Username) ||
        (msg.fromUsername === user2Username && msg.toUsername === user1Username)
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

// Get all conversations for a user
function getUserConversations(username) {
    const messages = getMessages();
    const conversations = {};
    
    messages.forEach(msg => {
        let otherUser, otherName;
        if (msg.fromUsername === username) {
            otherUser = msg.toUsername;
            otherName = msg.toName;
        } else if (msg.toUsername === username) {
            otherUser = msg.fromUsername;
            otherName = msg.fromName;
        } else {
            return; // Skip messages not involving this user
        }
        
        if (!conversations[otherUser]) {
            conversations[otherUser] = {
                username: otherUser,
                name: otherName,
                lastMessage: msg,
                unreadCount: 0
            };
        }
        
        // Update last message if this is more recent
        if (new Date(msg.timestamp) > new Date(conversations[otherUser].lastMessage.timestamp)) {
            conversations[otherUser].lastMessage = msg;
        }
        
        // Count unread messages
        if (msg.toUsername === username && !msg.read) {
            conversations[otherUser].unreadCount++;
        }
    });
    
    // Convert to array and sort by last message time
    return Object.values(conversations).sort((a, b) => 
        new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
    );
}

// Mark messages as read
function markConversationAsRead(user1Username, user2Username) {
    const messages = getMessages();
    let updated = false;
    
    messages.forEach(msg => {
        if (msg.toUsername === user1Username && msg.fromUsername === user2Username && !msg.read) {
            msg.read = true;
            updated = true;
        }
    });
    
    if (updated) {
        saveMessages(messages);
    }
    
    return updated;
}

// Get unread message count for a user
function getUnreadMessageCount(username) {
    const messages = getMessages();
    return messages.filter(msg => msg.toUsername === username && !msg.read).length;
}

// Handle login form (only if not already handled by page-specific script)
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm && !loginForm.hasAttribute('data-handler-attached')) {
            loginForm.setAttribute('data-handler-attached', 'true');
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                const messageDiv = document.getElementById('loginMessage');
                
                const driver = authenticateDriver(username, password);
                
                if (driver) {
                    setCurrentDriver(driver);
                    window.location.href = 'driver-dashboard.html';
                } else {
                    messageDiv.textContent = 'Invalid username or password';
                    messageDiv.className = 'login-message error';
                    messageDiv.style.display = 'block';
                }
            });
        }
    });
}

