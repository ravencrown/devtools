/**
 * @file 授权相关
 * @author zhaoyihan
 * 17/12/27
 */

const ipcRenderer = require('electron').ipcRenderer;

let authorizeCallbacks = [];

const schemaAuthorizeMap = {
    'cameraTakePhoto': 'scope.camera',
    'cameraStartRecord': 'scope.camera',
    'recorderStart': 'scope.record'
};

const authorizeInMaster = scope => {
    ipcRenderer.send('webview:webEvent', {
        type: 'rendererWv.authorize',
        params: [scope]
    });
};

ipcRenderer.on('webview:authorize', (e, res) => {
    authorizeCallbacks = authorizeCallbacks
        .filter(item => {
            if (item.scope === res.scope) {
                if (res.status === '0') {
                    item.resolve();
                } else {
                    item.reject(JSON.stringify(res));
                }
                return false;
            }
            return true;
        });
});

module.exports = schema => {
    const scope = schemaAuthorizeMap[schema.action];
    return scope
        ? (new Promise((resolve, reject) => {
            authorizeCallbacks.push({resolve, reject, scope, schema});
            authorizeInMaster(scope);
        }))
        : Promise.resolve();
};
