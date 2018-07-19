/**
 * @file coverview
 * @author varsha<wangshuo16@baidu.com>
 * 2018/6/22
 */
exports.interceptor = {
    coverviewInsert: (query, cb) => {
        window.swanWebRuntime.api.insertCover(query.params);
        cb(query.callback);
    },
    coverviewUpdate: (query, cb) => {
        window.swanWebRuntime.api.updateCover(query.params);
        cb(query.callback);
    },
    coverviewRemove: (query, cb) => {
        window.swanWebRuntime.api.removeCover(query.params);
        cb(query.callback);
    }
};
