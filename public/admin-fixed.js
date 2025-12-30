let authToken = localStorage.getItem('adminToken');

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin portal loaded');
    
    // Setup login form
    setupLoginForm();
    
    if (authToken) {
        console.log('Found existing auth token');
        showDashboard();
        loadDashboardData();
        setupEventListeners();
    } else {
        console.log('No auth token found, showing login');
        showLogin();
    }
});

function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const sectionName = this.textContent.trim().toLowerCase().split(' ')[0];
            showSection(sectionName);
        });
    });
    
    console.log('Event listeners attached');
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.token;
            localStorage.setItem('adminToken', authToken);
            document.getElementById('adminUser').textContent = `Welcome, ${data.user.username}`;
            showDashboard();
            loadDashboardData();
            setupEventListeners();
        } else {
            showError('loginError', data.error || 'Login failed');
        }
    } catch (error) {
        showError('loginError', 'Connection error. Please try again.');
    }
}

function logout() {
    authToken = null;
    localStorage.removeItem('adminToken');
    showLogin();
}

function showLogin() {
    document.getElementById('loginModal').classList.remove('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('loginModal').classList.add('hidden');
    document.getElementById('adminDashboard').classList.remove('hidden');
}

function showSection(sectionName) {
    console.log('Showing section:', sectionName);
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active', 'text-white');
        btn.classList.add('text-gray-300');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName + 'Section');
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
    
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.textContent.toLowerCase().includes(sectionName)) {
            btn.classList.add('active', 'text-white');
            btn.classList.remove('text-gray-300');
        }
    });
    
    // Load section data
    switch(sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'bookings':
            loadBookings();
            break;
        case 'contacts':
            loadContacts();
            break;
        case 'partners':
            loadPartners();
            break;
    }
}

// API helper function
async function apiCall(endpoint, options = {}) {
    try {
        const config = {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            ...options
        };
        
        const response = await fetch(endpoint, config);
        
        if (response.status === 401) {
            logout();
            return null;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Call failed:', error);
        throw error;
    }
}

// Load functions
async function loadDashboardData() {
    try {
        const data = await apiCall('/api/admin/dashboard');
        if (!data) return;
        
        const totalBookings = data.bookings.reduce((sum, item) => sum + parseInt(item.total), 0);
        const newMessages = data.contacts.find(item => item.status === 'new')?.total || 0;
        const pendingPartners = data.partners.find(item => item.status === 'pending')?.total || 0;
        const weeklyActivity = parseInt(data.recentBookings) + parseInt(data.recentContacts);
        
        document.getElementById('totalBookings').textContent = totalBookings;
        document.getElementById('newMessages').textContent = newMessages;
        document.getElementById('pendingPartners').textContent = pendingPartners;
        document.getElementById('weeklyActivity').textContent = weeklyActivity;
    } catch (error) {
        console.error('Dashboard load error:', error);
    }
}

async function loadBookings() {
    try {
        const bookings = await apiCall('/api/admin/bookings');
        if (!bookings) return;
        
        const container = document.getElementById('bookingsList');
        container.innerHTML = '';
        
        if (bookings.length === 0) {
            container.innerHTML = '<div class="px-4 py-8 text-center text-gray-500">No bookings found</div>';
            return;
        }
        
        bookings.forEach(booking => {
            const item = createBookingItem(booking);
            container.appendChild(item);
        });
    } catch (error) {
        console.error('Bookings load error:', error);
    }
}

async function loadContacts() {
    try {
        const contacts = await apiCall('/api/admin/contacts');
        if (!contacts) return;
        
        const container = document.getElementById('contactsList');
        container.innerHTML = '';
        
        if (contacts.length === 0) {
            container.innerHTML = '<div class="px-4 py-8 text-center text-gray-500">No contacts found</div>';
            return;
        }
        
        contacts.forEach(contact => {
            const item = createContactItem(contact);
            container.appendChild(item);
        });
    } catch (error) {
        console.error('Contacts load error:', error);
    }
}

async function loadPartners() {
    try {
        const partners = await apiCall('/api/admin/partners');
        if (!partners) return;
        
        const container = document.getElementById('partnersList');
        container.innerHTML = '';
        
        if (partners.length === 0) {
            container.innerHTML = '<div class="px-4 py-8 text-center text-gray-500">No partners found</div>';
            return;
        }
        
        partners.forEach(partner => {
            const item = createPartnerItem(partner);
            container.appendChild(item);
        });
    } catch (error) {
        console.error('Partners load error:', error);
    }
}

// Create item functions
function createBookingItem(booking) {
    const div = document.createElement('div');
    div.className = 'px-4 py-4 sm:px-6';
    
    const statusColor = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'confirmed': 'bg-blue-100 text-blue-800',
        'completed': 'bg-green-100 text-green-800',
        'cancelled': 'bg-red-100 text-red-800'
    };
    
    div.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex-1">
                <div class="flex items-center justify-between">
                    <p class="text-sm font-medium text-indigo-600">${booking.name}</p>
                    <div class="ml-2 flex-shrink-0 flex">
                        <p class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor[booking.status] || 'bg-gray-100 text-gray-800'}">
                            ${booking.status}
                        </p>
                    </div>
                </div>
                <div class="mt-2 sm:flex sm:justify-between">
                    <div class="sm:flex">
                        <p class="flex items-center text-sm text-gray-500">
                            ${booking.email}
                        </p>
                        <p class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            ${booking.package.toUpperCase()} Package
                        </p>
                    </div>
                    <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        ${new Date(booking.created_at).toLocaleDateString()}
                    </div>
                </div>
                ${booking.requirements ? `<p class="mt-2 text-sm text-gray-600">${booking.requirements}</p>` : ''}
            </div>
            <div class="ml-4 flex space-x-2">
                <select class="text-sm border rounded px-2 py-1 booking-status-select" data-id="${booking.id}">
                    <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </div>
        </div>
    `;
    
    // Add event listener to the select
    const select = div.querySelector('.booking-status-select');
    select.addEventListener('change', function() {
        updateBookingStatus(this.dataset.id, this.value);
    });
    
    return div;
}

function createContactItem(contact) {
    const div = document.createElement('div');
    div.className = 'px-4 py-4 sm:px-6';
    
    const statusColor = {
        'new': 'bg-red-100 text-red-800',
        'read': 'bg-yellow-100 text-yellow-800',
        'resolved': 'bg-green-100 text-green-800'
    };
    
    div.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex-1">
                <div class="flex items-center justify-between">
                    <p class="text-sm font-medium text-indigo-600">${contact.name}</p>
                    <div class="ml-2 flex-shrink-0 flex">
                        <p class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor[contact.status] || 'bg-gray-100 text-gray-800'}">
                            ${contact.status}
                        </p>
                    </div>
                </div>
                <div class="mt-2 sm:flex sm:justify-between">
                    <p class="flex items-center text-sm text-gray-500">${contact.email}</p>
                    <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        ${new Date(contact.created_at).toLocaleDateString()}
                    </div>
                </div>
                <p class="mt-2 text-sm text-gray-600">${contact.message}</p>
            </div>
            <div class="ml-4 flex space-x-2">
                <select class="text-sm border rounded px-2 py-1 contact-status-select" data-id="${contact.id}">
                    <option value="new" ${contact.status === 'new' ? 'selected' : ''}>New</option>
                    <option value="read" ${contact.status === 'read' ? 'selected' : ''}>Read</option>
                    <option value="resolved" ${contact.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                </select>
            </div>
        </div>
    `;
    
    // Add event listener to the select
    const select = div.querySelector('.contact-status-select');
    select.addEventListener('change', function() {
        updateContactStatus(this.dataset.id, this.value);
    });
    
    return div;
}

