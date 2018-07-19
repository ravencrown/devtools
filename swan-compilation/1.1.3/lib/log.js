'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.processionObj = exports.finishObj = exports.recordObj = undefined;

var _util = require('./util');

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @file 简单的日志处理文件
 * @author zhuxin04
 */
_events2.default.EventEmitter.defaultMaxListeners = 0;
var logEmitter = new _events2.default();
var recordObj = exports.recordObj = {
    developer: {
        css: 0,
        html: 0,
        js: 0,
        swan: 0,
        json: 0,
        image: 0
    },
    frame: {}
};
var finishObj = exports.finishObj = {
    css: 0,
    swan: 0,
    image: 0,
    json: 0,
    js: 0,
    html: 0
};
var processionObj = exports.processionObj = {
    css: false,
    swan: false,
    image: false,
    json: false,
    js: false,
    html: false
};
var stepNum = 0;

logEmitter.on('record:css', function (num) {
    recordObj.developer.css += num;
});

logEmitter.on('record:swan', function (num) {
    recordObj.developer.swan += num;
});
logEmitter.on('record:image', function (num) {
    recordObj.developer.image += num;
});
logEmitter.on('record:json', function (num) {
    recordObj.developer.json += num;
});
logEmitter.on('record:js', function (num) {
    recordObj.developer.js += num;
});
logEmitter.on('record:html', function (num) {
    recordObj.developer.html += num;
});

logEmitter.on('finish:css', function () {
    var num = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

    finishObj.css += num;
    if (finishObj.css === recordObj.developer.css && !processionObj.css) {
        (0, _util.log)('==============Css文件编译完成==============');
        isEndCompilation(1, 'css');
    }
});
logEmitter.on('finish:swan', function () {
    var num = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

    finishObj.swan += num;
    if (finishObj.swan === recordObj.developer.swan && !processionObj.swan) {
        (0, _util.log)('==============Swan文件编译完成==============');
        isEndCompilation(1, 'swan');
    }
});
logEmitter.on('finish:image', function () {
    var num = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

    finishObj.image += num;
    if (finishObj.image === recordObj.developer.image && !processionObj.image) {
        (0, _util.log)('==============Image文件编译完成==============');
        isEndCompilation(1, 'image');
    }
});
logEmitter.on('finish:json', function () {
    var num = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

    finishObj.json += num;
    if (finishObj.json === recordObj.developer.json && !processionObj.json) {
        (0, _util.log)('==============JSON文件编译完成==============');
        isEndCompilation(1, 'json');
    }
});
logEmitter.on('finish:js', function () {
    var num = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

    finishObj.js += num;
    if (finishObj.js === recordObj.developer.js && !processionObj.js) {
        (0, _util.log)('==============JS文件编译完成==============');
        isEndCompilation(1, 'js');
    }
});
logEmitter.on('finish:html', function () {
    var num = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

    finishObj.html += num;
    if (finishObj.html === recordObj.developer.html && !processionObj.html) {
        (0, _util.log)('==============HTML文件编译完成==============');
        isEndCompilation(1, 'html');
    }
});
logEmitter.on('error', function (err) {
    (0, _util.log)(err, 'error');
});

function isEndCompilation(step, procession) {
    processionObj[procession] = true;
    stepNum += step;
    if (stepNum % 6 === 0) {
        (0, _util.log)('==========================\u7F16\u8BD1\u5B8C\u6210===============================' + Date.now());
        (0, _util.compilationProgress)('end');
    }
}

