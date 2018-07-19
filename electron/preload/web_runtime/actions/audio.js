/**
 * @file native audio
 * @author bailonggang
 * 2018/6/11
 */

const wrapClb = e => JSON.stringify({status: '0', message: 'ok', data: JSON.stringify(e)});

exports.interceptor = {
    audioOpen: (query, cb) => {
        const params = query.params;
        try {
            window.__swanAudio__.stop();
        } catch (e) {
            // noop
        }

        let {src, startTime, volume} = params;
        if (src) {
            const audio = window.swanWebRuntime.api.createInnerAudioContext();
            audio.src = src;
            audio.startTime = startTime;
            volume = parseFloat(volume);
            audio.volume = isNaN(volume) ? 1 : volume;
            Object.keys(params.cb).forEach(key => {
                audio[key](e => {
                    window[params.cb[key]](wrapClb(e));
                });
            });
            window.__swanAudio__ = audio;
            cb(query.callback);
        }
    },
    audioUpdate: (query, cb) => {
        const params = query.params;
        if (window.__swanAudio__) {
            Object.keys(params).forEach(key => {
                window.__swanAudio__[key] = params[key];
            });
            cb(query.callback);
        }
    },
    audioPlay: (query, cb) => {
        window.__swanAudio__.play();
        cb(query.callback);
    },
    audioPause: (query, cb) => {
        window.__swanAudio__.pause();
        cb(query.callback);
    },
    audioStop: (query, cb) => {
        window.__swanAudio__.stop();
        cb(query.callback);
    },
    audioSeek: (query, cb) => {
        const params = query.params;
        let position = params.position;
        window.__swanAudio__.seek(position);
        cb(query.callback);
    }
};
