/**
 * Swan IDE GUI
 * Copyright 2018 Baidu Inc. All rights reserved.
 *
 * @file Preloader class
 * @author luyuan02
 */


/**
 * A Preloader represents an object in preload script to transmit messages
 * between separated renderer processes.
 *
 * @class
 */
class Preloader {

    /**
     * Preloader consturctor
     *
     * @param {number} options.sender     The enum of original message sender
     * @param {Array}  options.events     The valid event names
     * @param {Object} options.electron   The electron module
     */
    constructor({sender, events = [], electron} = {}) {
        this._sender = sender;
        if (sender === Preloader.SENDER.ELECTRON) {
            if (!electron || typeof electron !== 'object') {
                throw new Error('Missing electron module.');
            }
            this._getElectron = () => electron;
        }
        this._events = events;
        this._listeners = {};

        this._adapt();
        this.init();

    }

    /**
     * Return the event names.
     *
     * @return {Array}
     */
    getEvents() {
        return this._events;
    }

    /**
     * Adapter of senders.
     *
     * @inner
     */
    _adapt() {
        switch (this._sender) {
            case Preloader.SENDER.HTML: {
                document.addEventListener('message', ev => {
                    if (!ev.message || typeof ev.message === 'object') {
                        return;
                    }

                    const msg = JSON.parse(unescape(decodeURIComponent(ev.message)));
                    if (this._events.indexOf(msg.type) < 0) {
                        return;
                    }
                    this.emit(msg.type, msg);
                });
                break;
            }
            case Preloader.SENDER.ELECTRON: {
                this._events.forEach(event => {
                    if (this._getElectron().ipcRenderer) {
                        this._getElectron().ipcRenderer.on(event, (e, data) => {
                            this.emit(event, data, e);
                        });
                    }
                });
                break;
            }
            case Preloader.SENDER.NATIVE:
                // TO DO
                break;
            default:
                break;
        }
    }

    /**
     * Register the listener triggered only once.
     *
     * @param {string} event    The event name.
     * @param {Function} func   The listener callback.
     * @return {Preloader}
     */
    once(event, func) {
        const funcWrapper = (...args) => {
            this.off(event, funcWrapper);
            if (typeof func === 'function') {
                func.apply(this, args);
            }
        };
        return this.on(event, funcWrapper);
    }

    /**
     * Register the listener triggered repeatedly.
     *
     * @param {string} event    The event name.
     * @param {Function} func   The listener callback.
     * @return {Preloader}
     */
    on(event, func) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        if (typeof func === 'function') {
            this._listeners[event].push(func);
        }
        return this;
    }

    /**
     * Cancel the listener.
     *
     * @param {string} event    The event name.
     * @param {Function} func   The listener callback.
     * @return {Preloader}
     */
    off(event, func) {
        if (!this._listeners[event]) {
            return this;
        }
        let index = this._listeners[event].indexOf(func);
        if (index !== -1) {
            this._listeners[event].splice(index, 1);
        }
        if (!this._listeners[event].length) {
            this._listeners[event] = null;
        }
        return this;
    }

    /**
     * Emit the listener.
     *
     * @param {string} event    The event name.
     * @param {...*} args       The arguments of listener.
     * @return {Preloader}
     */
    emit(event, ...args) {
        if (this._listeners[event]) {
            this._listeners[event].map(func => func.apply(this, args));
        }
        return this;
    }

    /**
     * Initialize.
     *
     * @overload
     */
    init() {
    }

}

// Enum for Preloader.SENDER
Preloader.SENDER = {
    HTML: 0,
    ELECTRON: 1,
    NATIVE: 2
};

module.exports = Preloader;
