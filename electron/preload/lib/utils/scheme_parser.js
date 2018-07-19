/**
 * @file 解析scheme相关
 * @author wanghongliang02 zhaoyihan
 * 18/6/14
 */


const url = require('url');
const log = require('electron-log-swan');

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

const schemeListenr = {};

schemeListenr.on = function (...args) {
    register(...args);
    return this;
};

const schemeParser = function (scheme) {
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
    return {
        boxType: protocol,
        ver: hostname,
        schemeName,
        action,
        query
    };
};

module.exports = {
    schemeListenr,
    schemeParser
};
