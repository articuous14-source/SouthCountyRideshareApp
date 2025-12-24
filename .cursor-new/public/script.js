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
    reservationForm.addEventListener('submit', async function(e) {
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
            // Validate passenger count and vehicle type
            const passengerCount = parseInt(data.passengers) || 0;
            const vehicleType = data.vehicleType;
            
            if (passengerCount > 6) {
                throw new Error('Maximum 6 passengers per ride. Please adjust your passenger count.');
            }
            
            if (passengerCount > 4 && vehicleType !== 'XL SUV') {
                throw new Error('For 5 or more passengers, XL SUV is required. Please select XL SUV as your vehicle type.');
            }
            
            // Get actual pickup and destination values (from dropdown, "Other" address, or "Home" address)
            let pickup = data.pickup;
            if (pickup === 'Other') {
                // Build full address from address fields
                const pickupOtherStreet = data.pickupOtherStreet || '';
                const pickupOtherCity = data.pickupOtherCity || '';
                const pickupOtherState = data.pickupOtherState || '';
                const pickupOtherZip = data.pickupOtherZip || '';
                
                if (!pickupOtherStreet.trim() || !pickupOtherCity.trim() || !pickupOtherState.trim() || !pickupOtherZip.trim()) {
                    throw new Error('Please fill in all pickup address fields (Street, City, State, Zip Code).');
                }
                
                pickup = `${pickupOtherStreet}, ${pickupOtherCity}, ${pickupOtherState} ${pickupOtherZip}`;
            } else if (pickup === 'Home') {
                // Build full address from address fields
                const pickupStreet = data.pickupStreet || '';
                const pickupCity = data.pickupCity || '';
                const pickupState = data.pickupState || '';
                const pickupZip = data.pickupZip || '';
                
                if (!pickupStreet.trim() || !pickupCity.trim() || !pickupState.trim() || !pickupZip.trim()) {
                    throw new Error('Please fill in all pickup address fields (Street, City, State, Zip Code).');
                }
                
                pickup = `${pickupStreet}, ${pickupCity}, ${pickupState} ${pickupZip}`;
            }
            
            let destination = data.destination;
            if (destination === 'Other') {
                // Build full address from address fields
                const destinationOtherStreet = data.destinationOtherStreet || '';
                const destinationOtherCity = data.destinationOtherCity || '';
                const destinationOtherState = data.destinationOtherState || '';
                const destinationOtherZip = data.destinationOtherZip || '';
                
                if (!destinationOtherStreet.trim() || !destinationOtherCity.trim() || !destinationOtherState.trim() || !destinationOtherZip.trim()) {
                    throw new Error('Please fill in all destination address fields (Street, City, State, Zip Code).');
                }
                
                destination = `${destinationOtherStreet}, ${destinationOtherCity}, ${destinationOtherState} ${destinationOtherZip}`;
            } else if (destination === 'Home') {
                // Build full address from address fields
                const destinationStreet = data.destinationStreet || '';
                const destinationCity = data.destinationCity || '';
                const destinationState = data.destinationState || '';
                const destinationZip = data.destinationZip || '';
                
                if (!destinationStreet.trim() || !destinationCity.trim() || !destinationState.trim() || !destinationZip.trim()) {
                    throw new Error('Please fill in all destination address fields (Street, City, State, Zip Code).');
                }
                
                destination = `${destinationStreet}, ${destinationCity}, ${destinationState} ${destinationZip}`;
            }
            
            // Save ride via API
            // Get flight info
            const isAirportTrip = data.isAirportTrip === 'on';
            let flightNumber = '';
            let airline = '';
            
            if (isAirportTrip) {
                flightNumber = data.flightNumber || '';
                airline = data.airline || '';
            }
            
            // Build pickup and destination address objects
            let pickupAddress = {};
            let destinationAddress = {};
            
            if (pickup === 'Other' || pickup === 'Home') {
                if (pickup === 'Other') {
                    pickupAddress = {
                        street: data.pickupOtherStreet || '',
                        city: data.pickupOtherCity || '',
                        state: data.pickupOtherState || '',
                        zip: data.pickupOtherZip || ''
                    };
                } else {
                    pickupAddress = {
                        street: data.pickupStreet || '',
                        city: data.pickupCity || '',
                        state: data.pickupState || '',
                        zip: data.pickupZip || ''
                    };
                }
            }
            
            if (destination === 'Other' || destination === 'Home') {
                if (destination === 'Other') {
                    destinationAddress = {
                        street: data.destinationOtherStreet || '',
                        city: data.destinationOtherCity || '',
                        state: data.destinationOtherState || '',
                        zip: data.destinationOtherZip || ''
                    };
                } else {
                    destinationAddress = {
                        street: data.destinationStreet || '',
                        city: data.destinationCity || '',
                        state: data.destinationState || '',
                        zip: data.destinationZip || ''
                    };
                }
            }
            
            const rideData = {
                customerName: data.name,
                customerEmail: data.email,
                customerPhone: data.phone,
                pickup: pickup,
                pickupAddress: pickupAddress,
                destination: destination,
                destinationAddress: destinationAddress,
                date: data.date,
                time: data.time,
                passengers: parseInt(data.passengers) || 1,
                vehicleType: data.vehicleType,
                baggageClaim: data.baggageClaim === 'Y',
                flightNumber: flightNumber,
                airline: airline
            };
            
            // Submit first ride via API
            await API.rides.create(rideData);
            
            // Check if round trip is selected
            const isRoundTrip = data.roundTrip === 'on';
            if (isRoundTrip) {
                // Validate return trip fields
                if (!data.returnPickup || !data.returnDestination || !data.returnDate || !data.returnTime || !data.returnPassengers || !data.returnVehicleType) {
                    throw new Error('Please fill in all required return trip fields.');
                }
                
                // Validate return trip passenger count and vehicle type
                const returnPassengerCount = parseInt(data.returnPassengers) || 0;
                const returnVehicleType = data.returnVehicleType;
                
                if (returnPassengerCount > 6) {
                    throw new Error('Maximum 6 passengers per ride for return trip. Please adjust your passenger count.');
                }
                
                if (returnPassengerCount > 4 && returnVehicleType !== 'XL SUV') {
                    throw new Error('For 5 or more passengers on return trip, XL SUV is required. Please select XL SUV as your vehicle type.');
                }
                
                // Get return trip pickup and destination
                let returnPickup = data.returnPickup;
                let returnPickupAddress = null;
                if (returnPickup === 'Other') {
                    const returnPickupOtherStreet = data.returnPickupOtherStreet || '';
                    const returnPickupOtherCity = data.returnPickupOtherCity || '';
                    const returnPickupOtherState = data.returnPickupOtherState || '';
                    const returnPickupOtherZip = data.returnPickupOtherZip || '';
                    
                    if (!returnPickupOtherStreet.trim() || !returnPickupOtherCity.trim() || !returnPickupOtherState.trim() || !returnPickupOtherZip.trim()) {
                        throw new Error('Please fill in all return trip pickup address fields (Street, City, State, Zip Code).');
                    }
                    
                    returnPickup = `${returnPickupOtherStreet}, ${returnPickupOtherCity}, ${returnPickupOtherState} ${returnPickupOtherZip}`;
                    returnPickupAddress = {
                        street: returnPickupOtherStreet,
                        city: returnPickupOtherCity,
                        state: returnPickupOtherState,
                        zip: returnPickupOtherZip
                    };
                } else if (returnPickup === 'Home') {
                    const returnPickupStreet = data.returnPickupStreet || '';
                    const returnPickupCity = data.returnPickupCity || '';
                    const returnPickupState = data.returnPickupState || '';
                    const returnPickupZip = data.returnPickupZip || '';
                    
                    if (!returnPickupStreet.trim() || !returnPickupCity.trim() || !returnPickupState.trim() || !returnPickupZip.trim()) {
                        throw new Error('Please fill in all return trip pickup address fields (Street, City, State, Zip Code).');
                    }
                    
                    returnPickup = `${returnPickupStreet}, ${returnPickupCity}, ${returnPickupState} ${returnPickupZip}`;
                    returnPickupAddress = {
                        street: returnPickupStreet,
                        city: returnPickupCity,
                        state: returnPickupState,
                        zip: returnPickupZip
                    };
                }
                
                let returnDestination = data.returnDestination;
                let returnDestinationAddress = null;
                if (returnDestination === 'Other') {
                    const returnDestinationOtherStreet = data.returnDestinationOtherStreet || '';
                    const returnDestinationOtherCity = data.returnDestinationOtherCity || '';
                    const returnDestinationOtherState = data.returnDestinationOtherState || '';
                    const returnDestinationOtherZip = data.returnDestinationOtherZip || '';
                    
                    if (!returnDestinationOtherStreet.trim() || !returnDestinationOtherCity.trim() || !returnDestinationOtherState.trim() || !returnDestinationOtherZip.trim()) {
                        throw new Error('Please fill in all return trip destination address fields (Street, City, State, Zip Code).');
                    }
                    
                    returnDestination = `${returnDestinationOtherStreet}, ${returnDestinationOtherCity}, ${returnDestinationOtherState} ${returnDestinationOtherZip}`;
                    returnDestinationAddress = {
                        street: returnDestinationOtherStreet,
                        city: returnDestinationOtherCity,
                        state: returnDestinationOtherState,
                        zip: returnDestinationOtherZip
                    };
                } else if (returnDestination === 'Home') {
                    const returnDestinationStreet = data.returnDestinationStreet || '';
                    const returnDestinationCity = data.returnDestinationCity || '';
                    const returnDestinationState = data.returnDestinationState || '';
                    const returnDestinationZip = data.returnDestinationZip || '';
                    
                    if (!returnDestinationStreet.trim() || !returnDestinationCity.trim() || !returnDestinationState.trim() || !returnDestinationZip.trim()) {
                        throw new Error('Please fill in all return trip destination address fields (Street, City, State, Zip Code).');
                    }
                    
                    returnDestination = `${returnDestinationStreet}, ${returnDestinationCity}, ${returnDestinationState} ${returnDestinationZip}`;
                    returnDestinationAddress = {
                        street: returnDestinationStreet,
                        city: returnDestinationCity,
                        state: returnDestinationState,
                        zip: returnDestinationZip
                    };
                }
                
                // Get return trip flight info
                const returnIsAirportTrip = data.returnIsAirportTrip === 'on';
                let returnFlightNumber = '';
                let returnAirline = '';
                
                if (returnIsAirportTrip) {
                    returnFlightNumber = data.returnFlightNumber || '';
                    returnAirline = data.returnAirline || '';
                }
                
                // Create second ride (return trip) via API
                const returnRideData = {
                    customerName: data.name,
                    customerEmail: data.email,
                    customerPhone: data.phone,
                    pickup: returnPickup,
                    pickupAddress: returnPickupAddress,
                    destination: returnDestination,
                    destinationAddress: returnDestinationAddress,
                    date: data.returnDate,
                    time: data.returnTime,
                    passengers: parseInt(data.returnPassengers) || 1,
                    vehicleType: data.returnVehicleType,
                    baggageClaim: data.returnBaggageClaim === 'Y',
                    flightNumber: returnFlightNumber,
                    airline: returnAirline
                };
                
                await API.rides.create(returnRideData);
            }
            
            // Success
            // Determine time of day greeting
            const hour = new Date().getHours();
            let greeting = 'morning';
            if (hour >= 12 && hour < 17) {
                greeting = 'afternoon';
            } else if (hour >= 17) {
                greeting = 'evening';
            }
            formMessage.textContent = `Good ${greeting} and thank you for your request. We will check driver availability and be back with you soon.`;
            formMessage.className = 'form-message success';
            this.reset();
                // Hide flight info section after reset
                const flightInfoSection = document.getElementById('flightInfoSection');
                if (flightInfoSection) {
                    flightInfoSection.style.display = 'none';
                }
                // Hide baggage claim group after reset
                const baggageClaimGroup = document.getElementById('baggageClaimGroup');
                if (baggageClaimGroup) {
                    baggageClaimGroup.style.display = 'none';
                }
                // Hide "Other" input fields after reset
                const pickupOther = document.getElementById('pickupOther');
                const destinationOther = document.getElementById('destinationOther');
                if (pickupOther) {
                    pickupOther.style.display = 'none';
                    pickupOther.required = false;
                }
                if (destinationOther) {
                    destinationOther.style.display = 'none';
                    destinationOther.required = false;
                }
                
                // Hide "Other" address fields after reset
                const pickupOtherAddress = document.getElementById('pickupOtherAddress');
                const destinationOtherAddress = document.getElementById('destinationOtherAddress');
                if (pickupOtherAddress) {
                    pickupOtherAddress.style.display = 'none';
                    // Clear and remove required from address fields
                    const pickupOtherStreet = document.getElementById('pickupOtherStreet');
                    const pickupOtherCity = document.getElementById('pickupOtherCity');
                    const pickupOtherState = document.getElementById('pickupOtherState');
                    const pickupOtherZip = document.getElementById('pickupOtherZip');
                    if (pickupOtherStreet) { pickupOtherStreet.required = false; pickupOtherStreet.value = ''; }
                    if (pickupOtherCity) { pickupOtherCity.required = false; pickupOtherCity.value = ''; }
                    if (pickupOtherState) { pickupOtherState.required = false; pickupOtherState.value = ''; }
                    if (pickupOtherZip) { pickupOtherZip.required = false; pickupOtherZip.value = ''; }
                }
                if (destinationOtherAddress) {
                    destinationOtherAddress.style.display = 'none';
                    // Clear and remove required from address fields
                    const destinationOtherStreet = document.getElementById('destinationOtherStreet');
                    const destinationOtherCity = document.getElementById('destinationOtherCity');
                    const destinationOtherState = document.getElementById('destinationOtherState');
                    const destinationOtherZip = document.getElementById('destinationOtherZip');
                    if (destinationOtherStreet) { destinationOtherStreet.required = false; destinationOtherStreet.value = ''; }
                    if (destinationOtherCity) { destinationOtherCity.required = false; destinationOtherCity.value = ''; }
                    if (destinationOtherState) { destinationOtherState.required = false; destinationOtherState.value = ''; }
                    if (destinationOtherZip) { destinationOtherZip.required = false; destinationOtherZip.value = ''; }
                }
                
                // Hide "Home" address fields after reset
                const pickupHomeAddress = document.getElementById('pickupHomeAddress');
                const destinationHomeAddress = document.getElementById('destinationHomeAddress');
                if (pickupHomeAddress) {
                    pickupHomeAddress.style.display = 'none';
                    // Clear and remove required from address fields
                    const pickupStreet = document.getElementById('pickupStreet');
                    const pickupCity = document.getElementById('pickupCity');
                    const pickupState = document.getElementById('pickupState');
                    const pickupZip = document.getElementById('pickupZip');
                    if (pickupStreet) { pickupStreet.required = false; pickupStreet.value = ''; }
                    if (pickupCity) { pickupCity.required = false; pickupCity.value = ''; }
                    if (pickupState) { pickupState.required = false; pickupState.value = ''; }
                    if (pickupZip) { pickupZip.required = false; pickupZip.value = ''; }
                }
                if (destinationHomeAddress) {
                    destinationHomeAddress.style.display = 'none';
                    // Clear and remove required from address fields
                    const destinationStreet = document.getElementById('destinationStreet');
                    const destinationCity = document.getElementById('destinationCity');
                    const destinationState = document.getElementById('destinationState');
                    const destinationZip = document.getElementById('destinationZip');
                    if (destinationStreet) { destinationStreet.required = false; destinationStreet.value = ''; }
                    if (destinationCity) { destinationCity.required = false; destinationCity.value = ''; }
                    if (destinationState) { destinationState.required = false; destinationState.value = ''; }
                    if (destinationZip) { destinationZip.required = false; destinationZip.value = ''; }
                }
                // Reset vehicle type options after form reset
                updateVehicleTypeOptions();
                updateVehicleTypeOptions('return');
                
                // Hide return trip section after reset
                const returnTripSection = document.getElementById('returnTripSection');
                if (returnTripSection) {
                    returnTripSection.style.display = 'none';
                }
                const roundTripCheckbox = document.getElementById('roundTrip');
                if (roundTripCheckbox) {
                    roundTripCheckbox.checked = false;
                }
            } else {
                throw new Error('Driver portal system not loaded');
            }
            
        } catch (error) {
            // Error
            console.error('Error saving reservation:', error);
            formMessage.textContent = 'Sorry, there was an error submitting your request. Please try again or contact us directly at articuous14@gmail.com';
            formMessage.className = 'form-message error';
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Reservation';
        }
    });
}

