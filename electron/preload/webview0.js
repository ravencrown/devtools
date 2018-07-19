/**
 * @file webview
 * @author wanghongliang02
 * @desc master 和 slave 使用同一个preload.js,按id区分。
 * webview间通信还是需要render or main 转发
 * 2018/4/22
 */


// 需要一个list,记录哪些走scheme,这部分内容不拦截。

// todo 过编译
const ipcRenderer = require('electron').ipcRenderer;
const url = require('url');
const log = require('electron-log-swan');
const {initHook} = require('@ecomfe/san-devhook');
const CanvasContext = require('./lib/canvas/canvasContext');
const VideoContext = require('./lib/video/videoContext');
const showNativeInput = require('./lib/input');
const {request} = require('./lib/network');
const location = require('./lib/location');

const Preloader = require('./preloader');

// todo 这里是一些实现在preload中的端能力
// const CanvasContext = require('../canvas/canvasContext');
// const {request} = require('../network');
// const showNativeInput = require('../input');
// const createInnerAudioContext = require('../audio');

let isReachTop = true;
// 代码提示 proxy
let ret;

// registerEvent();
// createSwan();
const inspectorSender = {
    toolsInfo: null,
    send: (channel, data) => {
        if (inspectorSender.toolsInfo) {
            if (channel) {
                data.params.toolsInfo = inspectorSender.toolsInfo;
                ipcRenderer.send(channel, data);
            }
        } else {
            inspectorSender.list.push({channel, data});
        }
    },
    clear: () => {
        for (let i = 0; i < inspectorSender.list.length; i++) {
            let {channel, data} = inspectorSender.list[i];
            data.params.toolsInfo = inspectorSender.toolsInfo;
            ipcRenderer.send(channel, data);
        }
        inspectorSender.list.length = 0;
    },
    list: []
};

function initAppData(pageData) {
    const inspectorPreloader = new Preloader({
        sender: Preloader.SENDER.HTML,
        events: ['initData', 'setData']
    });

    inspectorPreloader
        .on('initData', data => {
            data.pageData = pageData;
            ipcRenderer.send('renderer:master', {
                type: 'devtools.' + data.type,
                params: data
            });
        })
        .on('setData', data => {
            data.pageData = pageData;
            ipcRenderer.send('renderer:master', {
                type: 'devtools.' + data.type,
                params: data
            });
        });
}

