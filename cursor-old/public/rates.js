// Version number - increment this to force update of localStorage
const RATES_VERSION = 3;

// Initialize rates from localStorage or use default
function initializeRates() {
    const savedVersion = localStorage.getItem('pricingRatesVersion');
    const savedRates = localStorage.getItem('pricingRates');
    
    // If version doesn't match, force update with new defaults
    if (!savedVersion || parseInt(savedVersion) < RATES_VERSION || !savedRates) {
        saveRates(DEFAULT_RATES);
        localStorage.setItem('pricingRatesVersion', RATES_VERSION);
        return DEFAULT_RATES;
    }
    
    if (savedRates) {
        const parsed = JSON.parse(savedRates);
        // Update descriptions to match current defaults (in case they were updated)
        Object.keys(parsed).forEach(destKey => {
            if (DEFAULT_RATES[destKey] && parsed[destKey].additionalFees) {
                parsed[destKey].additionalFees.forEach((fee, index) => {
                    if (DEFAULT_RATES[destKey].additionalFees[index]) {
                        fee.description = DEFAULT_RATES[destKey].additionalFees[index].description;
                    }
                });
            }
        });
        saveRates(parsed);
        return parsed;
    }
    // Save default rates to localStorage
    saveRates(DEFAULT_RATES);
    localStorage.setItem('pricingRatesVersion', RATES_VERSION);
    return DEFAULT_RATES;
}

// Save rates to localStorage
function saveRates(rates) {
    localStorage.setItem('pricingRates', JSON.stringify(rates));
}

// Get rates (from localStorage or default)
function getRates() {
    if (typeof window !== 'undefined') {
        return initializeRates();
    }
    return DEFAULT_RATES;
}

// Update rates
function updateRates(newRates) {
    saveRates(newRates);
    // Update the global ratesData if it exists
    if (typeof window !== 'undefined' && typeof ratesData !== 'undefined') {
        Object.assign(ratesData, newRates);
    }
}

// Default rates data for different destinations
const DEFAULT_RATES = {
    'john-wayne-sna': {
        name: 'John Wayne (SNA)',
        description: 'Transportation Service to or from John Wayne Airport',
        rates: [
            { vehicle: 'SEDAN', price: '$50' },
            { vehicle: 'SUV', price: '$80' },
            { vehicle: 'XL SUV', price: '$90' }
        ],
        additionalFees: [
            { name: 'Baggage Claim Meeting', description: 'Driver will meet passenger inside of the baggage claim and escort them to parked vehicle.', price: '$25' },
            { name: 'After Hours Fee', description: 'An additional fee applies for rides scheduled between 8:00 PM and 6:00 AM.', price: '$10' },
            { name: 'Major Holiday Fee', description: 'A flat fee applies for rides scheduled on major holidays.', price: '$20' }
        ]
    },
    'los-angeles-lax': {
        name: 'Los Angeles (LAX)',
        description: 'Transportation Service to or from Los Angeles International Airport',
        rates: [
            { vehicle: 'SEDAN', price: '$125' },
            { vehicle: 'SUV', price: '$165' },
            { vehicle: 'XL SUV', price: '$195' }
        ],
        additionalFees: [
            { name: 'Baggage Claim Meeting', description: 'Driver will meet passenger inside of the baggage claim and escort them to parked vehicle.', price: '$25' },
            { name: 'After Hours Fee', description: 'An additional fee applies for rides scheduled between 8:00 PM and 6:00 AM.', price: '$20' },
            { name: 'Major Holiday Fee', description: 'A flat fee applies for rides scheduled on major holidays.', price: '$20' }
        ]
    },
    'long-beach-lgb': {
        name: 'Long Beach (LGB)',
        description: 'Transportation Service to or from Long Beach Airport',
        rates: [
            { vehicle: 'SEDAN', price: '$100' },
            { vehicle: 'SUV', price: '$130' },
            { vehicle: 'XL SUV', price: '$155' }
        ],
        additionalFees: [
            { name: 'Baggage Claim Meeting', description: 'Driver will meet passenger inside of the baggage claim and escort them to parked vehicle.', price: '$25' },
            { name: 'After Hours Fee', description: 'An additional fee applies for rides scheduled between 8:00 PM and 6:00 AM.', price: '$20' },
            { name: 'Major Holiday Fee', description: 'A flat fee applies for rides scheduled on major holidays.', price: '$20' }
        ]
    },
    'san-diego-san': {
        name: 'San Diego (SAN)',
        description: 'Transportation Service to or from San Diego Airport',
        rates: [
            { vehicle: 'SEDAN', price: '$150' },
            { vehicle: 'SUV', price: '$200' },
            { vehicle: 'XL SUV', price: '$220' }
        ],
        additionalFees: [
            { name: 'Baggage Claim Meeting', description: 'Driver will meet passenger inside of the baggage claim and escort them to parked vehicle.', price: '$25' },
            { name: 'After Hours Fee', description: 'An additional fee applies for rides scheduled between 8:00 PM and 6:00 AM.', price: '$20' },
            { name: 'Major Holiday Fee', description: 'A flat fee applies for rides scheduled on major holidays.', price: '$20' }
        ]
    },
    'ontario-ont': {
        name: 'Ontario (ONT)',
        description: 'Transportation Service to or from Ontario Airport',
        rates: [
            { vehicle: 'SEDAN', price: '$125' },
            { vehicle: 'SUV', price: '$165' },
            { vehicle: 'XL SUV', price: '$195' }
        ],
        additionalFees: [
            { name: 'Baggage Claim Meeting', description: 'Driver will meet passenger inside of the baggage claim and escort them to parked vehicle.', price: '$25' },
            { name: 'After Hours Fee', description: 'An additional fee applies for rides scheduled between 8:00 PM and 6:00 AM.', price: '$20' },
            { name: 'Major Holiday Fee', description: 'A flat fee applies for rides scheduled on major holidays.', price: '$20' }
        ]
    },
    'cross-border-cbx': {
        name: 'Cross Border (CBX)',
        description: 'Transportation Service to or from CBX Border Bridge',
        rates: [
            { vehicle: 'SEDAN', price: '$190' },
            { vehicle: 'SUV', price: '$220' },
            { vehicle: 'XL SUV', price: '$240' }
        ],
        additionalFees: [
            { name: 'Baggage Claim Meeting', description: 'Driver will meet passenger inside of the baggage claim and escort them to parked vehicle.', price: '$25' },
            { name: 'After Hours Fee', description: 'An additional fee applies for rides scheduled between 8:00 PM and 6:00 AM.', price: '$20' },
            { name: 'Major Holiday Fee', description: 'A flat fee applies for rides scheduled on major holidays.', price: '$20' }
        ]
    },
    'long-beach-cruise': {
        name: 'Long Beach Cruise Terminal',
        description: 'Transportation Service to or from Long Beach Cruises',
        rates: [
            { vehicle: 'SEDAN', price: '$110' },
            { vehicle: 'SUV', price: '$140' },
            { vehicle: 'XL SUV', price: '$165' }
        ],
        additionalFees: [
            { name: 'Baggage Claim Meeting', description: 'Driver will meet passenger inside of the baggage claim and escort them to parked vehicle.', price: '$25' },
            { name: 'After Hours Fee', description: 'An additional fee applies for rides scheduled between 8:00 PM and 6:00 AM.', price: '$20' },
            { name: 'Major Holiday Fee', description: 'A flat fee applies for rides scheduled on major holidays.', price: '$20' }
        ]
    }
};

