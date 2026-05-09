// @ts-nocheck
/* eslint-disable no-unused-expressions, no-undef */

// Store module - centralized state management
// Exposes getters/setters for global state: user, cart, token

const Store = {
    _state: {
        user: null,
        token: null,
        cart: null,
    },

    init() {
        this._state.token = localStorage.getItem('token');
        const raw = localStorage.getItem('user');
        this._state.user = raw ? JSON.parse(raw) : null;
    },

    getUser() { return this._state.user; },
    getToken() { return this._state.token; },
    getCart() { return this._state.cart; },

    setUser(user) {
        this._state.user = user;
        if (user) localStorage.setItem('user', JSON.stringify(user));
        else localStorage.removeItem('user');
    },

    setToken(token) {
        this._state.token = token;
        if (token) localStorage.setItem('token', token);
        else localStorage.removeItem('token');
    },

    setCart(cart) {
        this._state.cart = cart;
    },

    clear() {
        this._state = { user: null, token: null, cart: null };
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    isAuthenticated() {
        return !!this._state.token && !!this._state.user;
    }
};
