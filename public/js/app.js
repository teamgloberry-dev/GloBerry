console.log('app.js loaded');

// Global functions - attach to window object
window.showBooking = function() {
    console.log('showBooking called');
    document.getElementById('booking-modal').classList.remove('hidden');
};

window.showPartnerForm = function() {
    console.log('showPartnerForm called');
    document.getElementById('partner-modal').classList.remove('hidden');
};

window.showPackages = function() {
    console.log('showPackages called');
    document.getElementById('packages').scrollIntoView({ behavior: 'smooth' });
};

window.toggleMobileMenu = function() {
    console.log('toggleMobileMenu called');
    document.getElementById('mobile-menu').classList.toggle('hidden');
};

window.hideModals = function() {
    console.log('hideModals called');
    document.querySelectorAll('[id$="-modal"]').forEach(modal => {
        modal.classList.add('hidden');
    });
};

window.bookPackage = function(packageType) {
    console.log('bookPackage called with:', packageType);
    document.getElementById('package-select').value = packageType;
    showBooking();
};

// Form handlers
document.addEventListener('DOMContentLoaded', function() {
    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Contact form submitted');
            
            const contactData = {
                name: e.target.querySelector('input[placeholder="Your Name"]').value,
                email: e.target.querySelector('input[placeholder="Your Email"]').value,
                message: e.target.querySelector('textarea').value
            };
            
            console.log('Contact data:', contactData);
            
            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(contactData)
                });
                
                const result = await response.json();
                console.log('Contact response:', result);
                
                if (response.ok) {
                    alert('Message sent successfully!');
                    e.target.reset();
                } else {
                    alert('Failed to send message: ' + (result.error || 'Unknown error'));
                    console.error('Contact error:', result);
                }
            } catch (error) {
                alert('Failed to send message: ' + error.message);
                console.error('Contact error:', error);
            }
        });
    }

    // Booking form
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Booking form submitted');
            
            const bookingData = {
                name: e.target.querySelector('input[placeholder="Full Name"]').value,
                email: e.target.querySelector('input[placeholder="Email"]').value,
                phone: e.target.querySelector('input[placeholder="Phone Number"]').value,
                package: document.getElementById('package-select').value,
                requirements: e.target.querySelector('textarea').value
            };
            
            console.log('Booking data:', bookingData);

            try {
                const response = await fetch('/api/booking', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookingData)
                });
                
                const result = await response.json();
                console.log('Booking response:', result);
                
                if (response.ok) {
                    document.getElementById('booking-modal').classList.add('hidden');
                    alert('Booking confirmed!');
                    e.target.reset();
                } else {
                    alert('Booking failed: ' + (result.error || 'Unknown error'));
                    console.error('Booking error:', result);
                }
            } catch (error) {
                alert('Booking failed: ' + error.message);
                console.error('Booking error:', error);
            }
        });
    }

    // Partner form
    const partnerForm = document.getElementById('partner-form');
    if (partnerForm) {
        partnerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Partner form submitted');
            
            const partnerData = {
                name: e.target.querySelector('input[placeholder="Name/Organization"]').value,
                email: e.target.querySelector('input[placeholder="Email"]').value,
                type: e.target.querySelector('select').value,
                message: e.target.querySelector('textarea').value
            };
            
            console.log('Partner data:', partnerData);
            
            try {
                const response = await fetch('/api/partner', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(partnerData)
                });
                
                const result = await response.json();
                console.log('Partner response:', result);
                
                if (response.ok) {
                    document.getElementById('partner-modal').classList.add('hidden');
                    alert('Application submitted!');
                    e.target.reset();
                } else {
                    alert('Submission failed: ' + (result.error || 'Unknown error'));
                    console.error('Partner error:', result);
                }
            } catch (error) {
                alert('Submission failed: ' + error.message);
                console.error('Partner error:', error);
            }
        });
    }
});