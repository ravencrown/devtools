'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = processCss;

var _stream = require('stream');

var _stream2 = _interopRequireDefault(_stream);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _css = require('css');

var _css2 = _interopRequireDefault(_css);

var _util = require('./util');

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

var _postcss = require('postcss');

var _postcss2 = _interopRequireDefault(_postcss);

var _index = require('./postcss-import/index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @file 处理css文件
 * @author zhuxin04
 */
var labelStr = '(^|\\s)(view|text|input|textarea|button|image|scroll-view|swiper' + '|swiper-item|icon|label|picker-view|picker-view-column|audio|live-player|checkbox-group' + '|checkbox|radio-group|radio|switch|map|cover-view|cover-image|video)(\\s|\\{|\\.|(?=\\:)|$)';

var syntaxMap = [{
    regx: new RegExp(labelStr, 'g'),
    replacer: '$1swan-$2$3'
}];

function syntaxFilter(originContent, basename) {
    return new Promise(function (resolve, reject) {
        var syntaxAfr = syntaxMap.reduce(function (originContent, currentRep) {
            return originContent.replace(currentRep.regx, currentRep.replacer);
        }, originContent);
        resolve({ originContent: syntaxAfr, basename: basename });
    });
}

function rpxConvert(_ref) {
    var originContent = _ref.originContent,
        basename = _ref.basename;

    // 删除单行注释
    originContent = originContent.replace(/[\n\s;]\/\/(.)*/g, '');
    var cssObject = {};
    try {
        cssObject = _css2.default.parse(originContent);
    } catch (error) {
        (0, _util.log)(basename + ':   ' + error, 'error');
    }
    var rules = cssObject['stylesheet']['rules'];
    for (var i in rules) {
        if (rules[i].type === 'rule') {
            var declarations = rules[i].declarations;
            for (var declareName in declarations) {
                if (declarations[declareName].type === 'declaration') {
                    declarations[declareName].value = declarations[declareName].value.replace(/(\d+)rpx/g, function (allValue, valueNumber) {
                        return +valueNumber / 7.5 + 'vw';
                    });
                }
            }
        }
    }
    var result = _css2.default.stringify(cssObject);
    return result;
}

function renderContents(fileName, cssFile) {
    return new _stream2.default.Transform({
        transform: function transform(chunk, enc, cb) {
            syntaxFilter(chunk.toString(), fileName).then(rpxConvert).then(function (contents) {
                cb(null, contents);
            }).catch(function (err) {
                (0, _util.log)('error --------- ' + cssFile + ':   ' + err, 'error');
            });
        }
    });
}

function processCssImport(cssFile, workPath) {
    return new _stream2.default.Transform({
        transform: function transform(chunk, enc, cb) {
            (0, _postcss2.default)().use((0, _index2.default)({
                filter: function filter(importPath) {
                    return (/\.css$/.test(cssFile)
                    );
                },
                resolve: function resolve(nestImportPath, basedir, importOptions) {
                    var findPath = _path2.default.isAbsolute(nestImportPath) ? (0, _util.pathJoin)(workPath, nestImportPath) : nestImportPath;
                    if (!/\.css$/.test(findPath)) {
                        findPath += '.css';
                    }
                    return findPath;
                }
            })).process(chunk.toString(), {
                from: cssFile
            }).then(function (result) {
                var output = result.css;
                cb(null, output);
            }).catch(function (err) {
                (0, _util.log)('error --------- ' + cssFile + ':  ' + err, 'error');
            });
        }
    });
}

function compileCssFile(cssFile, isLastFile, basePath, workPath, defaultDeployPath) {
    var rs = _fs2.default.createReadStream(cssFile, {
        highWaterMark: 200 * 1024
    });
    var fileName = _path2.default.basename(cssFile);
    var relativePath = _path2.default.dirname(_path2.default.relative(workPath, cssFile));
    var outputPathDir = (0, _util.pathJoin)(defaultDeployPath, relativePath);
    (0, _util.mkdirs)(outputPathDir);
    var outputPath = (0, _util.pathJoin)(outputPathDir, fileName);
    var ws = _fs2.default.createWriteStream(outputPath);
    rs.pipe(processCssImport(cssFile, workPath)).pipe(renderContents(fileName, cssFile)).pipe(ws).on('finish', function () {
        _log2.default.emit('finish:css');
    }).on('error', function (err) {
        (0, _util.log)(err, 'error');
    });
}

function processCss(appConfig, basePath, workPath, defaultDeployPath, options, errorCallback, isLoopEnd) {
    var sourcePath = workPath + options.usingPackage.baseWorkPath;
    var ignoreSearchPaths = [defaultDeployPath];
    options.excludePackages.map(function (excludePackage) {
        ignoreSearchPaths.push((0, _util.pathJoin)(workPath, excludePackage.baseWorkPath));
    });
    var cssFiles = (0, _util.displayFiles)(sourcePath, /(.*)\.css$/, ignoreSearchPaths);
    var fileLen = cssFiles.length;
    _log2.default.emit('record:css', fileLen);
    if (!fileLen) {
        _log2.default.emit('finish:css', 0);
    }
    cssFiles.forEach(function (cssFile, index) {
        var isLastFile = index === fileLen - 1 && isLoopEnd;
        compileCssFile(cssFile, isLastFile, basePath, workPath, defaultDeployPath);
    });
    var appCssReadStream = _fs2.default.createReadStream((0, _util.pathJoin)(workPath, 'app.css'));
    var appCssWriteStream = _fs2.default.createWriteStream((0, _util.pathJoin)(defaultDeployPath, 'app.css'));
    appCssReadStream.pipe(appCssWriteStream);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9wcm9jZXNzLWNzcy5qcyJdLCJuYW1lcyI6WyJwcm9jZXNzQ3NzIiwibGFiZWxTdHIiLCJzeW50YXhNYXAiLCJyZWd4IiwiUmVnRXhwIiwicmVwbGFjZXIiLCJzeW50YXhGaWx0ZXIiLCJvcmlnaW5Db250ZW50IiwiYmFzZW5hbWUiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsInN5bnRheEFmciIsInJlZHVjZSIsImN1cnJlbnRSZXAiLCJyZXBsYWNlIiwicnB4Q29udmVydCIsImNzc09iamVjdCIsImNzcyIsInBhcnNlIiwiZXJyb3IiLCJydWxlcyIsImkiLCJ0eXBlIiwiZGVjbGFyYXRpb25zIiwiZGVjbGFyZU5hbWUiLCJ2YWx1ZSIsImFsbFZhbHVlIiwidmFsdWVOdW1iZXIiLCJyZXN1bHQiLCJzdHJpbmdpZnkiLCJyZW5kZXJDb250ZW50cyIsImZpbGVOYW1lIiwiY3NzRmlsZSIsInN0cmVhbSIsIlRyYW5zZm9ybSIsInRyYW5zZm9ybSIsImNodW5rIiwiZW5jIiwiY2IiLCJ0b1N0cmluZyIsInRoZW4iLCJjb250ZW50cyIsImNhdGNoIiwiZXJyIiwicHJvY2Vzc0Nzc0ltcG9ydCIsIndvcmtQYXRoIiwidXNlIiwiZmlsdGVyIiwiaW1wb3J0UGF0aCIsInRlc3QiLCJuZXN0SW1wb3J0UGF0aCIsImJhc2VkaXIiLCJpbXBvcnRPcHRpb25zIiwiZmluZFBhdGgiLCJwYXRoIiwiaXNBYnNvbHV0ZSIsInByb2Nlc3MiLCJmcm9tIiwib3V0cHV0IiwiY29tcGlsZUNzc0ZpbGUiLCJpc0xhc3RGaWxlIiwiYmFzZVBhdGgiLCJkZWZhdWx0RGVwbG95UGF0aCIsInJzIiwiZnMiLCJjcmVhdGVSZWFkU3RyZWFtIiwiaGlnaFdhdGVyTWFyayIsInJlbGF0aXZlUGF0aCIsImRpcm5hbWUiLCJyZWxhdGl2ZSIsIm91dHB1dFBhdGhEaXIiLCJvdXRwdXRQYXRoIiwid3MiLCJjcmVhdGVXcml0ZVN0cmVhbSIsInBpcGUiLCJvbiIsImxvZ0VtaXR0ZXIiLCJlbWl0IiwiYXBwQ29uZmlnIiwib3B0aW9ucyIsImVycm9yQ2FsbGJhY2siLCJpc0xvb3BFbmQiLCJzb3VyY2VQYXRoIiwidXNpbmdQYWNrYWdlIiwiYmFzZVdvcmtQYXRoIiwiaWdub3JlU2VhcmNoUGF0aHMiLCJleGNsdWRlUGFja2FnZXMiLCJtYXAiLCJwdXNoIiwiZXhjbHVkZVBhY2thZ2UiLCJjc3NGaWxlcyIsImZpbGVMZW4iLCJsZW5ndGgiLCJmb3JFYWNoIiwiaW5kZXgiLCJhcHBDc3NSZWFkU3RyZWFtIiwiYXBwQ3NzV3JpdGVTdHJlYW0iXSwibWFwcGluZ3MiOiI7Ozs7O2tCQXVJd0JBLFU7O0FBbkl4Qjs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOztBQVNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBbkJBOzs7O0FBcUJBLElBQU1DLFdBQVcscUVBQ1gseUZBRFcsR0FFWCw2RkFGTjs7QUFJQSxJQUFNQyxZQUFZLENBQ2Q7QUFDSUMsVUFBTSxJQUFJQyxNQUFKLENBQVdILFFBQVgsRUFBcUIsR0FBckIsQ0FEVjtBQUVJSTtBQUZKLENBRGMsQ0FBbEI7O0FBT0EsU0FBU0MsWUFBVCxDQUFzQkMsYUFBdEIsRUFBcUNDLFFBQXJDLEVBQStDO0FBQzNDLFdBQU8sSUFBSUMsT0FBSixDQUFZLFVBQVVDLE9BQVYsRUFBbUJDLE1BQW5CLEVBQTJCO0FBQzFDLFlBQU1DLFlBQVlWLFVBQVVXLE1BQVYsQ0FBaUIsVUFBVU4sYUFBVixFQUF5Qk8sVUFBekIsRUFBcUM7QUFDcEUsbUJBQU9QLGNBQWNRLE9BQWQsQ0FBc0JELFdBQVdYLElBQWpDLEVBQXVDVyxXQUFXVCxRQUFsRCxDQUFQO0FBQ0gsU0FGaUIsRUFFZkUsYUFGZSxDQUFsQjtBQUdBRyxnQkFBUSxFQUFDSCxlQUFlSyxTQUFoQixFQUEyQkosa0JBQTNCLEVBQVI7QUFDSCxLQUxNLENBQVA7QUFNSDs7QUFFRCxTQUFTUSxVQUFULE9BQStDO0FBQUEsUUFBMUJULGFBQTBCLFFBQTFCQSxhQUEwQjtBQUFBLFFBQVhDLFFB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Iiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZSDlpITnkIZjc3Pmlofku7ZcbiAqIEBhdXRob3Igemh1eGluMDRcbiAqL1xuaW1wb3J0IHN0cmVhbSBmcm9tICdzdHJlYW0nO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGNzcyBmcm9tICdjc3MnO1xuaW1wb3J0IHtcbiAgICBta2RpcnMsXG4gICAgcGF0aEpvaW4sXG4gICAgZGlzcGxheUZpbGVzLFxuICAgIGlzQWJzb2x1dGVQYXRoLFxuICAgIGJhYmVsVHJhbnNmb3JtLFxuICAgIHVnbGlmeVRyYW5zZm9ybSxcbiAgICBsb2dcbn0gZnJvbSAnLi91dGlsJztcbmltcG9ydCBsb2dFbWl0dGVyIGZyb20gJy4vbG9nJztcbmltcG9ydCBwb3N0Y3NzIGZyb20gJ3Bvc3Rjc3MnO1xuaW1wb3J0IGF0SW1wb3J0IGZyb20gJy4vcG9zdGNzcy1pbXBvcnQvaW5kZXgnO1xuXG5jb25zdCBsYWJlbFN0ciA9ICcoXnxcXFxccykodmlld3x0ZXh0fGlucHV0fHRleHRhcmVhfGJ1dHRvbnxpbWFnZXxzY3JvbGwtdmlld3xzd2lwZXInXG4gICAgKyAnfHN3aXBlci1pdGVtfGljb258bGFiZWx8cGlja2VyLXZpZXd8cGlja2VyLXZpZXctY29sdW1ufGF1ZGlvfGxpdmUtcGxheWVyfGNoZWNrYm94LWdyb3VwJ1xuICAgICsgJ3xjaGVja2JveHxyYWRpby1ncm91cHxyYWRpb3xzd2l0Y2h8bWFwfGNvdmVyLXZpZXd8Y292ZXItaW1hZ2V8dmlkZW8pKFxcXFxzfFxcXFx7fFxcXFwufCg/PVxcXFw6KXwkKSc7XG5cbmNvbnN0IHN5bnRheE1hcCA9IFtcbiAgICB7XG4gICAgICAgIHJlZ3g6IG5ldyBSZWdFeHAobGFiZWxTdHIsICdnJyksXG4gICAgICAgIHJlcGxhY2VyOiBgJDFzd2FuLSQyJDNgXG4gICAgfVxuXTtcblxuZnVuY3Rpb24gc3ludGF4RmlsdGVyKG9yaWdpbkNvbnRlbnQsIGJhc2VuYW1lKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgY29uc3Qgc3ludGF4QWZyID0gc3ludGF4TWFwLnJlZHVjZShmdW5jdGlvbiAob3JpZ2luQ29udGVudCwgY3VycmVudFJlcCkge1xuICAgICAgICAgICAgcmV0dXJuIG9yaWdpbkNvbnRlbnQucmVwbGFjZShjdXJyZW50UmVwLnJlZ3gsIGN1cnJlbnRSZXAucmVwbGFjZXIpO1xuICAgICAgICB9LCBvcmlnaW5Db250ZW50KTtcbiAgICAgICAgcmVzb2x2ZSh7b3JpZ2luQ29udGVudDogc3ludGF4QWZyLCBiYXNlbmFtZX0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBycHhDb252ZXJ0KHtvcmlnaW5Db250ZW50LCBiYXNlbmFtZX0pIHtcbiAgICAvLyDliKDpmaTljZXooYzms6jph4pcbiAgICBvcmlnaW5Db250ZW50ID0gb3JpZ2luQ29udGVudC5yZXBsYWNlKC9bXFxuXFxzO11cXC9cXC8oLikqL2csICcnKTtcbiAgICBsZXQgY3NzT2JqZWN0ID0ge307XG4gICAgdHJ5IHtcbiAgICAgICAgY3NzT2JqZWN0ID0gY3NzLnBhcnNlKG9yaWdpbkNvbnRlbnQpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGxvZyhgJHtiYXNlbmFtZX06ICAgJHtlcnJvcn1gLCAnZXJyb3InKTtcbiAgICB9XG4gICAgbGV0IHJ1bGVzID0gY3NzT2JqZWN0WydzdHlsZXNoZWV0J11bJ3J1bGVzJ107XG4gICAgZm9yIChsZXQgaSBpbiBydWxlcykge1xuICAgICAgICBpZiAocnVsZXNbaV0udHlwZSA9PT0gJ3J1bGUnKSB7XG4gICAgICAgICAgICBjb25zdCBkZWNsYXJhdGlvbnMgPSBydWxlc1tpXS5kZWNsYXJhdGlvbnNcbiAgICAgICAgICAgIGZvciAobGV0IGRlY2xhcmVOYW1lIGluIGRlY2xhcmF0aW9ucykge1xuICAgICAgICAgICAgICAgIGlmIChkZWNsYXJhdGlvbnNbZGVjbGFyZU5hbWVdLnR5cGUgPT09ICdkZWNsYXJhdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVjbGFyYXRpb25zW2RlY2xhcmVOYW1lXS52YWx1ZSA9IGRlY2xhcmF0aW9uc1tkZWNsYXJlTmFtZV0udmFsdWVcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyhcXGQrKXJweC9nLCBmdW5jdGlvbiAoYWxsVmFsdWUsIHZhbHVlTnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKCgrdmFsdWVOdW1iZXIpIC8gNy41KSArICd2dyc7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zdCByZXN1bHQgPSBjc3Muc3RyaW5naWZ5KGNzc09iamVjdCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gcmVuZGVyQ29udGVudHMoZmlsZU5hbWUsIGNzc0ZpbGUpIHtcbiAgICByZXR1cm4gbmV3IHN0cmVhbS5UcmFuc2Zvcm0oe1xuICAgICAgICB0cmFuc2Zvcm0oY2h1bmssIGVuYywgY2IpIHtcbiAgICAgICAgICAgIHN5bnRheEZpbHRlcihjaHVuay50b1N0cmluZygpLCBmaWxlTmFtZSlcbiAgICAgICAgICAgIC50aGVuKHJweENvbnZlcnQpXG4gICAgICAgICAgICAudGhlbihjb250ZW50cyA9PiB7XG4gICAgICAgICAgICAgICAgY2IobnVsbCwgY29udGVudHMpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIGxvZyhgZXJyb3IgLS0tLS0tLS0tICR7Y3NzRmlsZX06ICAgJHtlcnJ9YCwgJ2Vycm9yJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBwcm9jZXNzQ3NzSW1wb3J0KGNzc0ZpbGUsIHdvcmtQYXRoKSB7XG4gICAgcmV0dXJuIG5ldyBzdHJlYW0uVHJhbnNmb3JtKHtcbiAgICAgICAgdHJhbnNmb3JtKGNodW5rLCBlbmMsIGNiKSB7XG4gICAgICAgICAgICBwb3N0Y3NzKClcbiAgICAgICAgICAgIC51c2UoYXRJbXBvcnQoe1xuICAgICAgICAgICAgICAgIGZpbHRlcihpbXBvcnRQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAvXFwuY3NzJC8udGVzdChjc3NGaWxlKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJlc29sdmUobmVzdEltcG9ydFBhdGgsIGJhc2VkaXIsIGltcG9ydE9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGZpbmRQYXRoID0gcGF0aC5pc0Fic29sdXRlKG5lc3RJbXBvcnRQYXRoKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBwYXRoSm9pbih3b3JrUGF0aCwgbmVzdEltcG9ydFBhdGgpIDogbmVzdEltcG9ydFBhdGg7XG4gICAgICAgICAgICAgICAgICAgIGlmICghKC9cXC5jc3MkLy50ZXN0KGZpbmRQYXRoKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbmRQYXRoICs9ICcuY3NzJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmluZFBhdGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAucHJvY2VzcyhjaHVuay50b1N0cmluZygpLCB7XG4gICAgICAgICAgICAgICAgZnJvbTogY3NzRmlsZVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IG91dHB1dCA9IHJlc3VsdC5jc3M7XG4gICAgICAgICAgICAgICAgY2IobnVsbCwgb3V0cHV0KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgbG9nKGBlcnJvciAtLS0tLS0tLS0gJHtjc3NGaWxlfTogICR7ZXJyfWAsICdlcnJvcicpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY29tcGlsZUNzc0ZpbGUoY3NzRmlsZSwgaXNMYXN0RmlsZSwgYmFzZVBhdGgsIHdvcmtQYXRoLCBkZWZhdWx0RGVwbG95UGF0aCkge1xuICAgIGxldCBycyA9IGZzLmNyZWF0ZVJlYWRTdHJlYW0oY3NzRmlsZSwge1xuICAgICAgICBoaWdoV2F0ZXJNYXJrOiAyMDAgKiAxMDI0XG4gICAgfSk7XG4gICAgbGV0IGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZShjc3NGaWxlKTtcbiAgICBsZXQgcmVsYXRpdmVQYXRoID0gcGF0aC5kaXJuYW1lKHBhdGgucmVsYXRpdmUod29ya1BhdGgsIGNzc0ZpbGUpKTtcbiAgICBsZXQgb3V0cHV0UGF0aERpciA9IHBhdGhKb2luKGRlZmF1bHREZXBsb3lQYXRoLCByZWxhdGl2ZVBhdGgpO1xuICAgIG1rZGlycyhvdXRwdXRQYXRoRGlyKTtcbiAgICBsZXQgb3V0cHV0UGF0aCA9IHBhdGhKb2luKG91dHB1dFBhdGhEaXIsIGZpbGVOYW1lKTtcbiAgICBsZXQgd3MgPSBmcy5jcmVhdGVXcml0ZVN0cmVhbShvdXRwdXRQYXRoKTtcbiAgICByc1xuICAgIC5waXBlKHByb2Nlc3NDc3NJbXBvcnQoY3NzRmlsZSwgd29ya1BhdGgpKVxuICAgIC5waXBlKHJlbmRlckNvbnRlbnRzKGZpbGVOYW1lLCBjc3NGaWxlKSlcbiAgICAucGlwZSh3cylcbiAgICAub24oJ2ZpbmlzaCcsICgpID0+IHtcbiAgICAgICAgbG9nRW1pdHRlci5lbWl0KCdmaW5pc2g6Y3NzJyk7XG4gICAgfSlcbiAgICAub24oJ2Vycm9yJywgZXJyID0+IHtcbiAgICAgICAgbG9nKGVyciwgJ2Vycm9yJyk7XG4gICAgfSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHByb2Nlc3NDc3MoYXBwQ29uZmlnLCBiYXNlUGF0aCwgd29ya1BhdGgsIGRlZmF1bHREZXBsb3lQYXRoLCBvcHRpb25zLFxuICAgIGVycm9yQ2FsbGJhY2ssIGlzTG9vcEVuZCkge1xuICAgIGNvbnN0IHNvdXJjZVBhdGggPSB3b3JrUGF0aCArIG9wdGlvbnMudXNpbmdQYWNrYWdlLmJhc2VXb3JrUGF0aDtcbiAgICBjb25zdCBpZ25vcmVTZWFyY2hQYXRocyA9IFtkZWZhdWx0RGVwbG95UGF0aF07XG4gICAgb3B0aW9ucy5leGNsdWRlUGFja2FnZXMubWFwKGV4Y2x1ZGVQYWNrYWdlID0+IHtcbiAgICAgICAgaWdub3JlU2VhcmNoUGF0aHMucHVzaChwYXRoSm9pbih3b3JrUGF0aCwgZXhjbHVkZVBhY2thZ2UuYmFzZVdvcmtQYXRoKSk7XG4gICAgfSk7XG4gICAgY29uc3QgY3NzRmlsZXMgPSBkaXNwbGF5RmlsZXMoc291cmNlUGF0aCwgLyguKilcXC5jc3MkLywgaWdub3JlU2VhcmNoUGF0aHMpO1xuICAgIGNvbnN0IGZpbGVMZW4gPSBjc3NGaWxlcy5sZW5ndGg7XG4gICAgbG9nRW1pdHRlci5lbWl0KCdyZWNvcmQ6Y3NzJywgZmlsZUxlbik7XG4gICAgaWYgKCFmaWxlTGVuKSB7XG4gICAgICAgIGxvZ0VtaXR0ZXIuZW1pdCgnZmluaXNoOmNzcycsIDApO1xuICAgIH1cbiAgICBjc3NGaWxlcy5mb3JFYWNoKChjc3NGaWxlLCBpbmRleCkgPT4ge1xuICAgICAgICBsZXQgaXNMYXN0RmlsZSA9IChpbmRleCA9PT0gZmlsZUxlbiAtIDEpICYmIGlzTG9vcEVuZDtcbiAgICAgICAgY29tcGlsZUNzc0ZpbGUoY3NzRmlsZSwgaXNMYXN0RmlsZSwgYmFzZVBhdGgsIHdvcmtQYXRoLCBkZWZhdWx0RGVwbG95UGF0aCk7XG4gICAgfSk7XG4gICAgY29uc3QgYXBwQ3NzUmVhZFN0cmVhbSA9IGZzLmNyZWF0ZVJlYWRTdHJlYW0ocGF0aEpvaW4od29ya1BhdGgsICdhcHAuY3NzJykpO1xuICAgIGNvbnN0IGFwcENzc1dyaXRlU3RyZWFtID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0ocGF0aEpvaW4oZGVmYXVsdERlcGxveVBhdGgsICdhcHAuY3NzJykpO1xuICAgIGFwcENzc1JlYWRTdHJlYW0ucGlwZShhcHBDc3NXcml0ZVN0cmVhbSk7XG59Il19