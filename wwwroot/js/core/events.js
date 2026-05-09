// @ts-nocheck
/* eslint-disable no-unused-expressions, no-undef */

// Events module - simple pub/sub event bus for inter-module communication

const EventBus = {
    _listeners: {},

    on(event, callback) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(callback);
    },

    off(event, callback) {
        if (!this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    },

    emit(event, data) {
        if (!this._listeners[event]) return;
        this._listeners[event].forEach(cb => {
            try { cb(data); } catch (e) { console.error(`EventBus error on "${event}":`, e); }
        });
    },

    once(event, callback) {
        const wrapper = (data) => {
            callback(data);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    }
};

// Standard app events:
// 'cart:updated'       — корзина изменилась
// 'user:login'         — пользователь вошёл
// 'user:logout'        — пользователь вышел
// 'comparison:changed' — список сравнения изменился
// 'favorites:changed'  — избранное изменилось
// 'products:loaded'    — товары загружены
