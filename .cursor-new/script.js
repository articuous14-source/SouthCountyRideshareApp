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
                    baggageClaim: data.baggageClaim === 'Y' ? 'Y' : 'N'
                });
                
                // Success
                formMessage.textContent = 'Thank you! Your reservation request has been submitted successfully. A driver will review your request and contact you shortly to confirm your ride.';
                formMessage.className = 'form-message success';
                this.reset();
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