// Toggle flight info section
function toggleFlightInfo(tripType = '') {
    const prefix = tripType === 'return' ? 'return' : '';
    const isAirportTrip = document.getElementById(prefix ? 'returnIsAirportTrip' : 'isAirportTrip').checked;
    const flightInfoSection = document.getElementById(prefix ? 'returnFlightInfoSection' : 'flightInfoSection');
    const flightNumber = document.getElementById(prefix ? 'returnFlightNumber' : 'flightNumber');
    const airline = document.getElementById(prefix ? 'returnAirline' : 'airline');
    const baggageClaimGroup = document.getElementById(prefix ? 'returnBaggageClaimGroup' : 'baggageClaimGroup');
    
    if (isAirportTrip) {
        if (flightInfoSection) flightInfoSection.style.display = 'block';
        // Check if pickup is airport for baggage claim
        if (prefix === 'return') {
            checkReturnPickupLocation();
        } else {
            checkPickupLocation();
        }
    } else {
        if (flightInfoSection) flightInfoSection.style.display = 'none';
        // Clear fields when hidden
        if (flightNumber) flightNumber.value = '';
        if (airline) airline.value = '';
        if (baggageClaimGroup) baggageClaimGroup.style.display = 'none';
    }
}

// Toggle round trip section
function toggleRoundTrip() {
    const roundTrip = document.getElementById('roundTrip').checked;
    const returnTripSection = document.getElementById('returnTripSection');
    
    if (roundTrip) {
        returnTripSection.style.display = 'block';
        // Set required fields for return trip
        document.getElementById('returnPickup').required = true;
        document.getElementById('returnDestination').required = true;
        document.getElementById('returnDate').required = true;
        document.getElementById('returnTime').required = true;
        document.getElementById('returnPassengers').required = true;
        document.getElementById('returnVehicleType').required = true;
    } else {
        returnTripSection.style.display = 'none';
        // Remove required and clear fields
        const returnFields = ['returnPickup', 'returnDestination', 'returnDate', 'returnTime', 'returnPassengers', 'returnVehicleType'];
        returnFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.required = false;
                field.value = '';
            }
        });
        // Clear and hide all return trip address fields
        const returnAddressFields = [
            'returnPickupOther', 'returnPickupOtherAddress', 'returnPickupHomeAddress',
            'returnDestinationOther', 'returnDestinationOtherAddress', 'returnDestinationHomeAddress',
            'returnFlightInfoSection', 'returnBaggageClaimGroup'
        ];
        returnAddressFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.style.display = 'none';
                if (field.tagName === 'INPUT' || field.tagName === 'SELECT') {
                    field.value = '';
                    field.required = false;
                }
            }
        });
    }
}

