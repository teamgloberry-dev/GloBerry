let authToken = localStorage.getItem('adminToken');

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin portal loaded');
    if (authToken) {
        console.log('Found existing auth token');
        showDashboard();
        loadDashboardData();
    } else {
        console.log('No auth token found, showing login');
        showLogin();
    }
});

// Test function for filters
function testFilter() {
    console.log('Filter test called');
    const bookingFilter = document.getElementById('bookingStatusFilter');
    if (bookingFilter) {
        console.log('Booking filter value:', bookingFilter.value);
        loadBookings();
    } else {
        console.log('Booking filter not found');
    }
}

// Login functionality
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.token;
            localStorage.setItem('adminToken', authToken);
            document.getElementById('adminUser').textContent = `Welcome, ${data.user.username}`;
            showDashboard();
            loadDashboardData();
        } else {
            showError('loginError', data.error || 'Login failed');
        }
    } catch (error) {
        showError('loginError', 'Connection error. Please try again.');
    }
});

// Logout functionality
function logout() {
    authToken = null;
    localStorage.removeItem('adminToken');
    showLogin();
}

// Show/hide sections
function showLogin() {
    document.getElementById('loginModal').classList.remove('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('loginModal').classList.add('hidden');
    document.getElementById('adminDashboard').classList.remove('hidden');
}

function showSection(sectionName) {
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
    document.getElementById(sectionName + 'Section').classList.remove('hidden');
    
    // Update active nav button
    if (event && event.target) {
        event.target.classList.add('active', 'text-white');
        event.target.classList.remove('text-gray-300');
    }
    
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
        
        console.log('API Call:', endpoint, config);
        const response = await fetch(endpoint, config);
        
        console.log('API Response status:', response.status);
        
        if (response.status === 401) {
            console.log('Unauthorized, logging out');
            logout();
            return null;
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('API Response data:', data);
        return data;
        
    } catch (error) {
        console.error('API Call failed:', error);
        throw error;
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const data = await apiCall('/api/admin/dashboard');
        if (!data) return;
        
        // Update stats
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

// Load bookings
async function loadBookings() {
    try {
        const statusFilter = document.getElementById('bookingStatusFilter')?.value;
        const packageFilter = document.getElementById('packageFilter')?.value;
        
        console.log('Loading bookings with filters:', { statusFilter, packageFilter });
        
        let url = '/api/admin/bookings';
        const params = new URLSearchParams();
        
        // Only add parameters if they have actual values (not empty string)
        if (statusFilter && statusFilter.trim() !== '') {
            params.append('status', statusFilter);
        }
        if (packageFilter && packageFilter.trim() !== '') {
            params.append('package', packageFilter);
        }
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        console.log('Fetching URL:', url);
        const bookings = await apiCall(url);
        if (!bookings) return;
        
        console.log('Loaded bookings:', bookings.length);
        
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
        document.getElementById('bookingsList').innerHTML = '<div class="px-4 py-8 text-center text-red-500">Error loading bookings</div>';
    }
}

// Create booking item
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
                            <i class="fas fa-envelope mr-1"></i>
                            ${booking.email}
                        </p>
                        <p class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            <i class="fas fa-box mr-1"></i>
                            ${booking.package.toUpperCase()} Package
                        </p>
                    </div>
                    <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <i class="fas fa-calendar mr-1"></i>
                        ${new Date(booking.created_at).toLocaleDateString()}
                    </div>
                </div>
                ${booking.requirements ? `<p class="mt-2 text-sm text-gray-600">${booking.requirements}</p>` : ''}
                ${booking.admin_notes ? `<p class="mt-2 text-sm text-blue-600"><strong>Admin Notes:</strong> ${booking.admin_notes}</p>` : ''}
            </div>
            <div class="ml-4 flex space-x-2">
                <select onchange="updateBookingStatus(${booking.id}, this.value)" class="text-sm border rounded px-2 py-1">
                    <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
                <button onclick="addBookingNote(${booking.id})" class="text-blue-600 hover:text-blue-800">
                    <i class="fas fa-sticky-note"></i>
                </button>
            </div>
        </div>
    `;
    
    return div;
}

// Update booking status
async function updateBookingStatus(id, status) {
    try {
        console.log('Updating booking status:', { id, status });
        const response = await apiCall(`/api/admin/bookings/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        
        if (response) {
            console.log('Booking updated successfully');
            loadBookings();
        } else {
            console.error('Failed to update booking');
        }
    } catch (error) {
        console.error('Update booking error:', error);
        alert('Failed to update booking status');
    }
}

// Add booking note
async function addBookingNote(id) {
    const note = prompt('Add admin note:');
    if (note && note.trim()) {
        try {
            console.log('Adding booking note:', { id, note });
            const response = await apiCall(`/api/admin/bookings/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ admin_notes: note.trim() })
            });
            
            if (response) {
                console.log('Note added successfully');
                loadBookings();
            } else {
                console.error('Failed to add note');
            }
        } catch (error) {
            console.error('Add note error:', error);
            alert('Failed to add note');
        }
    }
}

// Load contacts
async function loadContacts() {
    try {
        const statusFilter = document.getElementById('contactStatusFilter')?.value;
        let url = '/api/admin/contacts';
        
        console.log('Loading contacts with filter:', { statusFilter });
        
        // Only add status parameter if it has an actual value (not empty string)
        if (statusFilter && statusFilter.trim() !== '') {
            url += `?status=${encodeURIComponent(statusFilter)}`;
        }
        
        console.log('Fetching URL:', url);
        const contacts = await apiCall(url);
        if (!contacts) return;
        
        console.log('Loaded contacts:', contacts.length);
        
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
        document.getElementById('contactsList').innerHTML = '<div class="px-4 py-8 text-center text-red-500">Error loading contacts</div>';
    }
}

// Create contact item
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
                    <p class="flex items-center text-sm text-gray-500">
                        <i class="fas fa-envelope mr-1"></i>
                        ${contact.email}
                    </p>
                    <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <i class="fas fa-calendar mr-1"></i>
                        ${new Date(contact.created_at).toLocaleDateString()}
                    </div>
                </div>
                <p class="mt-2 text-sm text-gray-600">${contact.message}</p>
                ${contact.admin_notes ? `<p class="mt-2 text-sm text-blue-600"><strong>Admin Notes:</strong> ${contact.admin_notes}</p>` : ''}
            </div>
            <div class="ml-4 flex space-x-2">
                <select onchange="updateContactStatus(${contact.id}, this.value)" class="text-sm border rounded px-2 py-1">
                    <option value="new" ${contact.status === 'new' ? 'selected' : ''}>New</option>
                    <option value="read" ${contact.status === 'read' ? 'selected' : ''}>Read</option>
                    <option value="resolved" ${contact.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                </select>
                <button onclick="addContactNote(${contact.id})" class="text-blue-600 hover:text-blue-800">
                    <i class="fas fa-sticky-note"></i>
                </button>
            </div>
        </div>
    `;
    
    return div;
}

// Update contact status
async function updateContactStatus(id, status) {
    try {
        console.log('Updating contact status:', { id, status });
        const response = await apiCall(`/api/admin/contacts/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        
        if (response) {
            console.log('Contact updated successfully');
            loadContacts();
            loadDashboardData(); // Refresh dashboard stats
        } else {
            console.error('Failed to update contact');
        }
    } catch (error) {
        console.error('Update contact error:', error);
        alert('Failed to update contact status');
    }
}

// Add contact note
async function addContactNote(id) {
    const note = prompt('Add admin note:');
    if (note && note.trim()) {
        try {
            console.log('Adding contact note:', { id, note });
            const response = await apiCall(`/api/admin/contacts/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ admin_notes: note.trim() })
            });
            
            if (response) {
                console.log('Note added successfully');
                loadContacts();
            } else {
                console.error('Failed to add note');
            }
        } catch (error) {
            console.error('Add note error:', error);
            alert('Failed to add note');
        }
    }
}

