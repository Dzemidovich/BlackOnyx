// @ts-nocheck
/* eslint-disable no-unused-expressions, no-undef */

// Core API module - adds fetchApi to app object
// Must be loaded after app.js
Object.assign(app, {
            async fetchApi(endpoint, options = {}) {
                try {
                    const url = `${this.apiBaseUrl}/${endpoint}`;
                    console.log(`Fetching: ${url}`);

                    const token = localStorage.getItem('token');
                    const headers = {
                        'Content-Type': 'application/json',
                        ...options.headers
                    };

                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }

                    const response = await fetch(url, {
                        headers: headers,
                        ...options
                    });

                    // Handle 401 Unauthorized
                    if (response.status === 401) {
                        console.warn('Unauthorized (401)');
                        
                        // In guest mode, just return null - don't redirect
                        if (app && app.isGuestMode) {
                            console.log('Guest mode - continuing without auth');
                            return null;
                        }
                        
                        // For logged-in users, clear auth and stay on page
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        return null;
                    }

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();
                    return data;
                } catch (error) {
                    // Don't show toast for 401 (already handled above) or network errors
                    if (!error.message.includes('401')) {
                        console.warn('API Error:', error.message);
                    }
                    return null;
                }
            },

            // Data loading methods
});