// Handle location dropdown changes (for both pickup and destination)
function handleLocationChange(locationType) {
    const locationSelect = document.getElementById(locationType);
    const otherInput = document.getElementById(locationType + 'Other');
    const otherAddressDiv = document.getElementById(locationType + 'OtherAddress');
    const homeAddressDiv = document.getElementById(locationType + 'HomeAddress');
    
    if (!locationSelect) return;
    
    const selectedValue = locationSelect.value;
    
    // Handle "Other" option
    if (otherInput) {
        if (selectedValue === 'Other') {
            // Hide simple text input, show address fields
            otherInput.style.display = 'none';
            otherInput.required = false;
            otherInput.value = '';
            
            // Show address fields
            if (otherAddressDiv) {
                otherAddressDiv.style.display = 'block';
                // Set required on all address fields
                const streetInput = document.getElementById(locationType + 'OtherStreet');
                const cityInput = document.getElementById(locationType + 'OtherCity');
                const stateInput = document.getElementById(locationType + 'OtherState');
                const zipInput = document.getElementById(locationType + 'OtherZip');
                
                if (streetInput) streetInput.required = true;
                if (cityInput) cityInput.required = true;
                if (stateInput) stateInput.required = true;
                if (zipInput) zipInput.required = true;
            }
        } else {
            // Hide address fields, show simple text input (for backwards compatibility, though it won't be used)
            otherInput.style.display = 'none';
            otherInput.required = false;
            otherInput.value = '';
            
            // Hide and clear address fields
            if (otherAddressDiv) {
                otherAddressDiv.style.display = 'none';
                const streetInput = document.getElementById(locationType + 'OtherStreet');
                const cityInput = document.getElementById(locationType + 'OtherCity');
                const stateInput = document.getElementById(locationType + 'OtherState');
                const zipInput = document.getElementById(locationType + 'OtherZip');
                
                if (streetInput) {
                    streetInput.required = false;
                    streetInput.value = '';
                }
                if (cityInput) {
                    cityInput.required = false;
                    cityInput.value = '';
                }
                if (stateInput) {
                    stateInput.required = false;
                    stateInput.value = '';
                }
                if (zipInput) {
                    zipInput.required = false;
                    zipInput.value = '';
                }
            }
        }
    }
    
    // Handle "Home" option - show address fields
    if (homeAddressDiv) {
        if (selectedValue === 'Home') {
            homeAddressDiv.style.display = 'block';
            // Set required on all address fields
            const streetInput = document.getElementById(locationType + 'Street');
            const cityInput = document.getElementById(locationType + 'City');
            const stateInput = document.getElementById(locationType + 'State');
            const zipInput = document.getElementById(locationType + 'Zip');
            
            if (streetInput) streetInput.required = true;
            if (cityInput) cityInput.required = true;
            if (stateInput) stateInput.required = true;
            if (zipInput) zipInput.required = true;
        } else {
            homeAddressDiv.style.display = 'none';
            // Remove required and clear values
            const streetInput = document.getElementById(locationType + 'Street');
            const cityInput = document.getElementById(locationType + 'City');
            const stateInput = document.getElementById(locationType + 'State');
            const zipInput = document.getElementById(locationType + 'Zip');
            
            if (streetInput) {
                streetInput.required = false;
                streetInput.value = '';
            }
            if (cityInput) {
                cityInput.required = false;
                cityInput.value = '';
            }
            if (stateInput) {
                stateInput.required = false;
                stateInput.value = '';
            }
            if (zipInput) {
                zipInput.required = false;
                zipInput.value = '';
            }
        }
    }
    
    // Check pickup location for baggage claim option (only for pickup)
    if (locationType === 'pickup') {
        checkPickupLocation();
    } else if (locationType === 'returnPickup') {
        checkReturnPickupLocation();
    }
}

