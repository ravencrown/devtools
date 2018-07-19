/**
 * @file web-runtime camera
 * @author lijunxiong@baidu.com
 */
const {SCHEMA, convertURLToBuffer} = require('../common');
const ipcRenderer = require('electron').ipcRenderer;

const fail = (cb, name) => e => {
    let message = 'fail';
    if (e) {
        message = e.message;
    }
    cb(name, Object.assign({}, SCHEMA.ERR, {message}));
};

exports.interceptor = {
    cameraInsert: (query, cb) => {
        window.swanWebRuntime.api.insertCamera(query.params);
        cb(query.callback);
    },
    cameraUpdate: (query, cb) => {
        window.swanWebRuntime.api.updateCamera(query.params);
        cb(query.callback);
    }
};

exports.handler = {
    cameraTakePhoto: (query, cb) => {
        const data = query.params;
        const camera = window.swanWebRuntime.api.createCameraContext();
        data.fail = fail(cb, query.callback);
        data.success = res => {
            const tempImagePath = res.tempImagePath;
            ipcRenderer.send('blob:save', {
                type: 'swan.saveImage',
                callback: query.callback,
                format: 'jpg'
            }, tempImagePath);
        };
        camera.takePhoto(data);
    },
    cameraStartRecord: (query, cb) => {
        const data = query.params;
        const camera = window.swanWebRuntime.api.createCameraContext();
        window['__swanCamera__'] = camera;
        data.fail = fail(cb, query.callback);

        data.success = res => {
            cb(query.callback, Object.assign({}, SCHEMA.SUCCESS, {data: res}));
        };
        data.timeoutCallback = res => {
            cb(data.timeoutCallback, Object.assign({}, SCHEMA.SUCCESS, {data: res}));
        };
        camera.startRecord(data);
    },
    cameraStopRecord: (query, cb) => {
        const data = query.params;
        const camera = window['__swanCamera__'];
        data.fail = fail(cb, query.callback);

        data.success = res => {
            const tempVideoPath = res.tempVideoPath;
            convertURLToBuffer(tempVideoPath).then(buf => {
                ipcRenderer.send('blob:save', {
                    type: 'swan.saveVideoFromBlob',
                    callback: query.callback,
                    format: 'mp4'
                }, buf);
            });
        };
        camera.stopRecord(data);
    }
};

