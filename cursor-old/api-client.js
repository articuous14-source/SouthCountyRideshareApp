// API Client for frontend - replaces localStorage calls
const API_BASE = '/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
        credentials: 'include', // Include cookies for session
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };
    
    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Authentication API
const authAPI = {
    driverLogin: (username, password) => 
        apiCall('/auth/driver/login', { method: 'POST', body: { username, password } }),
    
    adminLogin: (username, password) => 
        apiCall('/auth/admin/login', { method: 'POST', body: { username, password } }),
    
    driverRegister: (data) => 
        apiCall('/auth/driver/register', { method: 'POST', body: data }),
    
    logout: () => 
        apiCall('/auth/logout', { method: 'POST' }),
    
    getCurrentUser: () => 
        apiCall('/auth/current')
};

// Rides API
const ridesAPI = {
    getAll: () => 
        apiCall('/rides'),
    
    getById: (id) => 
        apiCall(`/rides/${id}`),
    
    create: (rideData) => 
        apiCall('/rides', { method: 'POST', body: rideData }),
    
    accept: (id) => 
        apiCall(`/rides/${id}/accept`, { method: 'POST' }),
    
    complete: (id) => 
        apiCall(`/rides/${id}/complete`, { method: 'POST' }),
    
    confirmPickup: (id) => 
        apiCall(`/rides/${id}/confirm-pickup`, { method: 'POST' }),
    
    cancel: (id) => 
        apiCall(`/rides/${id}/cancel`, { method: 'POST' }),
    
    update: (id, data) => 
        apiCall(`/rides/${id}`, { method: 'PUT', body: data }),
    
    delete: (id) => 
        apiCall(`/rides/${id}`, { method: 'DELETE' })
};

// Drivers API
const driversAPI = {
    getAll: () => 
        apiCall('/drivers'),
    
    getByUsername: (username) => 
        apiCall(`/drivers/${username}`),
    
    getRides: (username) => 
        apiCall(`/drivers/${username}/rides`),
    
    update: (username, data) => 
        apiCall(`/drivers/${username}`, { method: 'PUT', body: data }),
    
    getDaysOff: (username) => 
        apiCall(`/drivers/${username}/days-off`),
    
    addDayOff: (username, date) => 
        apiCall(`/drivers/${username}/days-off`, { method: 'POST', body: { date } }),
    
    removeDayOff: (username, id) => 
        apiCall(`/drivers/${username}/days-off/${id}`, { method: 'DELETE' })
};

// Admin API
const adminAPI = {
    getOverview: () => 
        apiCall('/admin/overview'),
    
    deleteDriver: (username) => 
        apiCall(`/admin/drivers/${username}`, { method: 'DELETE' }),
    
    resetDriverPassword: (username, newPassword) => 
        apiCall(`/admin/drivers/${username}/reset-password`, { method: 'POST', body: { newPassword } }),
    
    updateSettings: (settings) => 
        apiCall('/admin/settings', { method: 'PUT', body: settings })
};

// Messages API
const messagesAPI = {
    send: (toUsername, toName, message) => 
        apiCall('/messages', { method: 'POST', body: { toUsername, toName, message } }),
    
    getConversations: () => 
        apiCall('/messages/conversations'),
    
    getConversation: (otherUsername) => 
        apiCall(`/messages/conversation/${otherUsername}`),
    
    markAsRead: (otherUsername) => 
        apiCall(`/messages/conversation/${otherUsername}/read`, { method: 'POST' }),
    
    getUnreadCount: () => 
        apiCall('/messages/unread-count'),
    
    // Group messaging
    sendGroup: (message) => 
        apiCall('/messages/group', { method: 'POST', body: { message } }),
    
    getGroup: (limit) => 
        apiCall(`/messages/group${limit ? `?limit=${limit}` : ''}`),
    
    getGroupUnreadCount: () => 
        apiCall('/messages/group/unread-count'),
    
    markGroupReadAll: () => 
        apiCall('/messages/group/read-all', { method: 'POST' })
};

// Surveys API
const surveysAPI = {
    getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiCall(`/surveys${queryString ? '?' + queryString : ''}`);
    },
    
    getById: (id) => 
        apiCall(`/surveys/admin/${id}`)
};

// Reviews API
const reviewsAPI = {
    getAll: (status) => {
        const query = status ? `?status=${status}` : '';
        return apiCall(`/reviews${query}`);
    },
    
    getApproved: () => 
        apiCall('/reviews/approved'),
    
    create: (reviewData) => 
        apiCall('/reviews', { method: 'POST', body: reviewData }),
    
    approve: (id) => 
        apiCall(`/reviews/${id}/approve`, { method: 'POST' }),
    
    reject: (id) => 
        apiCall(`/reviews/${id}/reject`, { method: 'POST' }),
    
    delete: (id) => 
        apiCall(`/reviews/${id}`, { method: 'DELETE' })
};

// Announcements API
const announcementsAPI = {
    getAll: (active) => {
        const query = active !== undefined ? `?active=${active}` : '';
        return apiCall(`/announcements${query}`);
    },
    
    create: (data) => 
        apiCall('/announcements', { method: 'POST', body: data }),
    
    update: (id, data) => 
        apiCall(`/announcements/${id}`, { method: 'PUT', body: data }),
    
    delete: (id) => 
        apiCall(`/announcements/${id}`, { method: 'DELETE' })
};

// Export API objects
if (typeof window !== 'undefined') {
    window.API = {
        auth: authAPI,
        rides: ridesAPI,
        drivers: driversAPI,
        admin: adminAPI,
        messages: messagesAPI,
        reviews: reviewsAPI,
        surveys: surveysAPI,
        announcements: announcementsAPI
    };
    // Also set as global API for convenience
    if (typeof API === 'undefined') {
        window.API = window.API; // This makes API available globally
        // In strict mode, we need to explicitly set it
        try {
            eval('var API = window.API;');
        } catch(e) {
            // If eval fails, API will only be available as window.API
        }
    }
    console.log('API client loaded successfully. Available APIs:', Object.keys(window.API));
}



