/**
 * @file master processor for swanWebRuntime
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
const {interceptor} = require('./actions/master');

const scope = 'master';

const send = (schema = {}) => {
    if (schema.action) {
        ipcRenderer.send('webview:webEvent', {
            type: 'rendererWv.dispatchToSlaveWebRuntime',
            params: [schema]
        });
    }
};

const schemaFn = schema => {
    switch (schema.action) {
        case 'videoPlay':
        case 'videoPause':
        case 'videoSeek':
        case 'videoFullScreen':
        case 'videoSendDanmu':
        case 'audioOpen':
        case 'audioUpdate':
        case 'audioPlay':
        case 'audioPause':
        case 'audioStop':
        case 'audioSeek':
        case 'backgroundAudioOpen':
        case 'backgroundAudioUpdate':
        case 'backgroundAudioPlay':
        case 'backgroundAudioPause':
        case 'backgroundAudioStop':
        case 'backgroundAudioSeek':
        case 'cameraTakePhoto':
        case 'cameraStartRecord':
        case 'cameraStopRecord':
        case 'recorderStart':
        case 'recorderPause':
        case 'recorderResume':
        case 'recorderStop':
        case 'canvasDrawCanvas':
            {
                let data = schema;
                let params = parseSchemaParams(data);
                if (interceptor[schema.action]) {
                    data = interceptor[schema.action](
                        Object.assign({}, data.query, {params}),
                        executeCallback
                    );
                }
                send(data);
                return true;
            }
        case 'canvasMeasureTextSync':
            {
                let data = schema;
                send(data);
                let params = parseSchemaParams(data);
                if (interceptor[schema.action]) {
                    return interceptor[schema.action](
                        Object.assign({}, data.query, {params}),
                        executeCallback
                    );
                }
            }
            break;
        case 'backgroundAudioGetParamsSync':
            {
                let data = schema;
                let params = parseSchemaParams(data);
                if (interceptor[schema.action]) {
                    return interceptor[schema.action](
                        Object.assign({}, data.query, {params}),
                        executeCallback
                    );
                }
            }
            break;
    }
    return false;
};

exports.content = getWebContent(scope);

exports.processor = schemaProcessGenerator(schemaFn);

exports.authorize = authorize;

exports.init = data => {
    window.ENV = 'master';
    window.__swanAudio__ = null;
    window.__swanBackgroundAudioManager__ = null;
    window.__swanRecorder__ = null;
    let func = new Function(exports.content);
    func();
};

const eventMap = {
    dispatchEvent: query => {
        const params = query.params;
        const {type, wvID, vtype, data} = params;
        const event = new Event(type);
        event.wvID = wvID;
        event.vtype = vtype;
        event.data = data;
        document.dispatchEvent(event);
    },
    dispatchEventMessage: query => {
        const {type, message} = query.params;
        if (typeof message !== 'object') {
            return;
        }
        const event = new Event(type);
        Object.assign(event, {message});
        document.dispatchEvent(event);
    }
};

ipcRenderer.on('master:webRunTime', (e, schema) => {
    const cb = executeCallbackFn({webContentsId: schema.senderId});
    if (eventMap[schema.action]) {
        try {
            eventMap[schema.action](schema.query, cb);
        } catch (e) {
            cb(
                schema.query.callback,
                Object.assign({}, SCHEMA.ERR, {message: e.message})
            );
        }
    } else {
        cb(schema.query.callback, SCHEMA.NOT_FOUND_ERR);
    }
});
