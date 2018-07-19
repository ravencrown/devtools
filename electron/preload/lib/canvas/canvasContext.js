/**
 * @file canvasContext
 * @description canvas代理对象
 * @author yanbin01@baidu.com
 * 2018/02/28
 */

let Gradient = require('./gradient');

class canvasContext {

    /**
     * 构造函数
     *
     * @param {string} canvasId canvas dom id
     * @param {Object} ipcRenderer ipcRenderer
     */
    constructor(canvasId, ipcRenderer) {
        this.canvasId = canvasId || 'myCanvas';
        this.ipcRenderer = ipcRenderer;
        this.lgList = {};
        this.cgList = {};

        let args = [{canvasId}];
        this._send('setSize', args);
    }

    _send(api, argument) {
        let args = [{}];
        args[0].canvasId = this.canvasId;
        args[0].arg = argument;
        this.ipcRenderer.send('webview:event', {
            type: 'swan.' + api,
            api: api,
            params: args,
            args: args
        });
        return true;
    }

    _getLgId() {
        this._lgId = this._lgId || 0;
        return this.canvasId + '_' + (++this._lgId);
    }

    setFillStyle(...args) {
        if (typeof args[0] === 'object') {
            // 直接set一个Gradient
            this._send('setFillStyle',
                args[0]
            );
        }
        else if (typeof args[0] === 'string') {
            // 设置一个颜色字符串
            this._send('setFillStyle', args[0]);
        }
    }

    setStrokeStyle(...args) {
        if (typeof args[0] === 'object') {
            // 直接set一个Gradient
            this._send('setStrokeStyle',
                args[0]
            );
        }
        else if (typeof args[0] === 'string') {
            // 设置一个颜色字符串
            this._send('setStrokeStyle', args[0]);
        }
    }

    setStrokeRect(...args) {
        this._send('setStrokeRect', args);
    }

    fillRect(...args) {
        this._send('fillRect', args);
    }

    /**
     * 设置阴影样式
     *
     * @param {...Array} args 用户传参数组
     */
    setShadow(...args) {
        this._send('setShadow', {
            offsetX: args[0] || 0,
            offsetY: args[1] || 0,
            blur: args[2] || 0,
            color: args[3] || 'black'
        });
    }

    /**
     * 创建一个线性的渐变颜色
     *
     * @param {...Array} args 用户传参数组
     * @return {Object} LinearGradient对象
     */
    createLinearGradient(...args) {
        let id = this._getLgId();
        this.lgList.id = new Gradient(id, this.canvasId, args, this.ipcRenderer);
        this._send('createLinearGradient', {
            plId: id,
            x0: args[0],
            y0: args[1],
            x1: args[2],
            y1: args[3]
        });
        return this.lgList.id;
    }

    /**
     * 创建一个圆形的渐变颜色
     *
     * @param {...Array} args 用户传参数组
     * @return {Object} CircularGradient对象
     */
    createCircularGradient(...args) {
        let id = this._getLgId();
        this.cgList.id = new Gradient(id, this.canvasId, args, this.ipcRenderer);
        this._send('createCircularGradient', {
            plId: id,
            x: args[0],
            y: args[1],
            r: args[2]
        });
        return this.cgList.id;
    }

    /**
     * 设置线条的宽度。
     *
     * @param {...Array} args 用户传参数组
     */
    setLineWidth(...args) {
        this._send('setLineWidth', {
            lineWidth: args[0]
        });
    }

    /**
     * 开始创建一个路径，需要调用fill或者stroke才会使用路径进行填充或描边。
     *
     * @param {...Array} args 用户传参数组
     */
    beginPath() {
        this._send('beginPath', {});
    }

    /**
     * 关闭一个路径
     *
     * @param {...Array} args 用户传参数组
     */
    closePath() {
        this._send('closePath', {});
    }

    /**
     * 增加一个新点，然后创建一条从上次指定点到目标点的线
     *
     * @param {...Array} args 用户传参数组
     */
    lineTo(...args) {
        this._send('lineTo', {
            x: args[0],
            y: args[1]
        });
    }

    /**
     * 把路径移动到画布中的指定点，不创建线条
     *
     * @param {...Array} args 用户传参数组
     */
    moveTo(...args) {
        this._send('moveTo', {
            x: args[0],
            y: args[1]
        });
    }

    /**
     * 画出当前路径的边框。默认颜色色为黑色
     *
     * @param {...Array} args 用户传参数组
     */
    stroke() {
        this._send('stroke', {});
    }

    /**
     * 设置线条的端点样式
     *
     * @param {...Array} args 用户传参数组
     */
    setLineCap(...args) {
        this._send('setLineCap', {
            lineCap: args[0]
        });
    }

    /**
     * 设置线条的交点样式
     *
     * @param {...Array} args 用户传参数组
     */
    setLineJoin(...args) {
        this._send('setLineJoin', {
            lineJoin: args[0]
        });
    }

