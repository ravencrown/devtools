/**
 * @file master actions for master web runtime
 * @author lijunxiong@baidu.com
 */

const audio = require('./audio');
const backgroundAudioManager = require('./background_audio_manager');
const recorder = require('./recorder');
const canvas = require('./canvas');

const {audioOpen, audioPause, audioPlay, audioSeek, audioStop, audioUpdate} = audio.interceptor;
const {
    backgroundAudioOpen,
    backgroundAudioUpdate,
    backgroundAudioPlay,
    backgroundAudioPause,
    backgroundAudioStop,
    backgroundAudioSeek,
    backgroundAudioGetParamsSync
} = backgroundAudioManager.interceptor;
const {recorderStart, recorderPause, recorderResume, recorderStop} = recorder.interceptor;
const canvasMeasureTextSync = canvas.interceptor.canvasMeasureTextSync;

exports.interceptor = {
    audioOpen, audioPause, audioPlay, audioSeek, audioStop, audioUpdate,
    backgroundAudioOpen, backgroundAudioUpdate, backgroundAudioPlay,
    backgroundAudioPause, backgroundAudioStop, backgroundAudioSeek, backgroundAudioGetParamsSync,
    recorderStart, recorderPause, recorderResume, recorderStop, canvasMeasureTextSync
};