// Check if return pickup location is an airport
function checkReturnPickupLocation() {
    const pickupSelect = document.getElementById('returnPickup');
    const pickupOtherStreetInput = document.getElementById('returnPickupOtherStreet');
    const pickupStreetInput = document.getElementById('returnPickupStreet');
    const baggageClaimGroup = document.getElementById('returnBaggageClaimGroup');
    const baggageClaim = document.getElementById('returnBaggageClaim');
    
    if (!pickupSelect || !baggageClaimGroup) return;
    
    // Get the actual pickup value (from dropdown, "Other" address, or "Home" address)
    let pickupValue = pickupSelect.value;
    if (pickupValue === 'Other' && pickupOtherStreetInput) {
        pickupValue = pickupOtherStreetInput.value;
    } else if (pickupValue === 'Home' && pickupStreetInput) {
        pickupValue = pickupStreetInput.value;
    }
    
    const pickupValueLower = pickupValue.toLowerCase().trim();
    
    // Exclude these locations from showing baggage claim option (not airports)
    const excludedLocations = [
        'cbx',
        'cross border',
        'long beach cruise terminal',
        'cruise terminal'
    ];
    
    const isExcluded = excludedLocations.some(excluded => pickupValueLower.includes(excluded));
    if (isExcluded) {
        baggageClaimGroup.style.display = 'none';
        if (baggageClaim) {
            baggageClaim.checked = false;
        }
        return;
    }
    
    // Airport keywords to check for
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
        if (baggageClaim) {
            baggageClaim.checked = false;
        }
    }
}

