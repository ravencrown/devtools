/**
 * @file inspector
 * @author lijunxiong@baidu.com
 * @desc inspector webview preload js
 */

const {ipcRenderer} = require('electron');
const Preloader = require('./preloader');
const electron = require('electron');
const logger = require('electron-log-swan');


class AppDataPreloader extends Preloader {
    init() {
        this._appDataRaw = new Map();
    }

    getAppData() {
        return this._appDataRaw;
    }
}

class StoragePreloader extends Preloader {
    init() {
        this._storageRaw = ipcRenderer.sendSync('renderer:masterSync',
            {type: 'devtools.getAllStorage'});
    }

    getStorage() {
        return this._storageRaw;
    }

    set(key, value) {
        if (key) {
            this._storageRaw[key] = value;
        }
    }

    remove(key) {
        delete this._storageRaw[key];
    }

    clearStorage() {
        this._storageRaw = {};
    }

    sendSync(message, data) {
        ipcRenderer.sendSync(message, data);
    }
}

class SensorsPreloader extends Preloader {
    constructor(...args) {
        super(...args);
        this.clearNetworkCache = false;
    }

    init() {
        const sensorsKeys = ['compass', 'location', 'deviceOrientation'];
        const initSensorsData = {
            compass: {
                direction: 0
            },
            location: {
                latitude: 40,
                longitude: 116,
                speed: 2,
                accuracy: 50,
                altitude: 65,
                verticalAccuracy: 65,
                horizontalAccuracy: 65
            },
            deviceOrientation: {
                alpha: 0,
                beta: 0,
                gamma: 0
            }
        };
        sensorsKeys.forEach(key => {
            let save = localStorage.getItem(`swan-ide-devtools-sensors-${key}`);
            if (save === null) {
                return;
            }
            try {
                Object.assign(initSensorsData[key], JSON.parse(save));
            } catch (e) {
                logger.error('get sensors storage error', e);
            }
        });

        this._initSensorsData = initSensorsData;

        this.on('sendSensorsData', data => {
            for (const key in data) {
                try {
                    localStorage.setItem(`swan-ide-devtools-sensors-${key}`, JSON.stringify(data[key]));
                } catch (e) {
                    logger.error('sensors data must be an object', e);
                }
            }
            this._getElectron().ipcRenderer.send('renderer:master', {
                type: 'devtools.setSensorsData',
                params: data
            });
        });

        this._initMasterSensorsCache();

        logger.info('init devtools sensor data');
    }

    _initMasterSensorsCache() {
        for (const key in this._initSensorsData) {
            this.emit('sendSensorsData', {
                [key]: this._initSensorsData[key]
            });
        }
    }
}

ipcRenderer.sendSync('webview:syncEvent', {
    type: 'webview.devtoolsCreated'
});

