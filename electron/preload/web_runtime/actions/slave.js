/**
 * @file slave actions for master web runtime
 * @author lijunxiong@baidu.com
 */

const video = require('./video');
const camera = require('./camera');
const coverview = require('./coverview');
const coverimage = require('./coverimage');
const animationView = require('./animation_view');
const canvas = require('./canvas');

const {videoFullScreen, videoPause, videoPlay, videoSeek, videoSendDanmu} = video.handler;
const {videoOpen, videoUpdate} = video.interceptor;
const {coverviewInsert, coverviewUpdate, coverviewRemove} = coverview.interceptor;
const {coverimageInsert, coverimageUpdate, coverimageRemove} = coverimage.interceptor;
const {cameraTakePhoto, cameraStartRecord, cameraStopRecord} = camera.handler;
const {cameraInsert, cameraUpdate} = camera.interceptor;
const {animViewInsert, animViewUpdate, animViewRemove} = animationView.interceptor;
const {canvasDrawCanvas, canvasMeasureTextSync} = canvas.handler;
const {canvasInsert, canvasUpdate, canvasRemove} = canvas.interceptor;

exports.handler = {
    videoSeek, videoPlay, videoPause, videoFullScreen, videoSendDanmu,
    cameraTakePhoto, cameraStartRecord, cameraStopRecord,
    canvasDrawCanvas, canvasMeasureTextSync
};

exports.interceptor = {
    videoOpen, videoUpdate,
    coverviewInsert, coverviewUpdate, coverviewRemove,
    coverimageInsert, coverimageUpdate, coverimageRemove,
    animViewInsert, animViewUpdate, animViewRemove,
    cameraInsert, cameraUpdate,
    canvasInsert, canvasUpdate, canvasRemove
};
