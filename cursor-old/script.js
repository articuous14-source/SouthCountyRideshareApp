// Load driver-auth.js functions for ride storage
// Make sure driver-auth.js is loaded before this script
// Note: EmailJS is only needed for driver acceptance emails, not for form submissions

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Form submission handler - saves to driver portal
const reservationForm = document.getElementById('reservationForm');
const submitBtn = document.getElementById('submitBtn');
const formMessage = document.getElementById('formMessage');

if (reservationForm) {
    reservationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Disable submit button and show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        formMessage.textContent = '';
        formMessage.className = 'form-message';
        
        // Get form data
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);
        
        try {
            // Save ride to localStorage for driver portal
            if (typeof addRide !== 'undefined') {
                // Create the outbound trip
                addRide({
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    pickup: data.pickup,
                    destination: data.destination,
                    date: data.date,
                    time: data.time,
                    passengers: data.passengers,
                    vehicleType: data.vehicleType,
                    baggageClaim: data.baggageClaim === 'Y' ? 'Y' : 'N',
                    flightNumber: data.flightNumber || '',
                    airline: data.airline || '',
                    pickupAddress: data.pickup === 'Home' ? {
                        street: data.pickupStreet || '',
                        city: data.pickupCity || '',
                        state: data.pickupState || '',
                        zip: data.pickupZip || ''
                    } : data.pickup === 'Other' ? {
                        street: data.pickupOtherStreet || '',
                        city: data.pickupOtherCity || '',
                        state: data.pickupOtherState || '',
                        zip: data.pickupOtherZip || ''
                    } : null,
                    destinationAddress: data.destination === 'Home' ? {
                        street: data.destinationStreet || '',
                        city: data.destinationCity || '',
                        state: data.destinationState || '',
                        zip: data.destinationZip || ''
                    } : data.destination === 'Other' ? {
                        street: data.destinationOtherStreet || '',
                        city: data.destinationOtherCity || '',
                        state: data.destinationOtherState || '',
                        zip: data.destinationOtherZip || ''
                    } : null
                });
                
                // If round trip, create the return trip
                if (data.roundTrip === 'on') {
                    addRide({
                        name: data.name,
                        email: data.email,
                        phone: data.phone,
                        pickup: data.returnPickup,
                        destination: data.returnDestination,
                        date: data.returnDate,
                        time: data.returnTime,
                        passengers: data.returnPassengers || data.passengers,
                        vehicleType: data.returnVehicleType || data.vehicleType,
                        baggageClaim: data.returnBaggageClaim === 'Y' ? 'Y' : 'N',
                        flightNumber: data.returnFlightNumber || '',
                        airline: data.returnAirline || '',
                        pickupAddress: data.returnPickup === 'Home' ? {
                            street: data.returnPickupStreet || '',
                            city: data.returnPickupCity || '',
                            state: data.returnPickupState || '',
                            zip: data.returnPickupZip || ''
                        } : data.returnPickup === 'Other' ? {
                            street: data.returnPickupOtherStreet || '',
                            city: data.returnPickupOtherCity || '',
                            state: data.returnPickupOtherState || '',
                            zip: data.returnPickupOtherZip || ''
                        } : null,
                        destinationAddress: data.returnDestination === 'Home' ? {
                            street: data.returnDestinationStreet || '',
                            city: data.returnDestinationCity || '',
                            state: data.returnDestinationState || '',
                            zip: data.returnDestinationZip || ''
                        } : data.returnDestination === 'Other' ? {
                            street: data.returnDestinationOtherStreet || '',
                            city: data.returnDestinationOtherCity || '',
                            state: data.returnDestinationOtherState || '',
                            zip: data.returnDestinationOtherZip || ''
                        } : null
                    });
                }
                
                // Success
                const tripText = data.roundTrip === 'on' ? 'reservation requests have' : 'reservation request has';
                formMessage.textContent = `Thank you! Your ${tripText} been submitted successfully. A driver will review your request and contact you shortly to confirm your ride${data.roundTrip === 'on' ? 's' : ''}.`;
                formMessage.className = 'form-message success';
                this.reset();
            } else {
                throw new Error('Driver portal system not loaded');
            }
            
        } catch (error) {
            // Error
            console.error('Error saving reservation:', error);
            let errorMessage = 'Sorry, there was an error submitting your request. Please try again or contact us directly at articuous14@gmail.com';
            
            // Check if it's a blocked customer error
            if (error.message && error.message.includes('blocked')) {
                errorMessage = error.message;
            }
            
            formMessage.textContent = errorMessage;
            formMessage.className = 'form-message error';
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Reservation';
        }
    });
}

// Set minimum date to today for date input
const dateInput = document.getElementById('date');
if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
}