// Load partners
async function loadPartners() {
    try {
        const statusFilter = document.getElementById('partnerStatusFilter')?.value;
        const typeFilter = document.getElementById('partnerTypeFilter')?.value;
        
        console.log('Loading partners with filters:', { statusFilter, typeFilter });
        
        let url = '/api/admin/partners';
        const params = new URLSearchParams();
        
        // Only add parameters if they have actual values (not empty string)
        if (statusFilter && statusFilter.trim() !== '') {
            params.append('status', statusFilter);
        }
        if (typeFilter && typeFilter.trim() !== '') {
            params.append('type', typeFilter);
        }
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        console.log('Fetching URL:', url);
        const partners = await apiCall(url);
        if (!partners) return;
        
        console.log('Loaded partners:', partners.length);
        
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
        document.getElementById('partnersList').innerHTML = '<div class="px-4 py-8 text-center text-red-500">Error loading partners</div>';
    }
}

// Create partner item
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
                        <p class="flex items-center text-sm text-gray-500">
                            <i class="fas fa-envelope mr-1"></i>
                            ${partner.email}
                        </p>
                        <p class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            <i class="fas fa-user-tag mr-1"></i>
                            ${partner.type.charAt(0).toUpperCase() + partner.type.slice(1)}
                        </p>
                    </div>
                    <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <i class="fas fa-calendar mr-1"></i>
                        ${new Date(partner.created_at).toLocaleDateString()}
                    </div>
                </div>
                ${partner.message ? `<p class="mt-2 text-sm text-gray-600">${partner.message}</p>` : ''}
                ${partner.admin_notes ? `<p class="mt-2 text-sm text-blue-600"><strong>Admin Notes:</strong> ${partner.admin_notes}</p>` : ''}
            </div>
            <div class="ml-4 flex space-x-2">
                <select onchange="updatePartnerStatus(${partner.id}, this.value)" class="text-sm border rounded px-2 py-1">
                    <option value="pending" ${partner.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="approved" ${partner.status === 'approved' ? 'selected' : ''}>Approved</option>
                    <option value="rejected" ${partner.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                </select>
                <button onclick="addPartnerNote(${partner.id})" class="text-blue-600 hover:text-blue-800">
                    <i class="fas fa-sticky-note"></i>
                </button>
            </div>
        </div>
    `;
    
    return div;
}

// Update partner status
async function updatePartnerStatus(id, status) {
    try {
        console.log('Updating partner status:', { id, status });
        const response = await apiCall(`/api/admin/partners/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        
        if (response) {
            console.log('Partner updated successfully');
            loadPartners();
            loadDashboardData(); // Refresh dashboard stats
        } else {
            console.error('Failed to update partner');
        }
    } catch (error) {
        console.error('Update partner error:', error);
        alert('Failed to update partner status');
    }
}

// Add partner note
async function addPartnerNote(id) {
    const note = prompt('Add admin note:');
    if (note && note.trim()) {
        try {
            console.log('Adding partner note:', { id, note });
            const response = await apiCall(`/api/admin/partners/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ admin_notes: note.trim() })
            });
            
            if (response) {
                console.log('Note added successfully');
                loadPartners();
            } else {
                console.error('Failed to add note');
            }
        } catch (error) {
            console.error('Add note error:', error);
            alert('Failed to add note');
        }
    }
}

// Call initialize filters when dashboard is shown
function showDashboard() {
    console.log('Showing dashboard');
    document.getElementById('loginModal').classList.add('hidden');
    document.getElementById('adminDashboard').classList.remove('hidden');
}

// Utility function to show errors
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    setTimeout(() => {
        errorElement.classList.add('hidden');
    }, 5000);
}