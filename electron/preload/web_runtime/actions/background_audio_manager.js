/**
 * @file backgroundAudioManager
 * @author bailonggang
 * 2018/6/20
 */

const wrapClb = e => JSON.stringify({status: '0', message: 'ok', data: JSON.stringify(e)});

exports.interceptor = {
    backgroundAudioOpen: (query, cb) => {
        const params = query.params;
        if (params.src) {
            let bgAudio = window.__swanBackgroundAudioManager__;
            if (!bgAudio) {
                bgAudio = window.swanWebRuntime.api.getBackgroundAudioManager();
                window.__swanBackgroundAudioManager__ = bgAudio;
            }

            Object.keys(params).forEach(key => {
                if (key === 'cb') {
                    const cb = params.cb;
                    Object.keys(cb).forEach(cbKey => {
                        bgAudio[cbKey](e => {
                            window[cb[cbKey]](wrapClb(e));
                        });
                    });
                } else {
                    bgAudio[key] = params[key];
                }
            });
            cb(query.callback);
        }
    },
    backgroundAudioUpdate: (query, cb) => {
        const params = query.params;
        Object.keys(params).forEach(key => {
            window.__swanBackgroundAudioManager__[key] = params[key];
        });
        cb(query.callback);
    },
    backgroundAudioPlay: (query, cb) => {
        window.__swanBackgroundAudioManager__.play();
        cb(query.callback);
    },
    backgroundAudioPause: (query, cb) => {
        window.__swanBackgroundAudioManager__.pause();
        cb(query.callback);
    },
    backgroundAudioStop: (query, cb) => {
        window.__swanBackgroundAudioManager__.stop();
        cb(query.callback);
    },
    backgroundAudioSeek: (query, cb) => {
        const params = query.params;
        let position = params.position;
        window.__swanBackgroundAudioManager__.seek(position);
        cb(query.callback);
    },
    backgroundAudioGetParamsSync: (query, cb) => {
        const param = query.params.param;
        cb(query.callback);
        const ret = window.__swanBackgroundAudioManager__[param];

        if (ret !== undefined) {
            const data = {
                status: '0',
                message: 'success',
                data: {}
            };
            data.data[param] = ret;
            return JSON.stringify(data);
        }

        return JSON.stringify({
            status: '1',
            message: 'error',
            data: ''
        });
    }
};