// Header scroll effect
let lastScroll = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
    }
    
    lastScroll = currentScroll;
});

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe sections for animation
document.querySelectorAll('.section, .community-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Toggle About section dropdowns
function toggleAboutDropdown(type) {
    const content = document.getElementById(`${type}-content`);
    const arrow = document.getElementById(`${type}-arrow`);
    
    if (!content || !arrow) return;
    
    const isOpen = content.style.display === 'block';
    
    // Close all other dropdowns
    document.querySelectorAll('.about-dropdown-content').forEach(dropdown => {
        if (dropdown.id !== `${type}-content`) {
            dropdown.style.display = 'none';
        }
    });
    document.querySelectorAll('.about-dropdown-btn').forEach(button => {
        button.classList.remove('active');
    });
    document.querySelectorAll('.dropdown-arrow').forEach(arrowEl => {
        if (arrowEl.id !== `${type}-arrow`) {
            arrowEl.textContent = '▼';
        }
    });
    
    // Toggle current dropdown
    if (isOpen) {
        content.style.display = 'none';
        arrow.textContent = '▼';
    } else {
        content.style.display = 'block';
        arrow.textContent = '▲';
        
        // Load content when opening
        if (type === 'drivers') {
            loadDrivers();
        } else if (type === 'announcements') {
            loadAnnouncements();
        }
    }
}

// Load and display drivers
function loadDrivers() {
    const driversDisplay = document.getElementById('driversDisplay');
    
    if (!driversDisplay) return;
    
    // Mock driver data
    const drivers = [
        {
            name: "John Smith",
            vehicle: "Toyota Camry"
        },
        {
            name: "Sarah Johnson",
            vehicle: "Honda Pilot"
        },
        {
            name: "Michael Chen",
            vehicle: "Chevrolet Suburban"
        }
    ];
    
    driversDisplay.innerHTML = drivers.map(driver => {
        const initial = driver.name.charAt(0).toUpperCase();
        const photoSrc = `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
                <rect width="120" height="120" fill="#e0e0e0"/>
                <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#666" font-size="48" font-family="Arial, sans-serif" font-weight="bold">${initial}</text>
            </svg>
        `)}`;
        
        return `
            <div class="driver-card">
                <img src="${photoSrc}" alt="${driver.name}" class="driver-photo" onerror="this.style.display='none'">
                <div class="driver-name">${driver.name}</div>
                <div class="driver-vehicle">${driver.vehicle}</div>
            </div>
        `;
    }).join('');
}

// Load and display announcements
function loadAnnouncements() {
    const announcementsDisplay = document.getElementById('announcementsDisplay');
    
    if (!announcementsDisplay) return;
    
    // Mock announcement data
    const announcements = [
        {
            title: "Welcome to South County Ride Share!",
            content: "We're happy to serve the South Orange County community with reliable transportation services. Book your ride today!",
            createdAt: new Date().toISOString()
        }
    ];
    
    announcementsDisplay.innerHTML = announcements.map(announcement => {
        const date = new Date(announcement.createdAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
        
        return `
            <div class="announcement-item">
                <div class="announcement-title">${announcement.title}</div>
                <div class="announcement-date">${date}</div>
                <div class="announcement-content">${announcement.content}</div>
            </div>
        `;
    }).join('');
}

// Pricing structure - prices per vehicle type per destination
const PRICING = {
    // Fixed prices for each destination and vehicle type (one-way)
    destinations: {
        'John Wayne Airport (SNA)': { 
            name: 'John Wayne Airport (SNA)',
            prices: { 'SEDAN': 50, 'SUV': 65, 'XL SUV': 80 }
        },
        'Los Angeles Airport (LAX)': { 
            name: 'Los Angeles Airport (LAX)',
            prices: { 'SEDAN': 125, 'SUV': 165, 'XL SUV': 195 }
        },
        'Long Beach Airport (LGB)': { 
            name: 'Long Beach Airport (LGB)',
            prices: { 'SEDAN': 75, 'SUV': 95, 'XL SUV': 115 }
        },
        'San Diego Airport (SAN)': { 
            name: 'San Diego Airport (SAN)',
            prices: { 'SEDAN': 150, 'SUV': 190, 'XL SUV': 225 }
        },
        'Ontario Airport (ONT)': { 
            name: 'Ontario Airport (ONT)',
            prices: { 'SEDAN': 95, 'SUV': 120, 'XL SUV': 145 }
        },
        'Cross Border (CBX)': { 
            name: 'Cross Border Express (CBX)',
            prices: { 'SEDAN': 165, 'SUV': 210, 'XL SUV': 250 }
        },
        'Long Beach Cruise Terminal': { 
            name: 'Long Beach Cruise Terminal',
            prices: { 'SEDAN': 80, 'SUV': 100, 'XL SUV': 120 }
        },
        'Home': { 
            name: 'Your Location',
            prices: { 'SEDAN': 0, 'SUV': 0, 'XL SUV': 0 }
        },
        'Other': { 
            name: 'Custom Location',
            prices: { 'SEDAN': 0, 'SUV': 0, 'XL SUV': 0 }
        }
    },
    
    // Additional fees
    baggageClaimFee: 25, // Driver meets in baggage claim
    afterHoursFee: 20, // After hours surcharge (8 PM - 6 AM)
    afterHoursStart: 20, // 8 PM (20:00)
    afterHoursEnd: 6, // 6 AM (06:00)
    majorHolidayFee: 20 // Major holiday surcharge
};

// Check if time is after hours
function isAfterHours(timeString) {
    if (!timeString) return false;
    
    const [hours, minutes] = timeString.split(':').map(Number);
    const { afterHoursStart, afterHoursEnd } = PRICING;
    
    // After hours is from 8 PM to 6 AM
    // If hours >= 20 (8 PM) OR hours < 6 (6 AM)
    return hours >= afterHoursStart || hours < afterHoursEnd;
}

// Check if date is a major holiday
function isMajorHoliday(dateString) {
    if (!dateString) return false;
    
    const date = new Date(dateString + 'T00:00:00'); // Ensure correct date parsing
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();
    
    // Major holidays
    const majorHolidays = [
        { month: 1, day: 1 },    // New Year's Day
        { month: 7, day: 4 },    // Independence Day
        { month: 12, day: 24 },  // Christmas Eve
        { month: 12, day: 25 },  // Christmas Day
        { month: 12, day: 31 },  // New Year's Eve
        { month: 11, day: 27 },  // Thanksgiving (2025) - update yearly
        { month: 11, day: 28 }   // Day after Thanksgiving (2025)
    ];
    
    return majorHolidays.some(holiday => 
        holiday.month === month && holiday.day === day
    );
}

// Calculate trip price
function calculatePrice() {
    const pickup = document.getElementById('pickup').value;
    const destination = document.getElementById('destination').value;
    const vehicleType = document.getElementById('vehicleType').value;
    const baggageClaim = document.getElementById('baggageClaim')?.checked || false;
    const isRoundTrip = document.getElementById('roundTrip')?.checked || false;
    const tripTime = document.getElementById('time')?.value || '';
    const tripDate = document.getElementById('date')?.value || '';
    
    // Return trip details
    const returnBaggageClaim = document.getElementById('returnBaggageClaim')?.checked || false;
    const returnTime = document.getElementById('returnTime')?.value || '';
    const returnDate = document.getElementById('returnDate')?.value || '';
    
    // Need at least pickup, destination, and vehicle type
    if (!pickup || !destination || !vehicleType) {
        document.getElementById('priceBreakdown').style.display = 'none';
        return;
    }
    
    // Get the fare based on route and vehicle type
    let fare = 0;
    let routeName = '';
    let returnRouteName = '';
    let destinationObj = null;
    
    // Determine the main route
    if (pickup === 'Home' && destination in PRICING.destinations) {
        destinationObj = PRICING.destinations[destination];
        fare = destinationObj.prices[vehicleType] || 0;
        routeName = `Home → ${destinationObj.name}`;
        returnRouteName = `${destinationObj.name} → Home`;
    } else if (destination === 'Home' && pickup in PRICING.destinations) {
        destinationObj = PRICING.destinations[pickup];
        fare = destinationObj.prices[vehicleType] || 0;
        routeName = `${destinationObj.name} → Home`;
        returnRouteName = `Home → ${destinationObj.name}`;
    } else if (pickup in PRICING.destinations && destination in PRICING.destinations) {
        // Between two known locations - use the destination with higher price
        const pickupObj = PRICING.destinations[pickup];
        const destObj = PRICING.destinations[destination];
        const pickupPrice = pickupObj.prices[vehicleType] || 0;
        const destPrice = destObj.prices[vehicleType] || 0;
        
        if (pickupPrice >= destPrice) {
            destinationObj = pickupObj;
            fare = pickupPrice;
            routeName = `${pickupObj.name} → ${destObj.name}`;
            returnRouteName = `${destObj.name} → ${pickupObj.name}`;
        } else {
            destinationObj = destObj;
            fare = destPrice;
            routeName = `${pickupObj.name} → ${destObj.name}`;
            returnRouteName = `${destObj.name} → ${pickupObj.name}`;
        }
    }
    
    // If either is "Other", show message that quote is needed
    if (pickup === 'Other' || destination === 'Other') {
        document.getElementById('priceBreakdown').style.display = 'block';
        document.getElementById('priceDetails').innerHTML = `
            <div style="text-align: center; padding: 1rem; color: #666;">
                <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">📍 Custom Location Selected</p>
                <p style="font-size: 0.9rem;">For custom locations, we'll provide a personalized quote after reviewing your reservation request.</p>
            </div>
        `;
        document.getElementById('totalPrice').textContent = 'Quote Required';
        document.getElementById('returnTripNote').style.display = 'none';
        return;
    }
    
    if (fare === 0) {
        document.getElementById('priceBreakdown').style.display = 'none';
        return;
    }
    
    // Calculate Trip 1 fees
    const trip1BaggageClaimFee = baggageClaim ? PRICING.baggageClaimFee : 0;
    const trip1AfterHoursFee = isAfterHours(tripTime) ? PRICING.afterHoursFee : 0;
    const trip1MajorHolidayFee = isMajorHoliday(tripDate) ? PRICING.majorHolidayFee : 0;
    const trip1Total = fare + trip1BaggageClaimFee + trip1AfterHoursFee + trip1MajorHolidayFee;
    
    // Build price details HTML
    let detailsHTML = '';
    let finalTotal = 0;
    
    // Handle round trip - show separate breakdowns
    if (isRoundTrip) {
        // Calculate Trip 2 fees
        const trip2BaggageClaimFee = returnBaggageClaim ? PRICING.baggageClaimFee : 0;
        const trip2AfterHoursFee = isAfterHours(returnTime) ? PRICING.afterHoursFee : 0;
        const trip2MajorHolidayFee = isMajorHoliday(returnDate) ? PRICING.majorHolidayFee : 0;
        const trip2Total = fare + trip2BaggageClaimFee + trip2AfterHoursFee + trip2MajorHolidayFee;
        
        // Trip 1 Breakdown
        detailsHTML += `
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <h4 style="color: #5BA3D0; margin: 0 0 0.75rem 0; font-size: 1.1rem; border-bottom: 2px solid #5BA3D0; padding-bottom: 0.5rem;">
                    🚗 Trip 1: Outbound
                </h4>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0;">
                    <span style="color: #666;">Route:</span>
                    <span style="font-weight: 600; color: #333;">${routeName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0;">
                    <span style="color: #666;">Vehicle:</span>
                    <span style="font-weight: 600; color: #333;">${vehicleType}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0;">
                    <span style="color: #666;">Transportation Cost:</span>
                    <span style="font-weight: 500; color: #333;">$${fare.toFixed(2)}</span>
                </div>
        `;
        
        if (trip1BaggageClaimFee > 0) {
            detailsHTML += `
                <div style="padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span style="color: #666;">Baggage Claim Meet & Greet:</span>
                        <span style="font-weight: 500; color: #333;">+$${trip1BaggageClaimFee.toFixed(2)}</span>
                    </div>
                    <div style="font-size: 0.85rem; color: #888; font-style: italic;">
                        Driver will meet passenger inside of the baggage claim and escort them to parked vehicle.
                    </div>
                </div>
            `;
        }
        
        if (trip1AfterHoursFee > 0) {
            detailsHTML += `
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0;">
                    <span style="color: #666;">🌙 After Hours Fee (8PM-6AM):</span>
                    <span style="font-weight: 500; color: #333;">+$${trip1AfterHoursFee.toFixed(2)}</span>
                </div>
            `;
        }
        
        if (trip1MajorHolidayFee > 0) {
            detailsHTML += `
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0;">
                    <span style="color: #666;">🎉 Major Holiday Fee:</span>
                    <span style="font-weight: 500; color: #333;">+$${trip1MajorHolidayFee.toFixed(2)}</span>
                </div>
            `;
        }
        
        detailsHTML += `
                <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; margin-top: 0.5rem; background: white; border-radius: 4px; padding-left: 0.5rem; padding-right: 0.5rem;">
                    <span style="color: #333; font-weight: 600;">Trip 1 Total:</span>
                    <span style="font-weight: 700; color: #5BA3D0; font-size: 1.1rem;">$${trip1Total.toFixed(2)}</span>
                </div>
            </div>
        `;
        
        // Trip 2 Breakdown
        detailsHTML += `
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <h4 style="color: #5BA3D0; margin: 0 0 0.75rem 0; font-size: 1.1rem; border-bottom: 2px solid #5BA3D0; padding-bottom: 0.5rem;">
                    🔄 Trip 2: Return
                </h4>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0;">
                    <span style="color: #666;">Route:</span>
                    <span style="font-weight: 600; color: #333;">${returnRouteName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0;">
                    <span style="color: #666;">Vehicle:</span>
                    <span style="font-weight: 600; color: #333;">${vehicleType}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0;">
                    <span style="color: #666;">Transportation Cost:</span>
                    <span style="font-weight: 500; color: #333;">$${fare.toFixed(2)}</span>
                </div>
        `;
        
        if (trip2BaggageClaimFee > 0) {
            detailsHTML += `
                <div style="padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span style="color: #666;">Baggage Claim Meet & Greet:</span>
                        <span style="font-weight: 500; color: #333;">+$${trip2BaggageClaimFee.toFixed(2)}</span>
                    </div>
                    <div style="font-size: 0.85rem; color: #888; font-style: italic;">
                        Driver will meet passenger inside of the baggage claim and escort them to parked vehicle.
                    </div>
                </div>
            `;
        }
        
        if (trip2AfterHoursFee > 0) {
            detailsHTML += `
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0;">
                    <span style="color: #666;">🌙 After Hours Fee (8PM-6AM):</span>
                    <span style="font-weight: 500; color: #333;">+$${trip2AfterHoursFee.toFixed(2)}</span>
                </div>
            `;
        }
        
        if (trip2MajorHolidayFee > 0) {
            detailsHTML += `
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0;">
                    <span style="color: #666;">🎉 Major Holiday Fee:</span>
                    <span style="font-weight: 500; color: #333;">+$${trip2MajorHolidayFee.toFixed(2)}</span>
                </div>
            `;
        }
        
        detailsHTML += `
                <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; margin-top: 0.5rem; background: white; border-radius: 4px; padding-left: 0.5rem; padding-right: 0.5rem;">
                    <span style="color: #333; font-weight: 600;">Trip 2 Total:</span>
                    <span style="font-weight: 700; color: #5BA3D0; font-size: 1.1rem;">$${trip2Total.toFixed(2)}</span>
                </div>
            </div>
        `;
        
        finalTotal = trip1Total + trip2Total;
        document.getElementById('returnTripNote').style.display = 'block';
    } else {
        // One-way trip
        detailsHTML = `
            <div style="margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0;">
                    <span style="color: #666;">Route:</span>
                    <span style="font-weight: 600; color: #333;">${routeName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0;">
                    <span style="color: #666;">Vehicle:</span>
                    <span style="font-weight: 600; color: #333;">${vehicleType}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0;">
                    <span style="color: #666;">Transportation Cost:</span>
                    <span style="font-weight: 500; color: #333;">$${fare.toFixed(2)}</span>
                </div>
        `;
        
        if (trip1BaggageClaimFee > 0) {
            detailsHTML += `
                <div style="padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span style="color: #666;">Baggage Claim Meet & Greet:</span>
                        <span style="font-weight: 500; color: #333;">+$${trip1BaggageClaimFee.toFixed(2)}</span>
                    </div>
                    <div style="font-size: 0.85rem; color: #888; font-style: italic;">
                        Driver will meet passenger inside of the baggage claim and escort them to parked vehicle.
                    </div>
                </div>
            `;
        }
        
        if (trip1AfterHoursFee > 0) {
            detailsHTML += `
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0;">
                    <span style="color: #666;">🌙 After Hours Fee (8PM-6AM):</span>
                    <span style="font-weight: 500; color: #333;">+$${trip1AfterHoursFee.toFixed(2)}</span>
                </div>
            `;
        }
        
        if (trip1MajorHolidayFee > 0) {
            detailsHTML += `
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0;">
                    <span style="color: #666;">🎉 Major Holiday Fee:</span>
                    <span style="font-weight: 500; color: #333;">+$${trip1MajorHolidayFee.toFixed(2)}</span>
                </div>
            `;
        }
        
        detailsHTML += `</div>`;
        
        finalTotal = trip1Total;
        document.getElementById('returnTripNote').style.display = 'none';
    }
    
    // Update the display
    document.getElementById('priceDetails').innerHTML = detailsHTML;
    document.getElementById('totalPrice').textContent = `$${finalTotal.toFixed(2)}`;
    document.getElementById('priceBreakdown').style.display = 'block';
}

// Toggle flight info section
function toggleFlightInfo(tripType = '') {
    const prefix = tripType === 'return' ? 'return' : '';
    const checkbox = document.getElementById(prefix ? 'returnIsAirportTrip' : 'isAirportTrip');
    const flightInfoSection = document.getElementById(prefix ? 'returnFlightInfoSection' : 'flightInfoSection');
    const flightNumber = document.getElementById(prefix ? 'returnFlightNumber' : 'flightNumber');
    const airline = document.getElementById(prefix ? 'returnAirline' : 'airline');
    
    if (!checkbox || !flightInfoSection) return;
    
    if (checkbox.checked) {
        flightInfoSection.style.display = 'block';
        // Make flight info fields REQUIRED
        if (flightNumber) flightNumber.required = true;
        if (airline) airline.required = true;
    } else {
        flightInfoSection.style.display = 'none';
        // Remove required attribute when hidden
        if (flightNumber) {
            flightNumber.required = false;
            flightNumber.value = ''; // Clear value
        }
        if (airline) {
            airline.required = false;
            airline.value = ''; // Clear value
        }
    }
}

// Toggle round trip section
function toggleRoundTrip() {
    const checkbox = document.getElementById('roundTrip');
    const returnTripSection = document.getElementById('returnTripSection');
    
    if (!checkbox || !returnTripSection) return;
    
    if (checkbox.checked) {
        returnTripSection.style.display = 'block';
    } else {
        returnTripSection.style.display = 'none';
    }
    
    // Check if we should show the "same address" option
    checkShowSameAddressOption();
    
    // Trigger price calculation
    calculatePrice();
}

// Check if location is an airport
function isAirportLocation(location) {
    if (!location) return false;
    const airportLocations = [
        'John Wayne Airport (SNA)',
        'Los Angeles Airport (LAX)',
        'Long Beach Airport (LGB)',
        'San Diego Airport (SAN)',
        'Ontario Airport (ONT)',
        'Cross Border (CBX)'
    ];
    return airportLocations.includes(location);
}

// Copy outbound home address to return trip
function copyOutboundHomeAddress(type) {
    // type is either 'pickup' or 'destination'
    const checkboxId = type === 'pickup' ? 'useOutboundPickupAddress' : 'useOutboundDestinationAddress';
    const checkbox = document.getElementById(checkboxId);
    
    if (!checkbox) return;
    
    const isChecked = checkbox.checked;
    
    // Find source fields (could be from outbound pickup OR destination, whichever has "Home")
    let sourceStreet, sourceCity, sourceState, sourceZip;
    
    const pickup = document.getElementById('pickup')?.value;
    const destination = document.getElementById('destination')?.value;
    const pickupHomeAddressVisible = document.getElementById('pickupHomeAddress')?.style.display !== 'none';
    const destHomeAddressVisible = document.getElementById('destinationHomeAddress')?.style.display !== 'none';
    
    // Check pickup first, then destination
    if (pickup === 'Home' && pickupHomeAddressVisible) {
        sourceStreet = document.getElementById('pickupStreet');
        sourceCity = document.getElementById('pickupCity');
        sourceState = document.getElementById('pickupState');
        sourceZip = document.getElementById('pickupZip');
    } else if (destination === 'Home' && destHomeAddressVisible) {
        sourceStreet = document.getElementById('destinationStreet');
        sourceCity = document.getElementById('destinationCity');
        sourceState = document.getElementById('destinationState');
        sourceZip = document.getElementById('destinationZip');
    }
    
    // Target fields (return)
    const prefix = type === 'pickup' ? 'returnPickup' : 'returnDestination';
    const targetStreet = document.getElementById(`${prefix}Street`);
    const targetCity = document.getElementById(`${prefix}City`);
    const targetState = document.getElementById(`${prefix}State`);
    const targetZip = document.getElementById(`${prefix}Zip`);
    
    if (isChecked) {
        // Copy values from outbound to return
        if (sourceStreet && targetStreet) targetStreet.value = sourceStreet.value;
        if (sourceCity && targetCity) targetCity.value = sourceCity.value;
        if (sourceState && targetState) targetState.value = sourceState.value;
        if (sourceZip && targetZip) targetZip.value = sourceZip.value;
        
        // Make fields read-only when using copied address
        if (targetStreet) targetStreet.readOnly = true;
        if (targetCity) targetCity.readOnly = true;
        if (targetState) targetState.readOnly = true;
        if (targetZip) targetZip.readOnly = true;
        
        // Add visual indication that fields are locked
        [targetStreet, targetCity, targetState, targetZip].forEach(field => {
            if (field) field.style.backgroundColor = '#f0f0f0';
        });
    } else {
        // Clear and unlock fields
        if (targetStreet) {
            targetStreet.value = '';
            targetStreet.readOnly = false;
            targetStreet.style.backgroundColor = '';
        }
        if (targetCity) {
            targetCity.value = '';
            targetCity.readOnly = false;
            targetCity.style.backgroundColor = '';
        }
        if (targetState) {
            targetState.value = '';
            targetState.readOnly = false;
            targetState.style.backgroundColor = '';
        }
        if (targetZip) {
            targetZip.value = '';
            targetZip.readOnly = false;
            targetZip.style.backgroundColor = '';
        }
    }
}

// Check if we should show the "use same address" checkbox
function checkShowSameAddressOption() {
    // Check if ANY home address was entered on outbound trip
    const pickup = document.getElementById('pickup')?.value;
    const destination = document.getElementById('destination')?.value;
    const pickupHomeAddressVisible = document.getElementById('pickupHomeAddress')?.style.display !== 'none';
    const destHomeAddressVisible = document.getElementById('destinationHomeAddress')?.style.display !== 'none';
    
    const outboundHasHomeAddress = (pickup === 'Home' && pickupHomeAddressVisible) || 
                                   (destination === 'Home' && destHomeAddressVisible);
    
    // Check for return pickup
    const returnPickup = document.getElementById('returnPickup')?.value;
    const returnPickupHomeAddressVisible = document.getElementById('returnPickupHomeAddress')?.style.display !== 'none';
    
    const pickupSameAsOutboundDiv = document.getElementById('returnPickupSameAsOutbound');
    if (pickupSameAsOutboundDiv) {
        if (outboundHasHomeAddress && returnPickup === 'Home' && returnPickupHomeAddressVisible) {
            pickupSameAsOutboundDiv.style.display = 'block';
        } else {
            pickupSameAsOutboundDiv.style.display = 'none';
            // Uncheck and clear if hidden
            const checkbox = document.getElementById('useOutboundPickupAddress');
            if (checkbox && checkbox.checked) {
                checkbox.checked = false;
                copyOutboundHomeAddress('pickup');
            }
        }
    }
    
    // Check for return destination
    const returnDestination = document.getElementById('returnDestination')?.value;
    const returnDestHomeAddressVisible = document.getElementById('returnDestinationHomeAddress')?.style.display !== 'none';
    
    const destSameAsOutboundDiv = document.getElementById('returnDestinationSameAsOutbound');
    if (destSameAsOutboundDiv) {
        if (outboundHasHomeAddress && returnDestination === 'Home' && returnDestHomeAddressVisible) {
            destSameAsOutboundDiv.style.display = 'block';
        } else {
            destSameAsOutboundDiv.style.display = 'none';
            // Uncheck and clear if hidden
            const checkbox = document.getElementById('useOutboundDestinationAddress');
            if (checkbox && checkbox.checked) {
                checkbox.checked = false;
                copyOutboundHomeAddress('destination');
            }
        }
    }
}

// Expose to global scope
window.copyOutboundHomeAddress = copyOutboundHomeAddress;

// Handle location dropdown changes
function handleLocationChange(locationType) {
    const locationSelect = document.getElementById(locationType);
    if (!locationSelect) return;
    
    const selectedValue = locationSelect.value;
    
    // Handle "Other" option - show address fields
    const otherAddressDiv = document.getElementById(locationType + 'OtherAddress');
    const homeAddressDiv = document.getElementById(locationType + 'HomeAddress');
    
    // Hide all address fields first
    if (otherAddressDiv) otherAddressDiv.style.display = 'none';
    if (homeAddressDiv) homeAddressDiv.style.display = 'none';
    
    if (selectedValue === 'Other' && otherAddressDiv) {
        otherAddressDiv.style.display = 'block';
    } else if (selectedValue === 'Home' && homeAddressDiv) {
        homeAddressDiv.style.display = 'block';
    }
    
    // Check if this is a pickup location and if it's an airport
    if (locationType === 'pickup') {
        const isAirportTripCheckbox = document.getElementById('isAirportTrip');
        const baggageClaimGroup = document.getElementById('baggageClaimGroup');
        
        if (isAirportLocation(selectedValue)) {
            // Auto-check and disable the "This is an airport trip" checkbox
            if (isAirportTripCheckbox) {
                isAirportTripCheckbox.checked = true;
                isAirportTripCheckbox.disabled = true;
                toggleFlightInfo(); // Show flight info section and make fields required
            }
            // Show baggage claim option
            if (baggageClaimGroup) {
                baggageClaimGroup.style.display = 'block';
            }
        } else {
            // Uncheck, enable checkbox, and hide flight info
            if (isAirportTripCheckbox) {
                isAirportTripCheckbox.checked = false;
                isAirportTripCheckbox.disabled = false;
                toggleFlightInfo(); // Hide flight info section and remove required
            }
            // Hide baggage claim option
            if (baggageClaimGroup) {
                baggageClaimGroup.style.display = 'none';
                const baggageClaimCheckbox = document.getElementById('baggageClaim');
                if (baggageClaimCheckbox) baggageClaimCheckbox.checked = false;
            }
        }
    }
    
    // Check if this is a return pickup location and if it's an airport
    if (locationType === 'returnPickup') {
        const returnIsAirportTripCheckbox = document.getElementById('returnIsAirportTrip');
        const returnBaggageClaimGroup = document.getElementById('returnBaggageClaimGroup');
        
        if (isAirportLocation(selectedValue)) {
            // Auto-check and disable the "This is an airport trip" checkbox for return
            if (returnIsAirportTripCheckbox) {
                returnIsAirportTripCheckbox.checked = true;
                returnIsAirportTripCheckbox.disabled = true;
                toggleFlightInfo('return'); // Show flight info section and make fields required
            }
            // Show baggage claim option
            if (returnBaggageClaimGroup) {
                returnBaggageClaimGroup.style.display = 'block';
            }
        } else {
            // Uncheck, enable checkbox, and hide flight info
            if (returnIsAirportTripCheckbox) {
                returnIsAirportTripCheckbox.checked = false;
                returnIsAirportTripCheckbox.disabled = false;
                toggleFlightInfo('return'); // Hide flight info section and remove required
            }
            // Hide baggage claim option
            if (returnBaggageClaimGroup) {
                returnBaggageClaimGroup.style.display = 'none';
                const returnBaggageClaimCheckbox = document.getElementById('returnBaggageClaim');
                if (returnBaggageClaimCheckbox) returnBaggageClaimCheckbox.checked = false;
            }
        }
    }
    
    // Check if we should show the "same address" option
    checkShowSameAddressOption();
    
    // Trigger price calculation
    calculatePrice();
}

// Update vehicle type options based on passenger count
function updateVehicleTypeOptions(tripType = '') {
    const prefix = tripType === 'return' ? 'return' : '';
    const passengersInput = document.getElementById(prefix ? 'returnPassengers' : 'passengers');
    const vehicleTypeSelect = document.getElementById(prefix ? 'returnVehicleType' : 'vehicleType');
    
    if (!passengersInput || !vehicleTypeSelect) return;
    
    const passengerCount = parseInt(passengersInput.value) || 0;
    const sedanOption = vehicleTypeSelect.querySelector('option[value="SEDAN"]');
    const suvOption = vehicleTypeSelect.querySelector('option[value="SUV"]');
    const xlSuvOption = vehicleTypeSelect.querySelector('option[value="XL SUV"]');
    
    // Reset all options first
    if (sedanOption) {
        sedanOption.disabled = false;
        sedanOption.style.display = 'block';
    }
    if (suvOption) {
        suvOption.disabled = false;
        suvOption.style.display = 'block';
    }
    if (xlSuvOption) {
        xlSuvOption.disabled = false;
        xlSuvOption.style.display = 'block';
    }
    
    if (passengerCount > 4) {
        // 5-6 passengers: Only XL SUV available
        if (sedanOption) {
            sedanOption.disabled = true;
            sedanOption.style.display = 'none';
        }
        if (suvOption) {
            suvOption.disabled = true;
            suvOption.style.display = 'none';
        }
        // Auto-select XL SUV if nothing is selected
        if (vehicleTypeSelect.value === '' || vehicleTypeSelect.value === 'SEDAN' || vehicleTypeSelect.value === 'SUV') {
            vehicleTypeSelect.value = 'XL SUV';
        }
    } else if (passengerCount === 4) {
        // 4 passengers: Only SUV and XL SUV available
        if (sedanOption) {
            sedanOption.disabled = true;
            sedanOption.style.display = 'none';
        }
        // If Sedan is currently selected, clear the selection
        if (vehicleTypeSelect.value === 'SEDAN') {
            vehicleTypeSelect.value = '';
        }
    }
    
    // Trigger price calculation if this is the main trip
    if (!prefix) {
        calculatePrice();
    }
}

// Set minimum date to today for date inputs
function setMinimumDates() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('date');
    const returnDateInput = document.getElementById('returnDate');
    
    if (dateInput) dateInput.setAttribute('min', today);
    if (returnDateInput) returnDateInput.setAttribute('min', today);
}

// Add event listeners to form fields to trigger price calculation
document.addEventListener('DOMContentLoaded', function() {
    // Set minimum dates
    setMinimumDates();
    
    // Add price calculation listeners
    const priceCalculationFields = ['pickup', 'destination', 'vehicleType', 'baggageClaim', 'roundTrip', 'time', 'date', 'returnBaggageClaim', 'returnTime', 'returnDate'];
    
    priceCalculationFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('change', calculatePrice);
            if (fieldId === 'time' || fieldId === 'returnTime') {
                field.addEventListener('input', calculatePrice); // Update as they type
            }
        }
    });
});

// Expose functions to global scope for HTML handlers
window.toggleAboutDropdown = toggleAboutDropdown;
window.calculatePrice = calculatePrice;
window.updateVehicleTypeOptions = updateVehicleTypeOptions;
window.handleLocationChange = handleLocationChange;
window.toggleFlightInfo = toggleFlightInfo;
window.toggleRoundTrip = toggleRoundTrip;