function createPartnerItem(partner) {
    const div = document.createElement('div');
    div.className = 'px-4 py-4 sm:px-6';
    
    const statusColor = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'approved': 'bg-green-100 text-green-800',
        'rejected': 'bg-red-100 text-red-800'
    };
    
    div.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex-1">
                <div class="flex items-center justify-between">
                    <p class="text-sm font-medium text-indigo-600">${partner.name}</p>
                    <div class="ml-2 flex-shrink-0 flex">
                        <p class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor[partner.status] || 'bg-gray-100 text-gray-800'}">
                            ${partner.status}
                        </p>
                    </div>
                </div>
                <div class="mt-2 sm:flex sm:justify-between">
                    <div class="sm:flex">
                        <p class="flex items-center text-sm text-gray-500">${partner.email}</p>
                        <p class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            ${partner.type.charAt(0).toUpperCase() + partner.type.slice(1)}
                        </p>
                    </div>
                    <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        ${new Date(partner.created_at).toLocaleDateString()}
                    </div>
                </div>
                ${partner.message ? `<p class="mt-2 text-sm text-gray-600">${partner.message}</p>` : ''}
            </div>
            <div class="ml-4 flex space-x-2">
                <select class="text-sm border rounded px-2 py-1 partner-status-select" data-id="${partner.id}">
                    <option value="pending" ${partner.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="approved" ${partner.status === 'approved' ? 'selected' : ''}>Approved</option>
                    <option value="rejected" ${partner.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                </select>
            </div>
        </div>
    `;
    
    // Add event listener to the select
    const select = div.querySelector('.partner-status-select');
    select.addEventListener('change', function() {
        updatePartnerStatus(this.dataset.id, this.value);
    });
    
    return div;
}

// Update functions
async function updateBookingStatus(id, status) {
    try {
        await apiCall(`/api/admin/bookings/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        loadBookings();
    } catch (error) {
        console.error('Update booking error:', error);
    }
}

async function updateContactStatus(id, status) {
    try {
        await apiCall(`/api/admin/contacts/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        loadContacts();
        loadDashboardData();
    } catch (error) {
        console.error('Update contact error:', error);
    }
}

async function updatePartnerStatus(id, status) {
    try {
        await apiCall(`/api/admin/partners/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        loadPartners();
        loadDashboardData();
    } catch (error) {
        console.error('Update partner error:', error);
    }
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    setTimeout(() => {
        errorElement.classList.add('hidden');
    }, 5000);
}