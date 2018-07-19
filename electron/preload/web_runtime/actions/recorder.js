/**
 * @file web runtime recorder
 * @author lijunxiong@baidu.com
 */

const ipcRenderer = require('electron').ipcRenderer;
const convertURLToBuffer = require('../common').convertURLToBuffer;
const wrapClb = e => JSON.stringify({status: '0', message: 'ok', data: JSON.stringify(e)});

exports.interceptor = {
    recorderStart: query => {
        const params = query.params;
        try {
            window.__swanRecorder__.stop();
        } catch (e) {
            // noop
        }

        if (!window.__swanRecorder__) {
            const recorder = window.swanWebRuntime.api.getRecorderManager();
            Object.keys(params.cb).forEach(key => {
                recorder[key](e => {
                    if (key === 'onStop') {
                        const tempFilePath = e.tempFilePath;
                        convertURLToBuffer(tempFilePath).then(buf => {
                            ipcRenderer.send('blob:save', {
                                type: 'swan.saveAudioFromBlob',
                                callback: params.cb[key],
                                format: params.format
                            }, buf);
                        });
                    } else {
                        window[params.cb[key]](wrapClb(e));
                    }
                });
            });
            window.__swanRecorder__ = recorder;
        }

        window.__swanRecorder__.start(query.params);
    },
    recorderStop: (query, cb) => {
        window.__swanRecorder__.stop();
        cb(query.callback);
    },
    recorderPause: (query, cb) => {
        window.__swanRecorder__.pause();
        cb(query.callback);
    },
    recorderResume: (query, cb) => {
        window.__swanRecorder__.resume();
        cb(query.callback);
    }
};
