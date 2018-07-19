/**
 * @file utils for swanWebRuntime
 * @author lijunxiong@baidu.com
 */
const {ipcRenderer} = require('electron');

const escapeParams = str => {
    return '\"' + str.replace(/(["|\\|/])/g, '\\$1') + '\"';
};

ipcRenderer.on('webview:executeCallback', (e, data) => {
    const {name, params} = data;
    window[name](params);
});

exports.SCHEMA = {
    NOT_FOUND_ERR: {status: '302', message: '找不到调起协议对应端能力方法'},
    SUCCESS: {status: '0', message: 'ok'},
    ERR: {status: '1', message: 'fail'}
};

exports.schemaProcessGenerator = func => schema => {
    try {
        return func(schema);
    } catch (e) {
        console.error(e, schema);
    }
    return false;
};

exports.parseSchemaParams = schemaObj => schemaObj.query.params ? JSON.parse(schemaObj.query.params) : {};

exports.getWebContent = scope =>
    ipcRenderer.sendSync('webview:syncEvent', {
        type: 'vendorWv.getSwanWebRuntime',
        params: [scope]
    });

exports.executeCallbackFn = ({id, webContentsId}) => (name, params = exports.SCHEMA.SUCCESS) => {
    if (name) {
        let str = JSON.stringify(params);
        ipcRenderer.send('renderer:master', {
            type: 'rendererWv.executeScript',
            params: {id, webContentsId, code: `${name}(${escapeParams(str)})`}
        });
    }
};

exports.executeCallback = (name, params = exports.SCHEMA.SUCCESS) => {
    if (name) {
        window[name](params);
    }
};

exports.authorize = require('./authorize');

exports.convertURLToBuffer = url =>
    fetch(url)
        .then(response => response.blob())
        .then(blob => new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.onload = function () {
                if (reader.readyState === 2) {
                    const buffer = new Buffer(reader.result);
                    resolve(buffer);
                }
            };
            reader.readAsArrayBuffer(blob);
        }));
