/**
 * @file Gradient
 * @description linearGradient或CircularGradient代理对象
 * @author yanbin01@baidu.com
 * 2018/03/01
 */

class Gradient {

    constructor(id, canvasId, arg, ipcRenderer) {
        this.lgId = id;
        this.canvasId = canvasId;
        this.ipcRenderer = ipcRenderer;
    }

    /**
     * 发布消息
     *
     * @param {string} api 具体参数名
     * @param {Array} argument 用户传参
     * @return {boolean} 返回值
     */
    _send(api, argument) {
        let args = [{}];
        args[0].canvasId = this.canvasId;
        args[0].lgId = this.lgId;
        args[0].arg = argument;

        this.ipcRenderer.send('webview:event', {
            type: 'swan.' + api,
            api: api,
            params: args,
            args: args
        });

        return true;
    }

    /**
     * 定义一个从黑到白的渐变，作为矩形的填充样式
     *
     * @param {number} stop 表示渐变点在起点和终点中的位置
     * @param {Ojbect} color 渐变点的颜色
     */
    addColorStop(stop, color) {
        this._send('addColorStop', {stop, color});
    }

    getId() {
        return this.lgId;
    }
}


module.exports = Gradient;