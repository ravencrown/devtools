/**
 * @file slave processor for swanWebRuntime
 * @author lijunxiong@baidu.com
 */

const {ipcRenderer} = require('electron');
const {
    schemaProcessGenerator,
    parseSchemaParams,
    getWebContent,
    executeCallbackFn,
    executeCallback,
    authorize,
    SCHEMA
} = require('./common');
const {handler, interceptor} = require('./actions/slave');

const scope = 'slave';

const send = (schema = {}) => {
    if (schema.action) {
        ipcRenderer.send('webview:webEvent', {
            type: 'rendererWv.dispatchToMasterWebRuntime',
            params: [schema]
        });
    }
};

const schemaFn = schema => {
    switch (schema.action) {
        case 'videoOpen':
        case 'videoUpdate':
        case 'coverviewInsert':
        case 'coverviewUpdate':
        case 'coverviewRemove':
        case 'coverimageInsert':
        case 'coverimageUpdate':
        case 'coverimageRemove':
        case 'animViewInsert':
        case 'animViewUpdate':
        case 'animViewRemove':
        case 'cameraInsert':
        case 'cameraUpdate':
        case 'canvasInsert':
        case 'canvasUpdate':
        case 'canvasRemove':
            {
                let data = schema;
                let params = parseSchemaParams(schema);
                if (interceptor[schema.action]) {
                    data = interceptor[schema.action](
                        Object.assign({}, data.query, {params}),
                        executeCallback
                    );
                }
                send(data);
                return true;
            }
    }
    return false;
};

const listenerMap = {
    video: 'dispatchEvent',
    camera: 'dispatchEvent',
    message: 'dispatchEventMessage'
};

Object.keys(listenerMap).forEach(key => {
    document.addEventListener(key, e => {
        let data = Object.assign({}, e, {type: e.type});
        send({action: listenerMap[key], query: {params: data}});
    });
});

exports.content = getWebContent(scope);

exports.processor = schemaProcessGenerator(schemaFn);

exports.authorize = authorize;

exports.init = data => {
    window.page = window.page || {};
    window.page.swanbox = window.page.swanbox || {};
    window.page.swanbox.slaveId = data.wvId;
};

const eventMap = Object.assign(handler);

ipcRenderer.on('slave:webRunTime', (e, schema) => {
    const cb = executeCallbackFn({webContentsId: schema.senderId});
    if (eventMap[schema.action]) {
        try {
            eventMap[schema.action](schema.query, cb);
        } catch (e) {
            cb(schema.query.callback, Object.assign({}, SCHEMA.ERR, {message: e.message}));
        }
    } else {
        cb(schema.query.callback, SCHEMA.NOT_FOUND_ERR);
    }
});
