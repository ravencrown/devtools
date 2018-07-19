/**
 * @file 注入js到login.html中
 * @author zhaoyihan
 * 18/1/11
 */

const {ipcRenderer} = require('electron');

window.sendRenderSuc = function () {
    ipcRenderer.send('renderer:master', {type: 'user.loginSuccess', params: {}, callback: 'loginSuccess'});
};

window.sendRenderLoginFail = function () {
    ipcRenderer.send('renderer:master', {type: 'user.loginFail', params: {}, callback: 'loginFail'});
};