// Check if pickup location is an airport
function checkPickupLocation() {
    const pickupSelect = document.getElementById('pickup');
    const pickupOtherStreetInput = document.getElementById('pickupOtherStreet');
    const pickupStreetInput = document.getElementById('pickupStreet');
    const baggageClaimGroup = document.getElementById('baggageClaimGroup');
    const baggageClaim = document.getElementById('baggageClaim');
    
    if (!pickupSelect || !baggageClaimGroup) return;
    
    // Get the actual pickup value (from dropdown, "Other" address, or "Home" address)
    let pickupValue = pickupSelect.value;
    if (pickupValue === 'Other' && pickupOtherStreetInput) {
        // For "Other", use the street address to check if it's an airport
        pickupValue = pickupOtherStreetInput.value;
    } else if (pickupValue === 'Home' && pickupStreetInput) {
        // For "Home", use the street address to check if it's an airport
        pickupValue = pickupStreetInput.value;
    }
    
    const pickupValueLower = pickupValue.toLowerCase().trim();
    
    // Exclude these locations from showing baggage claim option (not airports)
    const excludedLocations = [
        'cbx',
        'cross border',
        'long beach cruise terminal',
        'cruise terminal'
    ];
    
    // Check if pickup location is excluded (not an airport)
    const isExcluded = excludedLocations.some(excluded => pickupValueLower.includes(excluded));
    if (isExcluded) {
        baggageClaimGroup.style.display = 'none';
        // Uncheck baggage claim if it was checked
        if (baggageClaim) {
            baggageClaim.checked = false;
        }
        return;
    }
    
    // Airport keywords to check for (excluding CBX and Long Beach Cruise Terminal)
    const airportKeywords = [
        'airport', 'sna', 'lax', 'san', 'lgb', 'ont',
        'john wayne', 'los angeles', 'san diego',
        'ontario', 'orange county airport',
        'john wayne airport', 'los angeles airport', 'san diego airport',
        'long beach airport', 'ontario airport'
    ];
    
    // Check if pickup location contains any airport keywords
    const isAirport = airportKeywords.some(keyword => pickupValueLower.includes(keyword));
    
    if (isAirport) {
        baggageClaimGroup.style.display = 'block';
    } else {
        baggageClaimGroup.style.display = 'none';
        // Uncheck baggage claim if it was checked
        if (baggageClaim) {
            baggageClaim.checked = false;
        }
    }
}

