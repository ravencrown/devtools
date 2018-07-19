/**
 * @file canvas
 * @author bailonggang
 * 2018/6/27
 */

exports.interceptor = {
    canvasInsert: (query, cb) => {
        window.swanWebRuntime.api.insertCanvas(query.params);
        cb(query.callback);
    },
    canvasUpdate: (query, cb) => {
        window.swanWebRuntime.api.updateCanvas(query.params);
        cb(query.callback);
    },
    canvasRemove: (query, cb) => {
        window.swanWebRuntime.api.removeCanvas(query.params);
        cb(query.callback);
    },
    canvasMeasureTextSync: (query, cb) => {
        const {font, text} = query.params;
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.font = font;
        const width = ctx.measureText(text).width;
        cb(query.callback);

        return JSON.stringify({
            status: '0',
            message: 'success',
            data: {width}
        });
    }
};

exports.handler = {
    canvasDrawCanvas: (query, cb) => {
        const actions = JSON.parse(query.params.actions);
        const ctx = window.swanWebRuntime.api.createCanvasContext(query.params.canvasId);
        actions.forEach(action => {
            let func = ctx[action.method];
            if (typeof func === 'function') {
                func(...transParams(action));
            } else if (action.method === 'font') {
                ctx.font = action.data[0] || ctx.font;
            } else {
                console.log(action.method, 'not exist!');
            }
        });
        ctx.draw();
        cb(query.callback);
    },
    canvasMeasureTextSync: query => {
        const {font, canvasId} = query.params;
        const ctx = window.swanWebRuntime.api.createCanvasContext(canvasId);
        if (font && ctx) {
            ctx.font = font;
        }
    }
};

function transParams(action) {
    switch (action.method) {
        case 'setFillStyle':
        case 'setStrokeStyle':
        case 'setShadow':
            return transColor(action.data[1]);
    }

    return action.data;
}

function transColor(colorArr) {
    if (colorArr.length > 2) {
        let r = colorArr[0].toString(16);
        let g = colorArr[1].toString(16);
        let b = colorArr[2].toString(16);
        r = r.length === 1 ? '0' + r : r;
        g = g.length === 1 ? '0' + g : g;
        b = b.length === 1 ? '0' + b : b;
        return [`#${r}${g}${b}`];
    }

    return ['#000'];
}