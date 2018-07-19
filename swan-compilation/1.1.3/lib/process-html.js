'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.renderContens = renderContens;
exports.default = processHtml;

var _stream = require('stream');

var _stream2 = _interopRequireDefault(_stream);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _ejs = require('ejs');

var _ejs2 = _interopRequireDefault(_ejs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _util = require('./util');

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @file 根据app.json的pages字段生成html文件
 * @author zhuxin04
 */
function render(originContent, data) {
    return _ejs2.default.render(originContent, data);
}

function renderContens(pagePath, moduleName, defaultDeployPath, htmlReplaceVariables) {
    var runtimeRelativePath = pagePath;
    if (pagePath !== './') {
        runtimeRelativePath = pagePath.replace(/\/[^\/]*?\/?$/, '/').replace(/[^\/]+(?=\/)/g, '..');
    }
    var runtimeRelativeProjectPath = runtimeRelativePath;
    runtimeRelativePath = runtimeRelativePath + 'globals/';
    var builtinVariable = {
        runtimeRelativePath: runtimeRelativePath
    };
    return new _stream2.default.Transform({
        transform: function transform(chunk, enc, cb) {
            var jsContent = render(chunk.toString(), {
                deployPath: defaultDeployPath,
                moduleName: moduleName,
                runtimeRelativePath: runtimeRelativePath,
                runtimeRelativeProjectPath: runtimeRelativeProjectPath
            });
            if (htmlReplaceVariables) {
                for (var variable in htmlReplaceVariables) {
                    var value = builtinVariable[htmlReplaceVariables[variable]] || htmlReplaceVariables[variable];
                    jsContent = jsContent.replace(new RegExp(variable, 'g'), value);
                }
            }
            cb(null, jsContent);
        }
    });
}

function processHtml(appConfig, basePath, workPath, defaultDeployPath, swanCorePath, options, errorCallback, isLoopEnd) {
    var usingPackage = options.usingPackage,
        htmlReplaceVariables = options.htmlReplaceVariables;

    var pagePaths = usingPackage.pages;
    var useOldPackHtml = options.useOldPackHtml;
    var pagesLen = pagePaths.length;
    _log2.default.emit('record:html', pagesLen);
    if (!pagesLen) {
        _log2.default.emit('finish:html', 0);
    }
    pagePaths.map(function (pagePath, index) {
        var moduleName = /\/([^\/]*)$/g.exec(pagePath)[1];
        var OLD_HTML_PATH = (0, _util.pathJoin)(basePath, 'globals/slaves/pageBaseHtml.html');
        var NEW_HTML_PATH = (0, _util.pathJoin)(swanCorePath, 'dist/box/slaves/slaves.html');
        var HTML_PATH = useOldPackHtml ? OLD_HTML_PATH : NEW_HTML_PATH;
        var OLD_DEPLOY_PATH = defaultDeployPath;
        var NEW_DEPLOY_PATH = defaultDeployPath;
        var DEPLOY_PATH = useOldPackHtml ? OLD_DEPLOY_PATH : NEW_DEPLOY_PATH;
        var writePath = '';
        if (useOldPackHtml) {
            writePath = (0, _util.pathJoin)(DEPLOY_PATH, pagePath + '.html');
        } else {
            writePath = (0, _util.pathJoin)(defaultDeployPath, 'globals/slaves/slaves.html');
        }
        (0, _util.mkdirs)(_path2.default.dirname(writePath));
        var writeStream = _fs2.default.createWriteStream(writePath);
        _fs2.default.createReadStream(HTML_PATH).pipe(renderContens(pagePath, moduleName, defaultDeployPath, htmlReplaceVariables)).pipe(writeStream).on('finish', function () {
            _log2.default.emit('finish:html');
        }).on('error', function (err) {
            (0, _util.log)(err, 'error');
        });
    });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9wcm9jZXNzLWh0bWwuanMiXSwibmFtZXMiOlsicmVuZGVyQ29udGVucyIsInByb2Nlc3NIdG1sIiwicmVuZGVyIiwib3JpZ2luQ29udGVudCIsImRhdGEiLCJlanMiLCJwYWdlUGF0aCIsIm1vZHVsZU5hbWUiLCJkZWZhdWx0RGVwbG95UGF0aCIsImh0bWxSZXBsYWNlVmFyaWFibGVzIiwicnVudGltZVJlbGF0aXZlUGF0aCIsInJlcGxhY2UiLCJydW50aW1lUmVsYXRpdmVQcm9qZWN0UGF0aCIsImJ1aWx0aW5WYXJpYWJsZSIsInN0cmVhbSIsIlRyYW5zZm9ybSIsInRyYW5zZm9ybSIsImNodW5rIiwiZW5jIiwiY2IiLCJqc0NvbnRlbnQiLCJ0b1N0cmluZyIsImRlcGxveVBhdGgiLCJ2YXJpYWJsZSIsInZhbHVlIiwiUmVnRXhwIiwiYXBwQ29uZmlnIiwiYmFzZVBhdGgiLCJ3b3JrUGF0aCIsInN3YW5Db3JlUGF0aCIsIm9wdGlvbnMiLCJlcnJvckNhbGxiYWNrIiwiaXNMb29wRW5kIiwidXNpbmdQYWNrYWdlIiwicGFnZVBhdGhzIiwicGFnZXMiLCJ1c2VPbGRQYWNrSHRtbCIsInBhZ2VzTGVuIiwibGVuZ3RoIiwibG9nRW1pdHRlciIsImVtaXQiLCJtYXAiLCJpbmRleCIsImV4ZWMiLCJPTERfSFRNTF9QQVRIIiwiTkVXX0hUTUxfUEFUSCIsIkhUTUxfUEFUSCIsIk9MRF9ERVBMT1lfUEFUSCIsIk5FV19ERVBMT1lfUEFUSCIsIkRFUExPWV9QQVRIIiwid3JpdGVQYXRoIiwicGF0aCIsImRpcm5hbWUiLCJ3cml0ZVN0cmVhbSIsImZzIiwiY3JlYXRlV3JpdGVTdHJlYW0iLCJjcmVhdGVSZWFkU3RyZWFtIiwicGlwZSIsIm9uIiwiZXJyIl0sIm1hcHBpbmdzIjoiOzs7OztRQW1CZ0JBLGEsR0FBQUEsYTtrQkE2QlFDLFc7O0FBNUN4Qjs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOztBQUtBOzs7Ozs7QUFiQTs7OztBQWVBLFNB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SCxTQUZELE1BRU87QUFDSDRDLHdCQUFZLG9CQUFTMUMsaUJBQVQsRUFBNEIsNEJBQTVCLENBQVo7QUFDSDtBQUNELDBCQUFPMkMsZUFBS0MsT0FBTCxDQUFhRixTQUFiLENBQVA7QUFDQSxZQUFNRyxjQUFjQyxhQUFHQyxpQkFBSCxDQUFxQkwsU0FBckIsQ0FBcEI7QUFDQUkscUJBQUdFLGdCQUFILENBQW9CVixTQUFwQixFQUNDVyxJQURELENBQ016RCxjQUFjTSxRQUFkLEVBQXdCQyxVQUF4QixFQUFvQ0MsaUJBQXBDLEVBQXVEQyxvQkFBdkQsQ0FETixFQUVDZ0QsSUFGRCxDQUVNSixXQUZOLEVBR0NLLEVBSEQsQ0FHSSxRQUhKLEVBR2MsWUFBTTtBQUNoQm5CLDBCQUFXQyxJQUFYLENBQWdCLGFBQWhCO0FBQ0gsU0FMRCxFQU1Da0IsRUFORCxDQU1JLE9BTkosRUFNYSxlQUFPO0FBQ2hCLDJCQUFJQyxHQUFKLEVBQVMsT0FBVDtBQUNILFNBUkQ7QUFTSCxLQXpCRDtBQTBCSCIsImZpbGUiOiJwcm9jZXNzLWh0bWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBmaWxlIOagueaNrmFwcC5qc29u55qEcGFnZXPlrZfmrrXnlJ/miJBodG1s5paH5Lu2XG4gKiBAYXV0aG9yIHpodXhpbjA0XG4gKi9cbmltcG9ydCBzdHJlYW0gZnJvbSAnc3RyZWFtJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgZWpzIGZyb20gJ2Vqcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7XG4gICAgbWtkaXJzLFxuICAgIHBhdGhKb2luLFxuICAgIGxvZ1xufSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IGxvZ0VtaXR0ZXIgZnJvbSAnLi9sb2cnO1xuXG5mdW5jdGlvbiByZW5kZXIob3JpZ2luQ29udGVudCwgZGF0YSkge1xuICAgIHJldHVybiBlanMucmVuZGVyKG9yaWdpbkNvbnRlbnQsIGRhdGEpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyQ29udGVucyhwYWdlUGF0aCwgbW9kdWxlTmFtZSwgZGVmYXVsdERlcGxveVBhdGgsIGh0bWxSZXBsYWNlVmFyaWFibGVzKSB7XG4gICAgbGV0IHJ1bnRpbWVSZWxhdGl2ZVBhdGggPSBwYWdlUGF0aDtcbiAgICBpZiAocGFnZVBhdGggIT09ICcuLycpIHtcbiAgICAgICAgcnVudGltZVJlbGF0aXZlUGF0aCA9IHBhZ2VQYXRoLnJlcGxhY2UoL1xcL1teXFwvXSo/XFwvPyQvLCAnLycpLnJlcGxhY2UoL1teXFwvXSsoPz1cXC8pL2csICcuLicpO1xuICAgIH1cbiAgICBsZXQgcnVudGltZVJlbGF0aXZlUHJvamVjdFBhdGggPSBydW50aW1lUmVsYXRpdmVQYXRoO1xuICAgIHJ1bnRpbWVSZWxhdGl2ZVBhdGggPSBydW50aW1lUmVsYXRpdmVQYXRoICsgJ2dsb2JhbHMvJztcbiAgICBjb25zdCBidWlsdGluVmFyaWFibGUgPSB7XG4gICAgICAgIHJ1bnRpbWVSZWxhdGl2ZVBhdGg6IHJ1bnRpbWVSZWxhdGl2ZVBhdGhcbiAgICB9O1xuICAgIHJldHVybiBuZXcgc3RyZWFtLlRyYW5zZm9ybSh7XG4gICAgICAgIHRyYW5zZm9ybShjaHVuaywgZW5jLCBjYikge1xuICAgICAgICAgICAgbGV0IGpzQ29udGVudCA9IHJlbmRlcihjaHVuay50b1N0cmluZygpLCB7XG4gICAgICAgICAgICAgICAgZGVwbG95UGF0aDogZGVmYXVsdERlcGxveVBhdGgsXG4gICAgICAgICAgICAgICAgbW9kdWxlTmFtZSxcbiAgICAgICAgICAgICAgICBydW50aW1lUmVsYXRpdmVQYXRoLFxuICAgICAgICAgICAgICAgIHJ1bnRpbWVSZWxhdGl2ZVByb2plY3RQYXRoXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChodG1sUmVwbGFjZVZhcmlhYmxlcykge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IHZhcmlhYmxlIGluIGh0bWxSZXBsYWNlVmFyaWFibGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IGJ1aWx0aW5WYXJpYWJsZVtodG1sUmVwbGFjZVZhcmlhYmxlc1t2YXJpYWJsZV1dIHx8IGh0bWxSZXBsYWNlVmFyaWFibGVzW3ZhcmlhYmxlXTtcbiAgICAgICAgICAgICAgICAgICAganNDb250ZW50ID0ganNDb250ZW50LnJlcGxhY2UobmV3IFJlZ0V4cCh2YXJpYWJsZSwgJ2cnKSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNiKG51bGwsIGpzQ29udGVudCk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcHJvY2Vzc0h0bWwoYXBwQ29uZmlnLCBiYXNlUGF0aCwgd29ya1BhdGgsIGRlZmF1bHREZXBsb3lQYXRoLCBzd2FuQ29yZVBhdGgsXG4gICAgb3B0aW9ucywgZXJyb3JDYWxsYmFjaywgaXNMb29wRW5kKSB7XG4gICAgY29uc3Qge3VzaW5nUGFja2FnZSwgaHRtbFJlcGxhY2VWYXJpYWJsZXN9ID0gb3B0aW9ucztcbiAgICBjb25zdCBwYWdlUGF0aHMgPSB1c2luZ1BhY2thZ2UucGFnZXM7XG4gICAgY29uc3QgdXNlT2xkUGFja0h0bWwgPSBvcHRpb25zLnVzZU9sZFBhY2tIdG1sO1xuICAgIGNvbnN0IHBhZ2VzTGVuID0gcGFnZVBhdGhzLmxlbmd0aDtcbiAgICBsb2dFbWl0dGVyLmVtaXQoJ3JlY29yZDpodG1sJywgcGFnZXNMZW4pO1xuICAgIGlmICghcGFnZXNMZW4pIHtcbiAgICAgICAgbG9nRW1pdHRlci5lbWl0KCdmaW5pc2g6aHRtbCcsIDApO1xuICAgIH1cbiAgICBwYWdlUGF0aHMubWFwKGZ1bmN0aW9uIChwYWdlUGF0aCwgaW5kZXgpIHtcbiAgICAgICAgY29uc3QgbW9kdWxlTmFtZSA9IC9cXC8oW15cXC9dKikkL2cuZXhlYyhwYWdlUGF0aClbMV07XG4gICAgICAgIGNvbnN0IE9MRF9IVE1MX1BBVEggPSBwYXRoSm9pbihiYXNlUGF0aCwgJ2dsb2JhbHMvc2xhdmVzL3BhZ2VCYXNlSHRtbC5odG1sJyk7XG4gICAgICAgIGNvbnN0IE5FV19IVE1MX1BBVEggPSBwYXRoSm9pbihzd2FuQ29yZVBhdGgsICdkaXN0L2JveC9zbGF2ZXMvc2xhdmVzLmh0bWwnKTtcbiAgICAgICAgY29uc3QgSFRNTF9QQVRIID0gdXNlT2xkUGFja0h0bWwgPyBPTERfSFRNTF9QQVRIIDogTkVXX0hUTUxfUEFUSDtcbiAgICAgICAgY29uc3QgT0xEX0RFUExPWV9QQVRIID0gZGVmYXVsdERlcGxveVBhdGg7XG4gICAgICAgIGNvbnN0IE5FV19ERVBMT1lfUEFUSCA9IGRlZmF1bHREZXBsb3lQYXRoO1xuICAgICAgICBjb25zdCBERVBMT1lfUEFUSCA9IHVzZU9sZFBhY2tIdG1sID8gT0xEX0RFUExPWV9QQVRIIDogTkVXX0RFUExPWV9QQVRIO1xuICAgICAgICBsZXQgd3JpdGVQYXRoID0gJyc7XG4gICAgICAgIGlmICh1c2VPbGRQYWNrSHRtbCkge1xuICAgICAgICAgICAgd3JpdGVQYXRoID0gcGF0aEpvaW4oREVQTE9ZX1BBVEgsIGAke3BhZ2VQYXRofS5odG1sYCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB3cml0ZVBhdGggPSBwYXRoSm9pbihkZWZhdWx0RGVwbG95UGF0aCwgJ2dsb2JhbHMvc2xhdmVzL3NsYXZlcy5odG1sJyk7XG4gICAgICAgIH1cbiAgICAgICAgbWtkaXJzKHBhdGguZGlybmFtZSh3cml0ZVBhdGgpKTtcbiAgICAgICAgY29uc3Qgd3JpdGVTdHJlYW0gPSBmcy5jcmVhdGVXcml0ZVN0cmVhbSh3cml0ZVBhdGgpO1xuICAgICAgICBmcy5jcmVhdGVSZWFkU3RyZWFtKEhUTUxfUEFUSClcbiAgICAgICAgLnBpcGUocmVuZGVyQ29udGVucyhwYWdlUGF0aCwgbW9kdWxlTmFtZSwgZGVmYXVsdERlcGxveVBhdGgsIGh0bWxSZXBsYWNlVmFyaWFibGVzKSlcbiAgICAgICAgLnBpcGUod3JpdGVTdHJlYW0pXG4gICAgICAgIC5vbignZmluaXNoJywgKCkgPT4ge1xuICAgICAgICAgICAgbG9nRW1pdHRlci5lbWl0KCdmaW5pc2g6aHRtbCcpO1xuICAgICAgICB9KVxuICAgICAgICAub24oJ2Vycm9yJywgZXJyID0+IHtcbiAgICAgICAgICAgIGxvZyhlcnIsICdlcnJvcicpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn0iXX0=