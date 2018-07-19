/**
 * @file native video
 * @author bailonggang
 * 2018/6/11
 */
const {ipcRenderer} = require('electron');
const slaveHandlerGenerator = (type, preProcessor) => (query, cb) => {
    const data = query.params;
    const video = window.swanWebRuntime.api.createVideoContext(data.videoId);
    let params = data;
    if (preProcessor) {
        params = preProcessor(data);
    }
    video[type](params);
    cb(query.callback);
};

exports.interceptor = {
    videoOpen: (query, cb) => {
        window.swanWebRuntime.api.openVideo(query.params);
        cb(query.callback);
    },
    videoUpdate: (query, cb) => {
        window.swanWebRuntime.api.updateVideo(query.params);
        cb(query.callback);
    }
};

exports.handler = {
    videoPlay: slaveHandlerGenerator('play'),
    videoPause: slaveHandlerGenerator('pause'),
    videoSeek: slaveHandlerGenerator('seek', data => data.position),
    videoSendDanmu: (query, cb) => {
        window.swanWebRuntime.api.sendDanmu(query.params);
        cb(query.callback);
    },
    videoFullScreen: (query, cb) => {
        const data = query.params;
        if (data.fullScreen) {
            ipcRenderer.send(
                'executeJavascriptWithGesture',
                `window.swanWebRuntime.api.createVideoContext('${data.videoId}').requestFullScreen()`
            );
        } else {
            window.swanWebRuntime.api.createVideoContext(data.videoId).exitFullScreen();
        }
        cb(query.callback);
    }
};