// Set minimum date to today for date input
const dateInput = document.getElementById('date');
if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
}

// Set minimum date to today for return date input
const returnDateInput = document.getElementById('returnDate');
if (returnDateInput) {
    const today = new Date().toISOString().split('T')[0];
    returnDateInput.setAttribute('min', today);
}

// Expose functions to global scope for HTML handlers
window.toggleRoundTrip = toggleRoundTrip;
window.toggleFlightInfo = toggleFlightInfo;
window.handleLocationChange = handleLocationChange;
window.updateVehicleTypeOptions = updateVehicleTypeOptions;

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

// Load and display approved reviews
async function loadReviews() {
    try {
        const reviews = await API.reviews.getApproved();
        const reviewsDisplay = document.getElementById('reviewsDisplay');
        const olderReviewsSection = document.getElementById('olderReviewsSection');
        const olderReviewsDisplay = document.getElementById('olderReviewsDisplay');
        
        if (!reviewsDisplay) return;
        
        if (reviews.length === 0) {
            reviewsDisplay.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">
                    <p style="font-size: 1.1rem;">No reviews yet. Be the first to share your experience!</p>
                </div>
            `;
            if (olderReviewsSection) {
                olderReviewsSection.style.display = 'none';
            }
            return;
        }
        
        // Sort reviews by date (most recent first)
        const sortedReviews = [...reviews].sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        // Get 6 most recent reviews
        const recentReviews = sortedReviews.slice(0, 6);
        const olderReviews = sortedReviews.slice(6);
        
        // Display 6 most recent reviews
        if (recentReviews.length > 0) {
            reviewsDisplay.innerHTML = recentReviews.map(review => createReviewCard(review)).join('');
        } else {
            reviewsDisplay.innerHTML = '';
        }
        
        // Display older reviews in dropdown section
        if (olderReviews.length > 0 && olderReviewsSection && olderReviewsDisplay) {
            olderReviewsSection.style.display = 'block';
            loadOlderReviews(olderReviews, 'all');
            // Ensure filter is initialized
            if (!filterInitialized) {
                handleReviewRatingFilter();
                filterInitialized = true;
            }
        } else if (olderReviewsSection) {
            olderReviewsSection.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

// Create review card HTML
function createReviewCard(review) {
    const date = new Date(review.createdAt);
    const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
    });
    
    // Ensure rating is a valid number
    const ratingNum = typeof review.rating === 'number' ? review.rating : parseInt(review.rating) || 0;
    const validRating = Math.max(1, Math.min(5, ratingNum)); // Clamp between 1-5
    const stars = '⭐'.repeat(validRating);
    
    return `
        <div class="review-card">
            <div class="review-header">
                <div>
                    <div class="review-name">${review.name}</div>
                    <div class="review-date">${formattedDate}</div>
                </div>
                <div class="review-rating">${stars}</div>
            </div>
            <div class="review-comment">${review.comment}</div>
        </div>
    `;
}

// Load older reviews with rating filter
let allOlderReviews = [];
let filterInitialized = false;

function loadOlderReviews(reviews, ratingFilter = 'all') {
    allOlderReviews = reviews;
    const olderReviewsDisplay = document.getElementById('olderReviewsDisplay');
    
    if (!olderReviewsDisplay) return;
    
    // Filter by rating if specified
    let filteredReviews = reviews;
    if (ratingFilter !== 'all') {
        const filterRating = parseInt(ratingFilter);
        filteredReviews = reviews.filter(review => {
            const ratingNum = typeof review.rating === 'number' ? review.rating : parseInt(review.rating) || 0;
            return ratingNum === filterRating;
        });
    }
    
    if (filteredReviews.length === 0) {
        olderReviewsDisplay.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #666;">
                <p>No reviews found with the selected rating.</p>
            </div>
        `;
        return;
    }
    
    olderReviewsDisplay.innerHTML = filteredReviews.map(review => createReviewCard(review)).join('');
    
    // Initialize filter event listener if not already done
    if (!filterInitialized) {
        handleReviewRatingFilter();
        filterInitialized = true;
    }
}

// Handle rating filter change
function handleReviewRatingFilter() {
    const filterSelect = document.getElementById('reviewRatingFilter');
    if (filterSelect) {
        // Remove any existing event listeners by cloning the element
        const newFilterSelect = filterSelect.cloneNode(true);
        filterSelect.parentNode.replaceChild(newFilterSelect, filterSelect);
        
        // Add event listener to the new element
        newFilterSelect.addEventListener('change', function() {
            const selectedRating = this.value;
            loadOlderReviews(allOlderReviews, selectedRating);
        });
    }
}

// Handle star rating visual feedback
function updateStarRating() {
    const ratingInputs = document.querySelectorAll('.rating-input input[type="radio"]');
    const ratingLabels = document.querySelectorAll('.rating-input label');
    
    // Reset all stars to gray
    ratingLabels.forEach(label => {
        label.style.filter = 'grayscale(100%)';
        label.style.opacity = '0.4';
    });
    
    // Find the checked rating
    let checkedRating = null;
    ratingInputs.forEach(input => {
        if (input.checked) {
            checkedRating = parseInt(input.value);
        }
    });
    
    // Highlight stars up to and including the checked rating
    if (checkedRating) {
        ratingLabels.forEach((label, index) => {
            if (index < checkedRating) {
                label.style.filter = 'grayscale(0%)';
                label.style.opacity = '1';
            }
        });
    }
}

// Add event listeners to rating inputs
document.addEventListener('DOMContentLoaded', function() {
    const ratingInputs = document.querySelectorAll('.rating-input input[type="radio"]');
    ratingInputs.forEach(input => {
        input.addEventListener('change', updateStarRating);
    });
    
    // Also handle hover effects
    const ratingLabels = document.querySelectorAll('.rating-input label');
    ratingLabels.forEach((label, index) => {
        label.addEventListener('mouseenter', function() {
            const rating = index + 1;
            ratingLabels.forEach((l, i) => {
                if (i < rating) {
                    l.style.filter = 'grayscale(0%)';
                    l.style.opacity = '1';
                }
            });
        });
        
        label.addEventListener('mouseleave', function() {
            updateStarRating(); // Reset to actual selection
        });
    });
});

// Handle review form submission
const reviewForm = document.getElementById('reviewForm');
const reviewSubmitBtn = document.getElementById('reviewSubmitBtn');
const reviewMessage = document.getElementById('reviewMessage');

if (reviewForm) {
    reviewForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Disable submit button and show loading state
        reviewSubmitBtn.disabled = true;
        reviewSubmitBtn.textContent = 'Submitting...';
        reviewMessage.textContent = '';
        reviewMessage.className = 'form-message';
        
        // Get form data
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);
        
        // Debug: Log the rating value
        console.log('Form data:', data);
        console.log('Rating value:', data.reviewRating, 'Type:', typeof data.reviewRating);
        
        try {
            // Ensure rating is a number - get it directly from the checked radio button
            let rating = data.reviewRating;
            if (!rating) {
                // Fallback: check which radio is actually checked
                const checkedRadio = this.querySelector('input[name="reviewRating"]:checked');
                rating = checkedRadio ? checkedRadio.value : null;
            }
            
            rating = parseInt(rating) || 0;
            console.log('Parsed rating:', rating);
            
            if (rating < 1 || rating > 5) {
                reviewMessage.textContent = 'Please select a valid rating (1-5 stars).';
                reviewMessage.className = 'form-message error';
                reviewSubmitBtn.disabled = false;
                reviewSubmitBtn.textContent = 'Submit Review';
                return;
            }
            
            // Submit review via API
            const reviewData = {
                customerName: data.reviewName,
                email: data.reviewEmail,
                rating: rating,
                comment: data.reviewComment
            };
            
            await API.reviews.create(reviewData);
            
            // Success
            reviewMessage.textContent = 'Thank you for your review! It has been submitted and is pending approval. We appreciate your feedback!';
            reviewMessage.className = 'form-message success';
            this.reset();
            
        } catch (error) {
            // Error
            console.error('Error saving review:', error);
            reviewMessage.textContent = 'Sorry, there was an error submitting your review. Please try again.';
            reviewMessage.className = 'form-message error';
        } finally {
            // Re-enable submit button
            reviewSubmitBtn.disabled = false;
            reviewSubmitBtn.textContent = 'Submit Review';
        }
    });
}