function initSlaveSanHook() {
    initHook({
        hookOnly: false,
        subKey: 'treeData',
        onAfterGenerateData: (message, cNode, parentId, component) => {
            if (message === 'comp-attached') {
                let prev = cNode.ancestorIndexList.reduce((pre, cur, index, arr) => {
                    const len = arr.length;
                    let res = null;
                    if (index === 0) {
                        cur = 0;
                    }
                    if (pre && Array.isArray(pre.treeData) && !pre.fake) {
                        return index === len - 1 ? pre.treeData[cur - 1] : pre.treeData[cur];
                    }
                    return res;
                }, window.__san_devtool__.data);
                if (prev && prev.id) {
                    cNode.prevId = prev.id;
                }
            }
            try {
                JSON.stringify(cNode);
                inspectorSender.send('renderer:master', {
                    type: 'rendererWv.sanMessage',
                    params: {
                        data: {
                            message,
                            cNode,
                            parentId
                        }
                    }
                });
            } catch (e) {
                console.error(e);
            }
        },
        conditions: [
            {
                event: 'inspector-ready',
                target: window,
                listeners: [
                    'onRootReady',
                    'onAfterGenerateData',
                    () => window.__san_devtool__.retrieveData()
                ]
            }
        ],
        onRootReady: cNode => {
            try {
                JSON.stringify(cNode);
                inspectorSender.send('renderer:master', {
                    type: 'rendererWv.sanMessage',
                    params: {
                        data: {
                            message: 'retrieveRoot',
                            treeData: [cNode]
                        }
                    }
                });
            } catch (e) {
                console.error(e);
            }
        },
        onRetrieveData: cNode => {
            if (Array.isArray(cNode) && cNode.length) {
                try {
                    JSON.stringify(cNode);
                    inspectorSender.send('renderer:master', {
                        type: 'rendererWv.sanMessage',
                        params: {
                            data: {
                                message: 'retrieveRoot',
                                treeData: cNode
                            }
                        }
                    });
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
}

function init() {
    registerEvent();
    initDomEvent();
    initScheme();
    initSwan();
    initDevtools();
    err();
}

init();

function initScheme() {
    // ios scheme拦截
    register('webkit.messageHandlers.BBAMNPJSBridge.postMessage', scheme => {
        return schemeParser(scheme);
    });
    // android scheme拦截
    register('androidJsBridge.dispatch', scheme => {
        return schemeParser(scheme);
    });
    // android scheme拦截方法二
    register('prompt', scheme => {
        let promptParser;
        try {
            promptParser = JSON.parse(scheme.replace(/^BdboxApp:/, '')).args[0];
        }
        catch (e) {
            promptParser = '';
        }
        return schemeParser(promptParser);
    });

    function register(name, fn, root) {
        root = root || window;
        name = name.split('.');
        while (name.length !== 1) {
            let n = name.shift();
            root[n] = root[n] || {};
            root = root[n];
        }
        root[name.shift()] = fn;
    }
    function stringToCamelCase(str) {
        let reg = /\/(\w)/g;
        return str.replace(reg, function ($0, $1) {
            return $1.toUpperCase();
        });
    }
    function schemeParser(scheme) {
        let parserResult = {};
        let {protocol, hostname, pathname, query} = url.parse(scheme, true);
        let [res, schemeName, action] = pathname.match(/\/([^/]*)\/(.*)/);
        // 如果遇到多级scheme，则action需转成驼峰形式。
        if (/\//.test(action)) {
            action = stringToCamelCase(action);
        }
        // todo 需要用多级
        if (!/v\d+/.exec(hostname) || !schemeName || !action) {
            // todo 测试下日志是否正常
            log.error('错误的scheme', scheme);
        }
        parserResult = {
            boxType: protocol,
            ver: hostname,
            schemeName,
            action,
            query
        };

        if (action === 'openInput') {
            showNativeInput(ipcRenderer, parserResult);
            return;
        }

        // 逻辑暂时不变
        if (action.indexOf('Sync') !== -1) {
            return ipcRenderer.sendSync('webview:syncEvent', {
                type: 'scheme.' + action,
                params: [parserResult]
            });
        }
        else {
            ipcRenderer.send('webview:event', {
                type: 'scheme.' + action,
                params: [parserResult]
            });
        }
    }
}

function initSwan() {
    // 待迁移的swan api 列表
    // 迁移过来的所以api都在这里记录,迁移成scheme方式之后,从这里移除
    let toList = [
        'demo',
        'setStorage',
        'getStorage',
        'getStorageInfo',
        'removeStorage',
        'clearStorage',
        'setStorageSync',
        'getStorageSync',
        'getStorageInfoSync',
        'removeStorageSync',
        'clearStorageSync',
        'getBDUSS',
        // network
        'request',
        // pulldown
        'startPullDownRefresh',
        'stopPullDownRefresh',
        // authorize
        'login',
        'checkSession',
        'authorize',
        'getUserInfo',
        'openSetting',
        'getSetting',
        'getSwanId',
        // tab bar API
        'setTabBarBadge',
        'removeTabBarBadge',
        'showTabBarRedDot',
        'hideTabBarRedDot',
        'setTabBarStyle',
        'setTabBarItem',
        'showTabBar',
        'hideTabBar',
        // title API
        'setNavigationBarTitle',
        'showNavigationBarLoading',
        'hideNavigationBarLoading',
        'setNavigationBarColor',
        // toast
        'showToast',
        'hideToast',
        'showLoading',
        'hideLoading',
        'showModal',
        'showActionSheet',
        'openSetting',
        // 系统信息
        'getSystemInfo',
        'getSystemInfoSync',
        'canIUse',
        'makePhoneCall',
        'vibrateShort',
        // 剪贴板
        'setClipboardData',
        'getClipboardData',
        // 网络状态
        'getNetworkType',
        'onNetworkStatusChange',
        // 绘图
        'createCanvasContext',
        'drawDelay',
        // file
        'saveFile',
        'getSavedFileList',
        'getSavedFileInfo',
        'removeSavedFile',
        'openDocument',
        'downloadFile',
        'uploadFile',
        // image
        'chooseImage',
        'previewImage',
        'getImageInfo',
        'saveImageToPhotosAlbum',
        // media
        // 'createInnerAudioContext',
        'createVideoContext',
        'createLivePlayerContext',
        'scanCode',
        // location
        'getLocation',
        'chooseLocation',
        'openLocation',
        // video
        'videoEvent',
        'videoError'
    ];

    window.swan = {};
    toList.forEach(action => {
        window.swan[action] = function (...args) {
            return getHandler(action, args);
        };
    });

    // proxy的读取handler,同步属性的处理,还是要单独判断
    function getHandler(api, args) {
        let argList = [];
        for (let i = 0; i < args.length; i++) {
            argList.push(args[i]);
        }

        // 需要按照同步api调用的数组list
        let syncList = [];

        if (api === 'request') {
            return request(argList[0]);
        }

        if (api === 'createCanvasContext') {
            return new CanvasContext(argList[0], ipcRenderer);
        }

        if (api === 'createCameraContext') {
            return {
                takePhoto() {
                },
                startRecord() {
                },
                stopRecord() {
                }
            };
        }
        if (api === 'createInnerAudioContext') {
            console.info('开发者工具暂时不支持 createInnerAudioContext 方法,请在百度APP中调试此功能');
            return {};
        }
        if (api === 'createMapContext' || api === 'openLocation'
            || api === 'getLocation' || api === 'chooseLocation') {
            return location(api, argList[0] || {});
        }
        if (api === 'createVideoContext') {
            return new VideoContext(argList[0], ipcRenderer);
        }
        if (api === 'createLivePlayerContext') {
            console.info('开发者工具暂时不支持 createLivePlayerContext 方法,请在百度APP中调试此功能');
            return {
                play: ()=> {
                },
                stop: ()=> {
                },
                mute: ()=> {
                },
                pause: ()=> {
                },
                resume: ()=> {
                },
                requestFullScreen: ()=> {
                },
                exitFullScreen: ()=> {
                }
            };
        }

        // 同步api先使用sync做判断了。
        if (api.indexOf('Sync') !== -1 || syncList.indexOf(api) >= 0) {
            // 同步api目前不需要处理callback
            return ipcRenderer.sendSync('webview:syncEvent', {
                type: 'swan.' + api,
                params: argList
            });
        }

        // 目前应该都是一个参数,有其他情况再扩展
        let arg = argList[0];
        // 特殊的有自己回调的情况
        switch (api) {
            case 'onNetworkStatusChange':
                arg = setSingleCb(api, arg);
                break;
            default:
                arg = Object.assign(arg || {}, setCb(api, arg));
        }
        argList[0] = arg;

        ipcRenderer.send('webview:event', {
            type: 'swan.' + api,
            api: api,
            params: argList,
            args: argList
        });
    }


    // callback相关的方法
    let id = 0;

    function getId() {
        return id++;
    }

    function setCb(api, obj = {}) {
        let cb = {};
        if (typeof obj.success === 'function') {
            cb.success = api + '_success_' + getId();
            window[cb.success] = obj.success;
        }
        if (typeof obj.fail === 'function') {
            cb.fail = api + '_fail_' + getId();
            window[cb.fail] = obj.fail;
        }
        if (typeof obj.complete === 'function') {
            cb.complete = api + '_complete_' + getId();
            window[cb.complete] = obj.complete;
        }
        return cb;
    }

    function setSingleCb(api, callback) {
        let cb = '';
        if (typeof callback === 'function') {
            cb = api + '_cb_' + getId();
            window[cb] = callback;
        }
        return cb;
    }
}

function initDomEvent() {
    window.onload = () => {
        if (document.body.scrollTop === 0) {
            isReachTop = true;
        }
    };

    document.addEventListener('scroll', e => {
        if (document.body.scrollTop === 0) {
            ipcRenderer.send('renderer:master', {
                type: 'rendererWv.updateSlaveStack',
                params: {
                    wvId: ret.wvId,
                    info: {reachTop: true}
                }
            });
            isReachTop = true;
        } else {
            if (isReachTop) {
                ipcRenderer.send('renderer:master', {
                    type: 'rendererWv.updateSlaveStack',
                    params: {
                        wvId: ret.wvId,
                        info: {reachTop: false}
                    }
                });
            }
            isReachTop = false;
        }
    });
}

function registerEvent() {
    // 发送webview创建信号
    ret = ipcRenderer.sendSync('webview:syncEvent', {
        type: 'webview.created'
    });
    // console.log(ret);
    /*ret = {
     wvId,
     webContentsId,
     masterWebContentsId,
     type,
     appConfig,
     appInfo, // 不返回了
     };*/
    if (ret.type === 'master') {
        // 设置master的注入appconfig
        Object.defineProperty(window, 'appConfig', {
            get: () => JSON.stringify(ret.appConfig)
        });
    } else {
        initSlaveSanHook();
        ipcRenderer.on('init-slave-san-hook', (e, data) => {
            console.log('init-slave-san-hook', data);
            inspectorSender.toolsInfo = data;
            inspectorSender.clear();
            initAppData(data);
        });
    }


    // 接收js callback
    // webview.executeJavaScript 没什么必要,一样通过ipc的实现
    ipcRenderer.on('webview:executeScript', (e, data) => {
        // console.log('webview:executeScript', data);
        /* eslint-disable */
        window.eval(data);
        /* eslint-enable */
    });
}

function err() {
    // slave 的错误转发和接收
    if (ret.type === 'slave') {
        // 错误捕获
        window.onerror = (errorMessage, scriptURI, lineNumber, columnNumber, errorObj) => {
            let message;
            if (errorObj) {
                message = errorObj.stack || errorObj.message;
            }
            if (!message) {
                message = errorMessage + ' in ' + scriptURI;
            }
            ipcRenderer.sendTo(ret.masterWebContentsId, 'webview:errCatch', message);
            log.error('error in slave', message);
        };
    }
    else {
        ipcRenderer.on('webview:errCatch', (e, data) => {
            console.group('slave error');
            console.error(data);
            console.groupEnd();
        });
    }
}

function initDevtools() {

    let pageData = {};
    // document.addEventListener('message', e => {
    //     if (e.message) {
    //         console.log('webview message', e.message)
    //         let message = null;
    //         try {
    //             if (typeof e.message === 'object') {
    //                 message = e.message;
    //             }
    //             else {
    //                 message = JSON.parse(decodeURIComponent(e.message));
    //             }
    //         }
    //         catch (event) {
    //             console.log(event);
    //         }
    //         if (message) {
    //             let update;
    //             switch (message.type) {
    //                 case 'setData':
    //                     Object.assign(pageData, message.setObject);
    //                     update = 1;
    //                     break;
    //                 case 'initData':
    //                     pageData = message.value;
    //                     update = 1;
    //                     break;
    //                 default:
    //             }
    //             update && ipcRenderer.send('devtools:sendToDev', {
    //                 action: 'appdata',
    //                 wvId: ret.wvId,
    //                 data: {
    //                     action: 'update',
    //                     sanDevtool: pageData
    //                 }
    //             });
    //         }
    //     }
    // }, false);

    // for devtools
    ipcRenderer.on('webview:getSanDevtool', (e, data) => {
        ipcRenderer.send('devtools:sendToDev', Object.assign(data, {
            'sanDevtool': window['__san_devtool__'].data
        }));
    });
    ipcRenderer.on('webview:getsandata', (e, data) => {
        ipcRenderer.send('devtools:sendToDev', Object.assign(data, {
            action: 'getappdata',
            wvId: ret.wvId,
            data: {
                action: 'get',
                sanDevtool: pageData
            }
        }));
    });

}
