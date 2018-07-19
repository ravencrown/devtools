/**
 * Swan IDE GUI
 * Copyright 2018 Baidu Inc. All rights reserved.
 *
 * @file Recorder manager class
 * @author luyuan02
 */


const Recorder = require('opus-recorder');


const KB = 1024;
const WAV = 'audio/wav';
const MAX_DURATION = 600000;


/**
 * A RecorderManager represents a recorder to record the voice from microphone
 * and playback, save as or encode the media source using HTML5 mediaDevices and
 * WebAssembly.
 *
 * @class
 */
class RecorderManager {

    /**
     * RecorderManager consturctor
     */
    constructor() {
        if (!Recorder.isRecordingSupported()) {
            const errMsg = 'Recorder not supported.';
            this._onError.forEach(cb => cb({errMsg}));
            return;
        }

        this._options = {};
        // All events
        this._events = ['Start', 'Stop', 'Pause', 'Resume', 'FrameRecorded',
            'Error'];
        this._listen();
        this._clearStreamPages();
        // The first two as head.
        this._headSize = 2;
    }

    /**
     * Passthrough of Recorder's state property.
     *
     * @return {string}
     */
    get state() {
        return this._recorder
            ? this._recorder.state
            : RecorderManager.STATE.INACTIVE;
    }

    /**
     * Determine if listeners execute only once, cleared after onStop.
     *
     * @return {boolean}
     */
    get onceListener() {
        return !!this._onceListener;
    }

    /**
     * Set if listeners execute only once, cleared after onStop.
     *
     * @param {boolean} once    Executing once.
     */
    set onceListener(once) {
        this._onceListener = !!once;
    }

    /**
     * Set the path of encoder, can be a URL with http(s) or file protocol.
     *
     * @param {string} path     The specified encoder path.
     */
    setEncoderPath(path) {
        this._encoderPath = path;
    }

    /**
     * Start to record a new audio with options.
     *
     * @param {Object} options     The options.
     */
    start(options) {
        const defaultOptions = RecorderManager.defaultOptions;
        this._options = Object.assign({}, defaultOptions, options);
        this._options.numberOfChannels = this._options.numberOfChannels || 1;
        this._options.streamPages = this._options.frameSize > 0;
        this._options.duration = Math.min(this._options.duration, MAX_DURATION);
        this._createRecorder();
        this._initHandlers();
        this._recorder.start()
            .then(() => {
                if (this._options.duration > 0) {
                    setTimeout(() => this.stop(), this._options.duration);
                }
            })
            .catch(e => this._onError.forEach(cb => cb({errMsg: e.message})));
    }

    /**
     * Pause and can restart in future.
     */
    pause() {
        this._recorder.pause();
    }

    /**
     * Resume the paused record.
     */
    resume() {
        this._recorder.resume();
    }

    /**
     * Stop recording and generate the media URL.
     */
    stop() {
        this._recorder.stop();
    }

    /**
     * Create an inner Recorder(opus-recorder) instance with options.
     *
     * @inner
     */
    _createRecorder() {
        this._recorder = new Recorder({
            numberOfChannels: this._options.numberOfChannels,
            maxBuffersPerPage: 1,
            encoderBitRate: this._options.encoderBitRate,
            encoderSampleRate: this._options.sampleRate,
            streamPages: this._options.streamPages,
            encoderPath: this._encoderPath
        });
    }

    /**
     * Generate a blob URL with blob object created with specified typed-array.
     *
     * @inner
     *
     * @param {Object} typedArray     A media typed-array.
     * @return {string}
     */
    _getBlobURL(typedArray) {
        const dataBlob = new Blob([typedArray], {type: WAV});
        const url = URL.createObjectURL(dataBlob);
        return url;
    }

    /**
     * Append current typed-array to the page list and resize the length for
     * specified frame size.
     *
     * @inner
     *
     * @param {Object} typedArray     A media typed-array.
     */
    _pushStreamPage(typedArray) {
        if (!typedArray) {
            return;
        }
        this._streamPageList.push(typedArray);
        this._streamPageSize += typedArray.length;
    }

    /**
     * Group the page list.
     *
     * @inner
     * @return {Uint8Array}
     */
    _getGroupedStreamPages() {
        const grouped = new Uint8Array(this._streamPageSize);
        this._streamPageList.reduce((offset, page) => {
            grouped.set(page, offset);
            return offset + page.length;
        }, 0);
        return grouped;
    }

    /**
     * Clip the media typed-array body just leave the head.
     *
     * @inner
     */
    _clipHead() {
        this._streamPageList.splice(this._headSize);
        this._streamPageSize = this._streamPageList.reduce(
            (a, b) => a.length + b.length);
    }

    /**
     * Clear page list for the new record.
     *
     * @inner
     */
    _clearStreamPages() {
        this._streamPageList = [];
        this._streamPageSize = 0;
    }

    /**
     * Initialize the inner Recorder's handlers and binding the
     * RecorderManager's.
     *
     * @inner
     */
    _initHandlers() {
        this._recorder.onstart = () => this._onStart.forEach(cb => cb());
        this._recorder.onpause = () => this._onPause.forEach(cb => cb());
        this._recorder.onresume = () => this._onResume.forEach(cb => cb());

        this._recorder.onstop = () => {
            if (this._options.streamPages) {
                const frameBuffer = this._getGroupedStreamPages();
                // onstop will be triggered after the last ondataavailable.
                const isLastFrame = true;
                this._onFrameRecorded.forEach(
                    cb => cb({frameBuffer, isLastFrame}));
                this._clearStreamPages();
            }
            if (this._onceListener) {
                this._initListeners();
            }
        };

        this._recorder.ondataavailable = typedArray => {
            if (this._options.streamPages) {
                this._pushStreamPage(typedArray);
                // Head may take up some space.
                if (this._streamPageSize > (this._options.frameSize - 1) * KB) {
                    const frameBuffer = this._getGroupedStreamPages();
                    // Last frame will be triggered in onstop.
                    const isLastFrame = false;
                    this._onFrameRecorded.forEach(
                        cb => cb({frameBuffer, isLastFrame}));
                    // Keep head for next page.
                    this._clipHead();
                }
            } else {
                // onStop
                const tempFilePath = this._getBlobURL(typedArray);
                this._onStop.forEach(cb => cb({tempFilePath}));
            }
        };
    }

    /**
     * Push callback into each event queue.
     *
     * @inner
     */
    _listen() {
        this._initListeners();
        this._events.forEach(e => {
            this[`on${e}`] = callback => {
                if (typeof callback === 'function') {
                    this[`_on${e}`].push(callback);
                }
            };
        });
    }

    /**
     * Initialize all listeners.
     *
     * @inner
     */
    _initListeners() {
        const props = {};
        this._events.forEach(e => {
            props[`_on${e}`] = {
                value: []
            };
        });
        Object.defineProperties(this, props);
    }

}


// Enums

RecorderManager.FORMAT = {
    AAC: 'AAC',
    MP3: 'MP3'
};

RecorderManager.STATE = {
    INACTIVE: 'inactive',
    RECORDING: 'recording',
    PAUSED: 'paused'
};

RecorderManager.defaultOptions = {
    duration: 60000,
    sampleRate: 8000,
    numberOfChannels: 1,
    encodeBitRate: 16000,
    format: RecorderManager.FORMAT.AAC,
    frameSize: 0
};


module.exports = RecorderManager;