// Update vehicle type options based on passenger count
function updateVehicleTypeOptions(tripType = '') {
    const prefix = tripType === 'return' ? 'return' : '';
    const passengersInput = document.getElementById(prefix ? 'returnPassengers' : 'passengers');
    const vehicleTypeSelect = document.getElementById(prefix ? 'returnVehicleType' : 'vehicleType');
    
    if (!passengersInput || !vehicleTypeSelect) return;
    
    const passengerCount = parseInt(passengersInput.value) || 0;
    const sedanOption = vehicleTypeSelect.querySelector('option[value="Sedans"]');
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
        if (vehicleTypeSelect.value === '' || vehicleTypeSelect.value === 'Sedans' || vehicleTypeSelect.value === 'SUV') {
            vehicleTypeSelect.value = 'XL SUV';
        }
    } else if (passengerCount === 4) {
        // 4 passengers: Only SUV and XL SUV available
        if (sedanOption) {
            sedanOption.disabled = true;
            sedanOption.style.display = 'none';
        }
        // If Sedan is currently selected, clear the selection
        if (vehicleTypeSelect.value === 'Sedans') {
            vehicleTypeSelect.value = '';
        }
    } else {
        // 1-3 passengers: All options available
        // Options are already enabled above
    }
}

// Load reviews on page load
document.addEventListener('DOMContentLoaded', function() {
    loadReviews();
    
    // Initialize vehicle type options based on current passenger count
    updateVehicleTypeOptions();
    handleReviewRatingFilter();
    
    // Initialize location dropdowns
    const pickupSelect = document.getElementById('pickup');
    const destinationSelect = document.getElementById('destination');
    if (pickupSelect) {
        pickupSelect.addEventListener('change', function() {
            handleLocationChange('pickup');
        });
    }
    if (destinationSelect) {
        destinationSelect.addEventListener('change', function() {
            handleLocationChange('destination');
        });
    }
    
    // Also check pickup location when "Other" address field changes
    const pickupOtherStreetInput = document.getElementById('pickupOtherStreet');
    if (pickupOtherStreetInput) {
        pickupOtherStreetInput.addEventListener('input', function() {
            checkPickupLocation();
        });
    }
    
    // Also check pickup location when "Home" address field changes
    const pickupStreetInput = document.getElementById('pickupStreet');
    if (pickupStreetInput) {
        pickupStreetInput.addEventListener('input', function() {
            checkPickupLocation();
        });
    }
    
    // Load drivers and announcements on page load
    loadDrivers();
    loadAnnouncements();
});

