/**
 * @file devtools
 * @author wanghongliang02
 * 2018/5/13
 */


const ipcRenderer = require('electron').ipcRenderer;


let ret = ipcRenderer.sendSync('webview:syncEvent', {
    type: 'webview.devtoolsCreated'
});

console.log(ret);

function ipcEvent(name, func) {
    ipcRenderer.on(name, func);
}

function ipcEventOnce(name, func) {
    ipcRenderer.once(name, func);
}

function getPageDom() {
    return new Promise((resolve, reject) => {
        let timestamp = Date.now();
        ipcRenderer.send('devtools:send', {
            action: 'dom',
            eventName: 'getPageDom-' + timestamp
        });
        ipcEventOnce('getPageDom-' + timestamp, (e, data) => {
            resolve({
                pageId: data.pageId,
                sanDevtool: data.sanDevtool
            });
        });
    });
}

let onShowList = [];
function onPageShow(func) {
    if (func) {
        onShowList.push(func);
    }
}
ipcRenderer.on('devtools:onPageShow', (e, data) => {
    onShowList.forEach((func, i) => {
        func && func({
            pageId: data.pageId,
            sanDevtool: data.sanDevtool
        });
    });
});


let storageFuncList = [];
let storage = {
    getAll() {
        return ipcRenderer.sendSync('webview:syncEvent', {
            type: 'devtools.getAllStorage'
        });
    },
    set(key, value) {
        return ipcRenderer.sendSync('webview:syncEvent', {
            type: 'devtools.setStorage',
            params: [key, value]
        });
    },
    get(key) {
        return ipcRenderer.sendSync('webview:syncEvent', {
            type: 'devtools.getStorage',
            params: [key]
        });
    },
    remove(key) {
        return ipcRenderer.sendSync('webview:syncEvent', {
            type: 'devtools.removeStorage',
            params: [key]
        });
    },
    clear() {
        return ipcRenderer.sendSync('webview:syncEvent', {
            type: 'devtools.clearStorage'
        });
    },
    on(func) {
        func && storageFuncList.push(func);
    }
};
ipcRenderer.on('devtools:storage', (e, data) => {

    data.action && storageFuncList.forEach((func, i) => {
        func && func({
            action: data.action,
            args: data.args
        });
    });
});


let appDataFuncList = [];
let appData = {
    on(func) {
        func && appDataFuncList.push(func);
    },
    getData() {
        return new Promise((resolve, reject) => {

            let timestamp = Date.now();
            ipcRenderer.send('devtools:send', {
                action: 'data',
                eventName: 'getData-' + timestamp
            });
            ipcEventOnce('getData-' + timestamp, (e, data) => {
                resolve({
                    action: data.action,
                    pageId: data.pageId,
                    url: data.url,
                    sanDevtool: data.sanDevtool
                });
            });
        });
    }
};
ipcRenderer.on('devtools:appdata', (e, {action, pageId, url, sanDevtool}) => {

    switch (action) {
        case 'add':
        case 'remove':
        case 'update':
        default:
    }
    action && appDataFuncList.forEach((func, i) => {
        func && func({
            action,
            pageId,
            url,
            sanDevtool
        });
    });
});

window.swanDevtools = {
    onPageShow,
    getPageDom,
    storage,
    appData
};