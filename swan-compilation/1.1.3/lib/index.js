'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = swanCompileFlow;

var _developerFlow = require('./developer-flow');

var _developerFlow2 = _interopRequireDefault(_developerFlow);

var _frameworkFlow = require('./framework-flow');

var _frameworkFlow2 = _interopRequireDefault(_frameworkFlow);

var _util = require('./util');

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @file swan编译
 * @author zhuxin04
 */
function swanCompileFlow(appConfig, basePath, workPath, defaultDeployPath, swanCorePath) {
    var compileBaseLib = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : true;
    var options = arguments[6];
    var errorFn = arguments[7];

    (0, _util.log)('==========================\u7F16\u8BD1\u5F00\u59CB===============================' + Date.now());
    (0, _util.compilationProgress)('start');
    (0, _developerFlow2.default)(appConfig, basePath, workPath, defaultDeployPath, swanCorePath, options, errorFn);
    if (compileBaseLib) {
        (0, _frameworkFlow2.default)(appConfig, basePath, workPath, defaultDeployPath, swanCorePath, options, errorFn);
    } else {
        // logEmitter.emit('frame:lib');
        // logEmitter.emit('frame:html');
    }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJzd2FuQ29tcGlsZUZsb3ciLCJhcHBDb25maWciLCJiYXNlUGF0aCIsIndvcmtQYXRoIiwiZGVmYXVsdERlcGxveVBhdGgiLCJzd2FuQ29yZVBhdGgiLCJjb21waWxlQmFzZUxpYiIsIm9wdGlvbnMiLCJlcnJvckZuIiwiRGF0ZSIsIm5vdyJdLCJtYXBwaW5ncyI6Ijs7Ozs7a0JBUXdCQSxlOztBQUp4Qjs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7OztBQVBBOzs7O0FBUWUsU0FBU0EsZUFBVCxDQUF5QkMsU0FBekIsRUFBb0NDLFFBQXBDLEVBQThDQyxRQUE5QyxFQUF3REMsaUJBQXhELEVBQTJFQyxZQUEzRSxFQUM4QjtBQUFBLFFBQXpDQyxjQUF5Qyx1RUFBeEIsSUFBd0I7QUFBQSxRQUFsQkMsT0FBa0I7QUFBQSxRQUFUQyxPQUFTOztBQUN6Qyx5R0FBb0VDLEtBQUtDLEdBQUwsRUFBcEU7QUFDQSxtQ0FBb0IsT0FBcEI7QUFDQSxpQ0FBWVQsU0FBWixFQUF1QkMsUUFBdkIsRUFBaUNDLFFBQWpDLEVBQTJDQyxpQkFBM0MsRUFBOERDLFlBQTlELEVBQTRFRSxPQUE1RSxFQUFxRkMsT0FBckY7QUFDQSxRQUFJRixjQUFKLEVBQW9CO0FBQ2hCLHFDQUFjTCxTQUFkLEVBQXlCQyxRQUF6QixFQUFtQ0MsUUFBbkMsRUFBNkNDLGlCQUE3QyxFQUFnRUMsWUFBaEUsRUFBOEVFLE9BQTlFLEVBQXVGQyxPQUF2RjtBQUNILEtBRkQsTUFFTztBQUNIO0FBQ0E7QUFDSDtBQUNKIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZSBzd2Fu57yW6K+RXG4gKiBAYXV0aG9yIHpodXhpbjA0XG4gKi9cbmltcG9ydCBkZXZlbG9wRmxvdyBmcm9tICcuL2RldmVsb3Blci1mbG93JztcbmltcG9ydCBmcmFtZXdvcmtGbG93IGZyb20gJy4vZnJhbWV3b3JrLWZsb3cnO1xuaW1wb3J0IHtjb21waWxhdGlvblByb2dyZXNzLCBsb2d9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQgbG9nRW1pdHRlciBmcm9tICcuL2xvZyc7XG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBzd2FuQ29tcGlsZUZsb3coYXBwQ29uZmlnLCBiYXNlUGF0aCwgd29ya1BhdGgsIGRlZmF1bHREZXBsb3lQYXRoLCBzd2FuQ29yZVBhdGgsXG4gICAgY29tcGlsZUJhc2VMaWIgPSB0cnVlLCBvcHRpb25zLCBlcnJvckZuKSB7XG4gICAgbG9nKGA9PT09PT09PT09PT09PT09PT09PT09PT09Pee8luivkeW8gOWniz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0ke0RhdGUubm93KCl9YCk7XG4gICAgY29tcGlsYXRpb25Qcm9ncmVzcygnc3RhcnQnKTtcbiAgICBkZXZlbG9wRmxvdyhhcHBDb25maWcsIGJhc2VQYXRoLCB3b3JrUGF0aCwgZGVmYXVsdERlcGxveVBhdGgsIHN3YW5Db3JlUGF0aCwgb3B0aW9ucywgZXJyb3JGbik7XG4gICAgaWYgKGNvbXBpbGVCYXNlTGliKSB7XG4gICAgICAgIGZyYW1ld29ya0Zsb3coYXBwQ29uZmlnLCBiYXNlUGF0aCwgd29ya1BhdGgsIGRlZmF1bHREZXBsb3lQYXRoLCBzd2FuQ29yZVBhdGgsIG9wdGlvbnMsIGVycm9yRm4pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGxvZ0VtaXR0ZXIuZW1pdCgnZnJhbWU6bGliJyk7XG4gICAgICAgIC8vIGxvZ0VtaXR0ZXIuZW1pdCgnZnJhbWU6aHRtbCcpO1xuICAgIH1cbn0iXX0=