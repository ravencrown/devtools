/**
 * @file swan/index
 * @desc 注入slave的网络相关端能力
 * @author zhaoyihan
 * 18/4/11
 */

const querystring = require('querystring');
require('../third_party/fetch');

// 防止开发者覆盖window.fetch
const __fetch__ = window.fetch;

const findKeyOf = headers => key => {
    const filterRes = Object.keys(headers).filter(
        k => k.toLowerCase().trim() === key
    ).map(k => headers[k]);
    return filterRes.length ? filterRes[0] : '';
};

const formatData = function (data) {
    if (typeof data === 'string') {
        return data;
    }
    else if (typeof data === 'object') {
        return querystring.stringify(data);
    }
    throw 'The data\'s type should be either string or object.';
};

const parseSetCookie = res => {
    res.header['Set-Cookie'] = res.header['x-devtools-response-set-cookie'];
    delete res.header['x-devtools-response-set-cookie'];
    return res;
};

const parseHeader = res => {
    const keys = res.header.keys();
    for (let key of keys) {
        res.header[key] = res.header.get(key);
    }
    return res;
};

const checkStatusCode = res => {
    if (res.statusCode >= 400) {
        throw res;
    }
    else {
        return res;
    }
};

const parseDataTypeOf = dataType => ([data, extra]) => {
    if (dataType === 'json') {
        try {
            data = JSON.parse(data);
        }
        catch (e) {
            data = '' + data;
        }
    }
    return Object.assign({data}, extra);
};

module.exports = {
    request({
        url,
        data = {},
        header = {},
        method = 'GET',
        dataType = 'json',
        success = x => x,
        fail = x => x,
        complete = x => x
    }) {
        let sendData = data;
        let sendUrl = url;
        try {
            if (!url) {
                throw 'missing parameter: url.';
            }
            if (!/https?:\/\//.test(url)) {
                throw 'please add the protocol of the url(http:// or https://).';
            }
            header = Object.assign(header, {'x-devTools-request-from': 'api'});
            const getHeaderByKey = findKeyOf(header);
            const cookie = getHeaderByKey('cookie');
            if (cookie) {
                header['x-devtools-request-cookie'] = cookie;
            }
            if (method === 'GET') {
                if (Object.keys(data).length) {
                    sendUrl += sendUrl.match(/\?/) ? '&' : '?';
                    sendUrl += formatData(data);
                }
                sendData = null;
            }
            else {
                let contentType = getHeaderByKey('content-type').toLowerCase().trim();
                if (contentType === '') {
                    header['Content-Type'] = 'application/json';
                    contentType = 'application/json';
                }
                if (contentType === 'application/json') {
                    sendData = JSON.stringify(data);
                }
                else if (contentType === 'application/x-www-form-urlencoded') {
                    sendData = formatData(data);
                }
                else {
                    sendData = data;
                }
            }
        }
        catch (e) {
            fail({errMsg: e});
            complete();
            return;
        }
        __fetch__(sendUrl, {
            method,
            body: sendData,
            headers: header
        })
            .then(res => Promise.all([
                res.text(),
                {statusCode: res.status, header: res.headers}
            ]))
            .then(parseDataTypeOf(dataType))
            .then(parseHeader)
            .then(checkStatusCode)
            .then(parseSetCookie)
            .then(success, reason => fail({errMsg: reason}))
            .then(complete);
    }
};
