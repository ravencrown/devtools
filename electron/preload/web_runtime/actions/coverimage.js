/**
 * @file coverimage
 * @author varsha<wangshuo16@baidu.com>
 * 2018/6/22
 */
exports.interceptor = {
    coverimageInsert: (query, cb) => {
        window.swanWebRuntime.api.insertCover(query.params);
        cb(query.callback);
    },
    coverimageUpdate: (query, cb) => {
        window.swanWebRuntime.api.updateCover(query.params);
        cb(query.callback);
    },
    coverimageRemove: (query, cb) => {
        window.swanWebRuntime.api.removeCover(query.params);
        cb(query.callback);
    }
};