// Toggle About section dropdowns
function toggleAboutDropdown(type) {
    const content = document.getElementById(`${type}-content`);
    const arrow = document.getElementById(`${type}-arrow`);
    const btn = event.target.closest('.about-dropdown-btn');
    
    if (!content || !arrow) return;
    
    const isOpen = content.style.display !== 'none';
    
    // Close all other dropdowns
    document.querySelectorAll('.about-dropdown-content').forEach(dropdown => {
        if (dropdown.id !== `${type}-content`) {
            dropdown.style.display = 'none';
        }
    });
    document.querySelectorAll('.about-dropdown-btn').forEach(button => {
        button.classList.remove('active');
    });
    
    // Toggle current dropdown
    if (isOpen) {
        content.style.display = 'none';
        btn.classList.remove('active');
    } else {
        content.style.display = 'block';
        btn.classList.add('active');
        
        // Load content if needed
        if (type === 'drivers' && document.getElementById('driversDisplay').innerHTML === '') {
            loadDrivers();
        } else if (type === 'announcements' && document.getElementById('announcementsDisplay').innerHTML === '') {
            loadAnnouncements();
        }
    }
}

// Load and display drivers
async function loadDrivers() {
    try {
        const drivers = await API.drivers.getAll();
    const driversDisplay = document.getElementById('driversDisplay');
    
    if (!driversDisplay) return;
    
    if (drivers.length === 0) {
        driversDisplay.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No drivers available.</p>';
        return;
    }
    
    driversDisplay.innerHTML = drivers.map(driver => {
        // Get driver photo from localStorage
        const driverPhoto = localStorage.getItem(`driver_photo_${driver.username}`) || '';
        const photoSrc = driverPhoto || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120"%3E%3Crect width="120" height="120" fill="%23e0e0e0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="40"%3E' + (driver.name.charAt(0) || 'D') + '%3C/text%3E%3C/svg%3E';
        
        // Get vehicle information
        let vehicleText = 'Vehicle information not available';
        if (driver.vehicles && Array.isArray(driver.vehicles) && driver.vehicles.length > 0) {
            // Use first vehicle or combine all vehicles
            vehicleText = driver.vehicles.map(v => {
                const parts = v.split(' - ');
                return parts.length > 1 ? parts[1] : v;
            }).join(', ');
        } else if (driver.vehicle) {
            const parts = driver.vehicle.split(' - ');
            vehicleText = parts.length > 1 ? parts[1] : driver.vehicle;
        }
        
        return `
            <div class="driver-card">
                <img src="${photoSrc}" alt="${driver.name}" class="driver-photo" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'120\\' height=\\'120\\'%3E%3Crect width=\\'120\\' height=\\'120\\' fill=\\'%23e0e0e0\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%23999\\' font-size=\\'40\\'%3E${driver.name.charAt(0) || 'D'}%3C/text%3E%3C/svg%3E'">
                <div class="driver-name">${driver.name}</div>
                <div class="driver-vehicle">${vehicleText}</div>
            </div>
        `;
    }).join('');
}

// Load and display announcements
async function loadAnnouncements() {
    try {
        const announcements = await API.announcements.getAll(true);
        const announcementsDisplay = document.getElementById('announcementsDisplay');
        
        if (!announcementsDisplay) return;
        
        if (announcements.length === 0) {
            announcementsDisplay.innerHTML = '<div class="no-announcements">No announcements at this time. Check back soon!</div>';
            return;
        }
        
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
    } catch (error) {
        console.error('Error loading announcements:', error);
    }
}