(function (gloabl) {
    const events = {};
    const listeners = {};
    const dispatch = (type, ...args) => {
        listeners[type] = listeners[type] || [];
        if (listeners[type].length) {
            listeners[type].forEach(fn => {
                fn.apply(undefined, args);
            });
        } else {
            events[type] = events[type] || [];
            events[type].push(args);
        }
    };
    const on = (type, fn, opts = {}) => {
        listeners[type] = listeners[type] || [];
        listeners[type].push(fn);
        if (!opts.skip && events[type] && events[type].length) {
            events[type].forEach(args => {
                fn.apply(undefined, args);
            });
            events[type].length = 0;
        }
    };
    const off = type => {
        listeners[type] = [];
    };
    gloabl.swanInspector = {
        dispatch: dispatch,
        on: on,
        off: off,
        socket: null,
        inited: false,
        id: ''
    };
    ipcRenderer
        .on('master:inspector', (e, {type, toolsInfo}) => {
            switch (type) {
                // case 'slaveCreate':
                case 'slaveShow':
                    gloabl.swanInspector.id = toolsInfo.id;
                    dispatch('slave:active', toolsInfo.webSocketDebuggerUrl);
                    break;
                case 'slaveHide':
                    if (toolsInfo.id === gloabl.swanInspector.id) {
                        gloabl.swanInspector.id = '';
                        dispatch('slave:inactive');
                    }
                    break;
                case 'slaveRemove':
                    if (toolsInfo.id === gloabl.swanInspector.id) {
                        ipcRenderer.send('renderer:master', {
                            type: 'devtools.removeData',
                            params: {pageData: toolsInfo}
                        });
                    }
                    break;
            }
        })
        .on('slave:inspector', (e, {data, toolsInfo}) => {
            switch (data.message) {
                case 'retrieveRoot':
                    dispatch('sanRoot', data.treeData);
                    break;
                default:
                    if (toolsInfo.id === gloabl.swanInspector.id) {
                        dispatch('san', data);
                    }
                    break;
            }
        });

    const storagePreloader = new StoragePreloader({
        sender: Preloader.SENDER.ELECTRON,
        events: ['master:inspector'],
        electron
    });

    storagePreloader.on('master:inspector', data => {
        if (!data || data.type !== 'storage') {
            return;
        }
        if (!data.args || data.args.length === 0) {
            return;
        }

        const action = data.action;
        const [key, value] = data.args;

        switch (action) {
            case 'set': {
                storagePreloader.set(key, value);
                break;
            }
            case 'get': {
                break;
            }
            case 'clear': {
                storagePreloader.clearStorage();
                break;
            }
            case 'remove': {
                if (key) {
                    storagePreloader.remove(key);
                }
                break;
            }
        }
    });

    global.storage = storagePreloader;

    const appDataPreloader = new AppDataPreloader({
        sender: Preloader.SENDER.ELECTRON,
        events: ['master:inspector'],
        electron
    });

    appDataPreloader.on('master:inspector', data => {
        if (!data || data.type !== 'appData') {
            return;
        }
        if (!data.args || !data.args.pageData) {
            return;
        }

        appDataPreloader.data = data.args;
        let action = data.action;
        let timestamp = Date.now();
        let id = data.args.pageData.id;
        let url = data.args.pageData.url;
        let title = ((url, re) => url && url.match(re) ? url.match(re)[1] : url)(url, /pages(\/.*$)/);
        switch (action) {
            case 'initData': {
                if (appDataPreloader.id !== id) {
                    appDataPreloader.id = id;
                    let mutations = [];
                    if (appDataPreloader._appDataRaw.get(id)) {
                        break;
                    }

                    appDataPreloader._appDataRaw.set(id, {
                        id,
                        title,
                        url,
                        pageData: data.args.pageData,
                        mutations: new Map([[
                            timestamp, {
                                action,
                                timestamp: new Date(timestamp).toLocaleString(),
                                value: JSON.stringify(data.args.value)
                            }
                        ]])
                    });
                }
                break;
            }
            case 'setData': {
                if (appDataPreloader.id !== id) {
                    appDataPreloader.id = id;
                }
                let raw = appDataPreloader._appDataRaw.get(id);
                if (raw && raw.mutations) {
                    raw.mutations.set(timestamp, {
                        action,
                        timestamp: new Date(timestamp).toLocaleString(),
                        value: JSON.stringify(data.args.setObject)
                    });
                }
                break;
            }
            case 'removeData': {
                if (appDataPreloader.id === id) {
                    appDataPreloader.id = '';
                    appDataPreloader._appDataRaw.delete(id);
                }
                break;
            }
        }
    });

    global.swanAppData = appDataPreloader;

    const sensorsDataPreloader = new SensorsPreloader({
        sender: Preloader.SENDER.ELECTRON,
        events: ['master:inspector'],
        electron
    });

    sensorsDataPreloader.on('master:inspector', function (data) {
        if (data.type === 'clearNetworkCache') {
            this.clearNetworkCache = true;
        }
    });


    global.swanSensorsData = sensorsDataPreloader;

})(window);