    /**
     * 设置线条的宽度
     *
     * @param {...Array} args 用户传参数组
     */
    setLineDash(...args) {
        this._send('setLineDash', {
            pattern: JSON.stringify(args[0]),
            offset: args[1]
        });
    }

    /**
     * 设置最大斜接长度
     *
     * @param {...Array} args 用户传参数组
     */
    setMiterLimit(...args) {
        this._send('setMiterLimit', {
            miterLimit: args[0]
        });
    }

    /**
     * 创建一个矩形
     *
     * @param {...Array} args 用户传参数组
     */
    rect(...args) {
        this._send('rect', {
            x: args[0],
            y: args[1],
            width: args[2],
            height: args[3]
        });
    }

    /**
     * 对当前路径中的内容进行填充。默认的填充色为黑色。
     *
     */
    fill() {
        this._send('fill', {});
    }

    /**
     * 画一个矩形(非填充)。
     *
     *
     * @param {...Array} args 用户传参数组
     */
    strokeRect(...args) {
        this._send('strokeRect', {
            x: args[0],
            y: args[1],
            width: args[2],
            height: args[3]
        });
    }

    /**
     * 清除画布上在该矩形区域内的内容
     *
     * @param {...Array} args 用户传参数组
     */
    clearRect(...args) {
        this._send('clearRect', {
            x: args[0],
            y: args[1],
            width: args[2],
            height: args[3]
        });
    }

    /**
     * 画一条弧线
     *
     * @param {...Array} args 用户传参数组
     */
    arc(...args) {
        this._send('arc', {
            x: args[0],
            y: args[1],
            r: args[2],
            sAngle: args[3],
            eAngle: args[4],
            counterclockwise: args[5]
        });
    }

    /**
     * 创建三次方贝塞尔曲线路径
     *
     * @param {...Array} args 用户传参数组
     */
    bezierCurveTo(...args) {
        this._send('bezierCurveTo', {
            cp1x: args[0],
            cp1y: args[1],
            cp2x: args[2],
            cp2y: args[3],
            x: args[4],
            y: args[5]
        });
    }

    /**
     * 创建二次贝塞尔曲线路径
     *
     * @param {...Array} args 用户传参数组
     */
    quadraticCurveTo(...args) {
        this._send('quadraticCurveTo', {
            cp1x: args[0],
            cp1y: args[1],
            x: args[2],
            y: args[3]
        });
    }

    setFontSize(...args) {
        this._send('setFontSize', {
            fontSize: args[0]
        });
    }

    /**
     * 在画布上绘制被填充的文本
     *
     * @param {...Array} args 用户传参数组
     */
    fillText(...args) {
        this._send('fillText', {
            text: args[0],
            x: args[1],
            y: args[2]
        });
    }

    /**
     * 用于设置文字的对齐
     *
     * @param {...Array} args 用户传参数组
     */
    setTextAlign(...args) {
        this._send('setTextAlign', {
            align: args[0]
        });
    }

    /**
     * 用于设置文字的水平对齐
     *
     * @param {...Array} args 用户传参数组
     */
    setTextBaseline(...args) {
        this._send('setTextBaseline', {
            textBaseline: args[0]
        });
    }

    /**
     * 在调用scale方法后，之后创建的路径其横纵坐标会被缩放。多次调用scale，倍数会相乘
     *
     * @param {...Array} args 用户传参数组
     */
    scale(...args) {
        this._send('scale', {
            scalewidth: args[0],
            scaleheight: args[1]
        });
    }

    /**
     * 以原点为中心，原点可以用 translate方法修改。顺时针旋转当前坐标轴。多次调用rotate，旋转的角度会叠加
     *
     * @param {...Array} args 用户传参数组
     */
    rotate(...args) {
        this._send('rotate', {
            rotate: args[0]
        });
    }

    /**
     * 对当前坐标系的原点(0, 0)进行变换，默认的坐标系原点为页面左上角
     *
     * @param {...Array} args 用户传参数组
     */
    translate(...args) {
        this._send('translate', {
            x: args[0],
            y: args[1]
        });
    }

    /**
     * 从原始画布中剪切任意形状和尺寸
     *
     */
    clip() {
        this._send('clip', {});
    }

    /**
     * 绘制图像到画布
     *
     * @param {...Array} args 用户传参数组
     */
    drawImage(...args) {
        this._send('drawImage', {
            imageResource: args[0],
            dx: args[1],
            dy: args[2],
            dWidth: args[3],
            dHeight: args[4],
            sx: args[5],
            sy: args[6],
            sWidth: args[7],
            sHeight: args[8]
        });
    }

    /**
     * 设置全局画笔透明度
     *
     * @param {...Array} args 用户传参数组
     */
    setGlobalAlpha(...args) {
        this._send('setGlobalAlpha', {
            alpha: args[0]
        });
    }

    save() {
        this._send('save', {});
    }

    restore() {
        this._send('restore', {});
    }

    draw(...args) {
        this._send('draw', {
            reserve: args[0] || false,
            cb: args[1] ? `(${args[1]})()` : null
        });
    }
}

module.exports = canvasContext;