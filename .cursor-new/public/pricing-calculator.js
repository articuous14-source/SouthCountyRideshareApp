// Pricing calculator for rides
// This file contains functions to calculate pricing based on destination, time, holidays, and baggage claim

// Major holidays list (you can expand this)
const MAJOR_HOLIDAYS = [
    '01-01', // New Year's Day
    '07-04', // Independence Day
    '12-25', // Christmas
    '12-31', // New Year's Eve
    '11-28', // Thanksgiving (example - adjust dates yearly)
    '12-24', // Christmas Eve
    // Add more holidays as needed
];

// Destination mapping - maps common location names to destination codes
const DESTINATION_MAP = {
    'john wayne': 'john-wayne-sna',
    'sna': 'john-wayne-sna',
    'orange county': 'john-wayne-sna',
    'los angeles': 'los-angeles-lax',
    'lax': 'los-angeles-lax',
    'long beach airport': 'long-beach-lgb',
    'lgb': 'long-beach-lgb',
    'san diego': 'san-diego-san',
    'san': 'san-diego-san',
    'ontario': 'ontario-ont',
    'ont': 'ontario-ont',
    'cbx': 'cross-border-cbx',
    'cross border': 'cross-border-cbx',
    'long beach cruise': 'long-beach-cruise',
    'cruise terminal': 'long-beach-cruise'
};

// Get destination code from pickup/destination strings
function getDestinationCode(pickup, destination) {
    const searchText = (pickup + ' ' + destination).toLowerCase();
    
    for (const [key, code] of Object.entries(DESTINATION_MAP)) {
        if (searchText.includes(key)) {
            return code;
        }
    }
    
    // Default to SNA if not found
    return 'john-wayne-sna';
}

// Check if date is a major holiday
function isMajorHoliday(dateString) {
    const date = new Date(dateString);
    const monthDay = String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    return MAJOR_HOLIDAYS.includes(monthDay);
}

// Check if time is after hours (8:00 PM to 6:00 AM)
function isAfterHours(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const hour24 = hours;
    return hour24 >= 20 || hour24 < 6; // 8 PM (20:00) to 6 AM (06:00)
}

// Calculate pricing for a ride
function calculatePricing(rideData, ratesData) {
    const destinationCode = getDestinationCode(rideData.pickup, rideData.destination);
    const destination = ratesData[destinationCode];
    
    if (!destination) {
        return {
            basePrice: 0,
            totalPrice: 0,
            breakdown: {
                basePrice: 0,
                baggageClaimFee: 0,
                afterHoursFee: 0,
                holidayFee: 0
            },
            destination: 'Unknown',
            vehicleType: rideData.vehicleType || 'Sedans',
            error: 'Destination not found in pricing database'
        };
    }
    
    // Get base price for selected vehicle type
    const vehicleType = rideData.vehicleType || 'Sedans';
    const vehicleRate = destination.rates.find(r => r.vehicle === vehicleType);
    const basePrice = vehicleRate ? parseFloat(vehicleRate.price.replace('$', '')) : 0;
    
    // Calculate additional fees
    let baggageClaimFee = 0;
    let afterHoursFee = 0;
    let holidayFee = 0;
    
    // Baggage claim meeting fee
    if (rideData.baggageClaim === 'Y') {
        baggageClaimFee = 25;
    }
    
    // After hours fee
    if (isAfterHours(rideData.time)) {
        // SNA has $10, all others have $20
        afterHoursFee = destinationCode === 'john-wayne-sna' ? 10 : 20;
    }
    
    // Major holiday fee
    if (isMajorHoliday(rideData.date)) {
        holidayFee = 20;
    }
    
    const totalPrice = basePrice + baggageClaimFee + afterHoursFee + holidayFee;
    
    return {
        basePrice: basePrice,
        totalPrice: totalPrice,
        breakdown: {
            basePrice: basePrice,
            baggageClaimFee: baggageClaimFee,
            afterHoursFee: afterHoursFee,
            holidayFee: holidayFee
        },
        destination: destination.name,
        vehicleType: vehicleType,
        destinationCode: destinationCode
    };
}

// Format price for display
function formatPrice(amount) {
    return '$' + amount.toFixed(2);
}

