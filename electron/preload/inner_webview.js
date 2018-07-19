/**
 * @file 注入到webview组件中
 * @author zhaoyihan
 * 18/6/14
 */

const ipcRenderer = require('electron').ipcRenderer;

const {schemeParser, schemeListenr} = require('./lib/utils/scheme_parser');

const sendToMain = schemeInfo => {
    const action = schemeInfo.action;
    ipcRenderer.send('webview:event', {
        type: 'scheme.' + action,
        params: [schemeInfo]
    });
};

schemeListenr
    .on('webkit.messageHandlers.BBAMNPJSBridge.postMessage', scheme => sendToMain(schemeParser(scheme)))
    .on('androidJsBridge.dispatch', scheme => sendToMain(schemeParser(scheme)))
    .on('Bdbox_aiapps_jsbridge.dispatch', scheme => sendToMain(schemeParser(scheme)))
    .on('prompt', scheme => {
        let promptParser;
        try {
            promptParser = JSON.parse(scheme.replace(/^BdboxApp:/, '')).args[0];
        }
        catch (e) {
            promptParser = '';
        }
        return sendToMain(schemeParser(promptParser));
    });

window['__swanjs_environment'] = 'swan';