// Initialize ratesData with saved or default rates
let ratesData = getRates();

// Get destination from URL parameter
function getDestinationFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('destination') || params.get('dest');
}

// Convert destination name to URL-friendly format
function nameToSlug(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

// Display rates for a destination
function displayRates(destinationSlug) {
    const destination = ratesData[destinationSlug];
    
    if (!destination) {
        document.getElementById('destinationName').textContent = 'Destination Not Found';
        document.getElementById('destinationDesc').textContent = 'The requested destination could not be found.';
        document.getElementById('ratesContainer').innerHTML = '<p>Please return to the home page and select a valid destination.</p>';
        return;
    }
    
    // Update header
    document.getElementById('destinationName').textContent = destination.name;
    document.getElementById('destinationDesc').textContent = destination.description;
    
    // Create rates table
    let tableHTML = `
        <table class="rates-table">
            <thead>
                <tr>
                    <th>Vehicle Type</th>
                    <th>Price</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    destination.rates.forEach(rate => {
        tableHTML += `
            <tr>
                <td class="vehicle-type">${rate.vehicle}</td>
                <td class="price">${rate.price}</td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    // Add additional fees section if they exist
    if (destination.additionalFees && destination.additionalFees.length > 0) {
        tableHTML += `
            <div class="additional-fees">
                <h3 class="fees-title">Additional Fees</h3>
                <table class="rates-table fees-table">
                    <thead>
                        <tr>
                            <th>Fee Type</th>
                            <th>Description</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        destination.additionalFees.forEach(fee => {
            tableHTML += `
                <tr>
                    <td class="vehicle-type">${fee.name}</td>
                    <td class="fee-desc">${fee.description}</td>
                    <td class="price">${fee.price}</td>
                </tr>
            `;
        });
        
        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;
    }
    
    document.getElementById('ratesContainer').innerHTML = tableHTML;
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Try to get destination from URL parameter
    let destinationSlug = getDestinationFromURL();
    
    // If no parameter, try to get from hash
    if (!destinationSlug) {
        const hash = window.location.hash.substring(1);
        if (hash) {
            destinationSlug = hash;
        }
    }
    
    // If still no destination, default to first one or show error
    if (!destinationSlug) {
        // Try to infer from page title or show all destinations
        const destinationNameEl = document.getElementById('destinationName');
        const destinationDescEl = document.getElementById('destinationDesc');
        const ratesContainerEl = document.getElementById('ratesContainer');
        
        if (destinationNameEl) destinationNameEl.textContent = 'Select a Destination';
        if (destinationDescEl) destinationDescEl.textContent = 'Please select a destination from the home page to view rates.';
        if (ratesContainerEl) ratesContainerEl.innerHTML = '<p><a href="index.html">Return to Home Page</a></p>';
        return;
    }
    
    displayRates(destinationSlug);
});