exports.default = logEmitter;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9sb2cuanMiXSwibmFtZXMiOlsiRXZlbnRzIiwiRXZlbnRFbWl0dGVyIiwiZGVmYXVsdE1heExpc3RlbmVycyIsImxvZ0VtaXR0ZXIiLCJyZWNvcmRPYmoiLCJkZXZlbG9wZXIiLCJjc3MiLCJodG1sIiwianMiLCJzd2FuIiwianNvbiIsImltYWdlIiwiZnJhbWUiLCJmaW5pc2hPYmoiLCJwcm9jZXNzaW9uT2JqIiwic3RlcE51bSIsIm9uIiwibnVtIiwiaXNFbmRDb21waWxhdGlvbiIsImVyciIsInN0ZXAiLCJwcm9jZXNzaW9uIiwiRGF0ZSIsIm5vdyJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUlBOztBQUNBOzs7Ozs7QUFMQTs7OztBQU1BQSxpQkFBT0MsWUFBUCxDQUFvQkMsbUJBQXBCLEdBQTBDLENBQTFDO0FBQ0EsSUFBTUMsYUFBYSxJQUFJSCxnQkFBSixFQUFuQjtBQUNPLElBQU1JLGdDQUFZO0FBQ3JCQyxlQUFXO0FBQ1BDLGFBQUssQ0FERTtBQUVQQyxjQUFNLENBRkM7QUFHUEMsWUFBSSxDQUhHO0FBSVBDLGNBQU0sQ0FKQztBQUtQQyxjQUFNLENBTEM7QUFNUEMsZUFBTztBQU5BLEtBRFU7QUFTckJDLFdBQU87QUFUYyxDQUFsQjtBQWFBLElBQU1DLGdDQUFZO0FBQ3JCUCxTQUFLLENBRGdCO0FBRXJCRyxVQUFNLENBRmU7QUFHckJFLFdBQU8sQ0FIYztBQUlyQkQsVUFBTSxDQUplO0FBS3JCRixRQUFJLENBTGlCO0FBTXJCRCxVQUFNO0FBTmUsQ0FBbEI7QUFRQSxJQUFNTyx3Q0FBZ0I7QUFDekJSLFNBQUssS0FEb0I7QUFFekJHLFVBQU0sS0FGbUI7QUFHekJFLFdBQU8sS0FIa0I7QUFJekJELFVBQU0sS0FKbUI7QUFLekJGLFFBQUksS0FMcUI7QUFNekJELFVBQU07QUFObUIsQ0FBdEI7QUFRUCxJQUFJUSxVQUFVLENBQWQ7O0FBRUFaLFdBQVdhLEVBQVgsQ0FBYyxZQUFkLEVBQTRCLGVBQU87QUFDL0JaLGNBQVVDLFNBQVYs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VixJQUFrQlUsR0FBbEI7QUFDQSxRQUFJSixVQUFVTixJQUFWLEtBQW1CSCxVQUFVQyxTQUFWLENBQW9CRSxJQUF2QyxJQUErQyxDQUFDTyxjQUFjUCxJQUFsRSxFQUF3RTtBQUNwRSx1QkFBSSx3Q0FBSjtBQUNBVyx5QkFBaUIsQ0FBakIsRUFBb0IsTUFBcEI7QUFDSDtBQUNKLENBTkQ7QUFPQWYsV0FBV2EsRUFBWCxDQUFjLE9BQWQsRUFBdUIsVUFBQ0csR0FBRCxFQUFTO0FBQzVCLG1CQUFJQSxHQUFKLEVBQVMsT0FBVDtBQUNILENBRkQ7O0FBSUEsU0FBU0QsZ0JBQVQsQ0FBMEJFLElBQTFCLEVBQWdDQyxVQUFoQyxFQUE0QztBQUN4Q1Asa0JBQWNPLFVBQWQsSUFBNEIsSUFBNUI7QUFDQU4sZUFBV0ssSUFBWDtBQUNBLFFBQUlMLFVBQVUsQ0FBVixLQUFnQixDQUFwQixFQUF1QjtBQUNuQiw2R0FBb0VPLEtBQUtDLEdBQUwsRUFBcEU7QUFDQSx1Q0FBb0IsS0FBcEI7QUFDSDtBQUNKOztrQkFFY3BCLFUiLCJmaWxlIjoibG9nLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZSDnroDljZXnmoTml6Xlv5flpITnkIbmlofku7ZcbiAqIEBhdXRob3Igemh1eGluMDRcbiAqL1xuaW1wb3J0IHtjb21waWxhdGlvblByb2dyZXNzLCBsb2d9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQgRXZlbnRzIGZyb20gJ2V2ZW50cyc7XG5FdmVudHMuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAwO1xuY29uc3QgbG9nRW1pdHRlciA9IG5ldyBFdmVudHMoKTtcbmV4cG9ydCBjb25zdCByZWNvcmRPYmogPSB7XG4gICAgZGV2ZWxvcGVyOiB7XG4gICAgICAgIGNzczogMCxcbiAgICAgICAgaHRtbDogMCxcbiAgICAgICAganM6IDAsXG4gICAgICAgIHN3YW46IDAsXG4gICAgICAgIGpzb246IDAsXG4gICAgICAgIGltYWdlOiAwXG4gICAgfSxcbiAgICBmcmFtZToge1xuXG4gICAgfVxufTtcbmV4cG9ydCBjb25zdCBmaW5pc2hPYmogPSB7XG4gICAgY3NzOiAwLFxuICAgIHN3YW46IDAsXG4gICAgaW1hZ2U6IDAsXG4gICAganNvbjogMCxcbiAgICBqczogMCxcbiAgICBodG1sOiAwXG59O1xuZXhwb3J0IGNvbnN0IHByb2Nlc3Npb25PYmogPSB7XG4gICAgY3NzOiBmYWxzZSxcbiAgICBzd2FuOiBmYWxzZSxcbiAgICBpbWFnZTogZmFsc2UsXG4gICAganNvbjogZmFsc2UsXG4gICAganM6IGZhbHNlLFxuICAgIGh0bWw6IGZhbHNlXG59O1xubGV0IHN0ZXBOdW0gPSAwO1xuXG5sb2dFbWl0dGVyLm9uKCdyZWNvcmQ6Y3NzJywgbnVtID0+IHtcbiAgICByZWNvcmRPYmouZGV2ZWxvcGVyLmNzcyArPSBudW07XG59KTtcblxubG9nRW1pdHRlci5vbigncmVjb3JkOnN3YW4nLCBudW0gPT4ge1xuICAgIHJlY29yZE9iai5kZXZlbG9wZXIuc3dhbiArPSBudW07XG59KTtcbmxvZ0VtaXR0ZXIub24oJ3JlY29yZDppbWFnZScsIG51bSA9PiB7XG4gICAgcmVjb3JkT2JqLmRldmVsb3Blci5pbWFnZSArPSBudW07XG59KTtcbmxvZ0VtaXR0ZXIub24oJ3JlY29yZDpqc29uJywgbnVtID0+IHtcbiAgICByZWNvcmRPYmouZGV2ZWxvcGVyLmpzb24gKz0gbnVtO1xufSk7XG5sb2dFbWl0dGVyLm9uKCdyZWNvcmQ6anMnLCBudW0gPT4ge1xuICAgIHJlY29yZE9iai5kZXZlbG9wZXIuanMgKz0gbnVtO1xufSk7XG5sb2dFbWl0dGVyLm9uKCdyZWNvcmQ6aHRtbCcsIG51bSA9PiB7XG4gICAgcmVjb3JkT2JqLmRldmVsb3Blci5odG1sICs9IG51bTtcbn0pO1xuXG5cbmxvZ0VtaXR0ZXIub24oJ2ZpbmlzaDpjc3MnLCAobnVtID0gMSkgPT4ge1xuICAgIGZpbmlzaE9iai5jc3MgKz0gbnVtO1xuICAgIGlmIChmaW5pc2hPYmouY3NzID09PSByZWNvcmRPYmouZGV2ZWxvcGVyLmNzcyAmJiAhcHJvY2Vzc2lvbk9iai5jc3MpIHtcbiAgICAgICAgbG9nKCc9PT09PT09PT09PT09PUNzc+aWh+S7tue8luivkeWujOaIkD09PT09PT09PT09PT09Jyk7XG4gICAgICAgIGlzRW5kQ29tcGlsYXRpb24oMSwgJ2NzcycpO1xuICAgIH1cbn0pO1xubG9nRW1pdHRlci5vbignZmluaXNoOnN3YW4nLCAobnVtID0gMSkgPT4ge1xuICAgIGZpbmlzaE9iai5zd2FuICs9IG51bTtcbiAgICBpZiAoZmluaXNoT2JqLnN3YW4gPT09IHJlY29yZE9iai5kZXZlbG9wZXIuc3dhbiAmJiAhcHJvY2Vzc2lvbk9iai5zd2FuKSB7XG4gICAgICAgIGxvZygnPT09PT09PT09PT09PT1Td2Fu5paH5Lu257yW6K+R5a6M5oiQPT09PT09PT09PT09PT0nKTtcbiAgICAgICAgaXNFbmRDb21waWxhdGlvbigxLCAnc3dhbicpO1xuICAgIH1cbn0pO1xubG9nRW1pdHRlci5vbignZmluaXNoOmltYWdlJywgKG51bSA9IDEpID0+IHtcbiAgICBmaW5pc2hPYmouaW1hZ2UgKz0gbnVtO1xuICAgIGlmIChmaW5pc2hPYmouaW1hZ2UgPT09IHJlY29yZE9iai5kZXZlbG9wZXIuaW1hZ2UgJiYgIXByb2Nlc3Npb25PYmouaW1hZ2UpIHtcbiAgICAgICAgbG9nKCc9PT09PT09PT09PT09PUltYWdl5paH5Lu257yW6K+R5a6M5oiQPT09PT09PT09PT09PT0nKTtcbiAgICAgICAgaXNFbmRDb21waWxhdGlvbigxLCAnaW1hZ2UnKTtcbiAgICB9XG59KTtcbmxvZ0VtaXR0ZXIub24oJ2ZpbmlzaDpqc29uJywgKG51bSA9IDEpID0+IHtcbiAgICBmaW5pc2hPYmouanNvbiArPSBudW07XG4gICAgaWYgKGZpbmlzaE9iai5qc29uID09PSByZWNvcmRPYmouZGV2ZWxvcGVyLmpzb24gJiYgIXByb2Nlc3Npb25PYmouanNvbikge1xuICAgICAgICBsb2coJz09PT09PT09PT09PT09SlNPTuaWh+S7tue8luivkeWujOaIkD09PT09PT09PT09PT09Jyk7XG4gICAgICAgIGlzRW5kQ29tcGlsYXRpb24oMSwgJ2pzb24nKTtcbiAgICB9XG59KTtcbmxvZ0VtaXR0ZXIub24oJ2ZpbmlzaDpqcycsIChudW0gPSAxKSA9PiB7XG4gICAgZmluaXNoT2JqLmpzICs9IG51bTtcbiAgICBpZiAoZmluaXNoT2JqLmpzID09PSByZWNvcmRPYmouZGV2ZWxvcGVyLmpzICYmICFwcm9jZXNzaW9uT2JqLmpzKSB7XG4gICAgICAgIGxvZygnPT09PT09PT09PT09PT1KU+aWh+S7tue8luivkeWujOaIkD09PT09PT09PT09PT09Jyk7XG4gICAgICAgIGlzRW5kQ29tcGlsYXRpb24oMSwgJ2pzJyk7XG4gICAgfVxufSk7XG5sb2dFbWl0dGVyLm9uKCdmaW5pc2g6aHRtbCcsIChudW0gPSAxKSA9PiB7XG4gICAgZmluaXNoT2JqLmh0bWwgKz0gbnVtO1xuICAgIGlmIChmaW5pc2hPYmouaHRtbCA9PT0gcmVjb3JkT2JqLmRldmVsb3Blci5odG1sICYmICFwcm9jZXNzaW9uT2JqLmh0bWwpIHtcbiAgICAgICAgbG9nKCc9PT09PT09PT09PT09PUhUTUzmlofku7bnvJbor5HlrozmiJA9PT09PT09PT09PT09PScpO1xuICAgICAgICBpc0VuZENvbXBpbGF0aW9uKDEsICdodG1sJyk7XG4gICAgfVxufSk7XG5sb2dFbWl0dGVyLm9uKCdlcnJvcicsIChlcnIpID0+IHtcbiAgICBsb2coZXJyLCAnZXJyb3InKTtcbn0pO1xuXG5mdW5jdGlvbiBpc0VuZENvbXBpbGF0aW9uKHN0ZXAsIHByb2Nlc3Npb24pIHtcbiAgICBwcm9jZXNzaW9uT2JqW3Byb2Nlc3Npb25dID0gdHJ1ZTtcbiAgICBzdGVwTnVtICs9IHN0ZXA7XG4gICAgaWYgKHN0ZXBOdW0gJSA2ID09PSAwKSB7XG4gICAgICAgIGxvZyhgPT09PT09PT09PT09PT09PT09PT09PT09PT3nvJbor5HlrozmiJA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09JHtEYXRlLm5vdygpfWApO1xuICAgICAgICBjb21waWxhdGlvblByb2dyZXNzKCdlbmQnKTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGxvZ0VtaXR0ZXI7Il19