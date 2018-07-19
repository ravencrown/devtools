/**
 * @file animationView
 * @author bailonggang
 * 2018/6/21
 */

const {ipcRenderer} = require('electron');

exports.interceptor = {
    animViewInsert: (query, cb) => {
        const filePath = ipcRenderer.sendSync('webview:syncEvent', {
            type: 'scheme.getOutputPath'
        });
        query.params.path = filePath + query.params.path;
        window.swanWebRuntime.api.insertAnimationView(query.params);
        cb(query.callback);
    },
    animViewUpdate: (query, cb) => {
        window.swanWebRuntime.api.updateAnimationView(query.params);
        cb(query.callback);
    },
    animViewRemove: (query, cb) => {
        window.swanWebRuntime.api.removeAnimationView(query.params);
        cb(query.callback);
    }
};