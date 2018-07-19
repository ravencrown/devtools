/**
 * Swan IDE GUI
 * Copyright 2018 Baidu Inc. All rights reserved.
 *
 * @file Recorder manager class
 * @author
 */

window.createCameraContext = createCameraContext;

/**
 * 创建并返回 camera 上下文 cameraContext 对象
 *
 * @param {Object} instance 在自定义组件下，第一个参数传入组件实例this，以操作组件内 <camera/> 组件
 * @return {Object} 返回值
 */
function createCameraContext(instance) {
    // 兼容webkit内核浏览器
    const CompatibleURL = window.URL || window.webkitURL;
    let cameraStream = '';
    let cameraReady = false;
    let cameraErr = new Error();
    let $video = '';
    let videoBlob = [];
    let recorder = '';
    let readyCbList = [];
    let stopRecordSuccessCb = () => {};
    let timer = '';
    let timerOut = false;
    const cameraContext = {
        /**
         * 拍照，可指定质量，成功则返回图片
         *
         * @param {Object} params 用户传参
         */
        takePhoto(params) {
            if (cameraReady) {
                takePhoto(params);
            } else {
                readyCbList.push(takePhoto.bind(this, params));
            }
        },
        /**
         * 开始录像
         *
         * @param {Object} params 用户传参
         */
        startRecord(params) {
            if (cameraReady) {
                startRecord(params);
            } else {
                readyCbList.push(startRecord.bind(this, params));
            }
        },
        /**
         * 结束录像，成功则返回封面与视频
         *
         * @param {Object} params 用户传参
         */
        stopRecord(params) {
            if (cameraReady) {
                stopRecord(params);
            } else {
                readyCbList.push(stopRecord.bind(this, params));
            }
        }
    };
    initCamera();
    function initCamera() {
        if (navigator.mediaDevices.getUserMedia || navigator.getUserMedia
            || navigator.webkitGetUserMedia || navigator.mozGetUserMedia) {
            // 调用用户媒体设备，访问摄像头
            navigator.mediaDevices.getUserMedia({
                audio: false,
                // 优先使用前置摄像头（如果有的话）
                video: {facingMode: 'user'}
            }, function success(stream) {
                const ctx = instance || document;
                const $camera = ctx.querySelector('.swan-camera');
                $camera.textContent = '';
                $video = document.createElement('video');
                $video.style.width = '100%';
                $video.style.height = '100%';
                $camera.appendChild($video);
                // 将视频流设置为video元素的源
                $video.src = CompatibleURL.createObjectURL(stream);
                $video.addEventListener('loadedmetadata', function () {
                    cameraReady = true;
                    handleCb();
                });
                // 播放视频
                $video.play();
                cameraStream = stream;
            }, function error(error) {
                cameraErr = error;
                handleCb();
                console.log('访问用户媒体设备失败：', error.name, error.message);
            });
        } else {
            cameraErr = new Error('你的浏览器不支持访问用户媒体设备');
            console.log('你的浏览器不支持访问用户媒体设备');
        }
    }
    function handleCb() {
        readyCbList.forEach(cb => {
            cb();
        });
        readyCbList = [];
    }
    function takePhoto(params) {
        if (!cameraReady) {
            params.fail && params.fail(cameraErr);
            params.complete && params.complete();
            return;
        }
        let imgQuality = 0.8;
        const quality = params.quality || 'normal';
        switch (quality) {
            case 'high':
                imgQuality = 1;
                break;
            case 'low':
                imgQuality = 0.6;
                break;
            default:
                imgQuality = 0.8;
        }
        const tempImagePath = getCover($video, imgQuality);
        if (tempImagePath === 'data:,') {
            params.fail && params.fail(new Error('拍照失败'));
            params.complete && params.complete();
            return;
        }
        params.success && params.success({tempImagePath});
        params.complete && params.complete();
    }
    function getCover(video, imgQuality = 0.8) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const tempImagePath = canvas.toDataURL('image/jpeg', imgQuality);
        return tempImagePath;
    }
    function startRecord(params) {
        if (!cameraReady) {
            params.fail && params.fail(cameraErr);
            params.complete && params.complete();
            return;
        }
        videoBlob = [];
        let tempThumbPath = '';
        let options = {mimeType: 'video/webm;codecs=vp9'};
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.log(options.mimeType + ' is not Supported');
            options = {mimeType: 'video/webm;codecs=vp8'};
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.log(options.mimeType + ' is not Supported');
                options = {mimeType: 'video/webm'};
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    console.log(options.mimeType + ' is not Supported');
                    options = {mimeType: ''};
                }
            }
        }
        try {
            recorder = new MediaRecorder(cameraStream, options);
        } catch (e) {
            console.error('Exception while creating MediaRecorder: ' + e);
            params.fail && params.fail(e);
            params.complete && params.complete();
            return;
        }
        recorder.ondataavailable = function (event) {
            if (event.data && event.data.size > 0) {
                videoBlob.push(event.data);
            }
            // videoBlob = new Blob([evt.data], {type: evt.data.type});
        };
        recorder.onstop = function () {
            const superBuffer = new Blob(videoBlob, {'type': recorder.mimeType});
            const tempVideoPath = CompatibleURL.createObjectURL(superBuffer);
            const res = {tempVideoPath, tempThumbPath};
            stopRecordSuccessCb(res);
            stopRecordSuccessCb = () => {};
            if (timerOut) {
                params.timeoutCallback && params.timeoutCallback(res);
                timerOut = false;
            }
            params.success && params.success(res);
            params.complete && params.complete();
        };
        recorder.start();
        tempThumbPath = getCover($video);
        clearTimeout(timer);
        timer = setTimeout(() => {
            timerOut = true;
            recorder.stop();
        }, 30000);
    }
    function stopRecord(params) {
        if (!cameraReady || !recorder) {
            params.fail && params.fail(cameraErr);
            params.complete && params.complete();
            return;
        }
        params.success && (stopRecordSuccessCb = params.success);
        recorder.stop();
        params.complete && params.complete();
    }
    return cameraContext;
}

module.exports = {createCameraContext};
