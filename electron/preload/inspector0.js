/**
 * @file inspector
 * @author lijunxiong@baidu.com
 * @desc inspector webview preload js
 */


const electron = require('electron');
const Preloader = require('./preloader');
const ipcRenderer = electron.ipcRenderer;

class InspectorPreloader extends Preloader {
    init() {
        ipcRenderer.sendSync('webview:syncEvent', {
            type: 'webview.devtoolsCreated'
        });

        this.socket = null;
        this.inited = false;
        this.id = '';
    }
}

class AppDataPreloader extends Preloader {
    init() {
        this._appDataRaw = new Map();
    }

    getAppData() {
        return this._appDataRaw;
    }
}

(function (global) {

const events = [
    'master:inspector',
    'slave:inspector',
    'slave:active',
    'slave:inactive'
];

const inspectorPreloader = new InspectorPreloader({
    sender: Preloader.SENDER.ELECTRON,
    electron,
    events
});

inspectorPreloader
    .on('master:inspector', ({type, toolsInfo, pageStack, activeTabId}) => {
        switch (type) {
            case 'slaveCreate':
            case 'slaveShow':
                inspectorPreloader.id = toolsInfo.id;
                inspectorPreloader.emit('slave:active', toolsInfo.webSocketDebuggerUrl);
                break;
            case 'slaveHide':
            case 'slaveRemove':
                if (toolsInfo.id === inspectorPreloader.id) {
                    inspectorPreloader.id = '';
                    inspectorPreloader.emit('slave:inactive');
                    if (type === 'slaveRemove') {
                        ipcRenderer.send('renderer:master', {
                            type: 'devtools.removeData',
                            params: {pageData: toolsInfo}
                        });
                    }
                }
                break;
        }
    })
    .on('slave:inspector', ({data, toolsInfo}) => {
        switch (data.message) {
            case 'retrieveRoot':
                inspectorPreloader.emit('sanRoot', data.treeData);
                break;
            default:
                if (toolsInfo.id === inspectorPreloader.id) {
                    inspectorPreloader.emit('san', data);
                }
                break;
        }
    });

global.swanInspector = inspectorPreloader;


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
    var action = data.action;
    var timestamp = Date.now();
    var id = data.args.pageData.id;
    var url = data.args.pageData.url;
    var title = ((url, re) => url && url.match(re) ? url.match(re)[1] : url)(url, /pages(\/.*$)/);
    switch (action) {
        case 'initData':
            if (appDataPreloader.id !== id) {
                appDataPreloader.id = id;
                var mutations = [];
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
        case 'setData':
            if (appDataPreloader.id !== id) {
                appDataPreloader.id = id;
            }
            var raw = appDataPreloader._appDataRaw.get(id);
            if (raw && raw.mutations) {
                raw.mutations.set(timestamp, {
                    action,
                    timestamp: new Date(timestamp).toLocaleString(),
                    value: JSON.stringify(data.args.setObject)
                });
            }
            break;
        case 'removeData':
            if (appDataPreloader.id === id) {
                appDataPreloader.id = '';
                appDataPreloader._appDataRaw.delete(id);
            }
            break;
    }
});

global.swanAppData = appDataPreloader;

})(window);
