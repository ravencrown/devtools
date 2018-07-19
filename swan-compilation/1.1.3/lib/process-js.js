'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.renderContents = renderContents;
exports.default = processJs;

var _stream = require('stream');

var _stream2 = _interopRequireDefault(_stream);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _ejs = require('ejs');

var _ejs2 = _interopRequireDefault(_ejs);

var _util = require('./util');

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

var _concatWithSourcemaps = require('concat-with-sourcemaps');

var _concatWithSourcemaps2 = _interopRequireDefault(_concatWithSourcemaps);

var _sourceMap = require('source-map');

var _sourceMap2 = _interopRequireDefault(_sourceMap);

var _inlineSourceMapComment = require('inline-source-map-comment');

var _inlineSourceMapComment2 = _interopRequireDefault(_inlineSourceMapComment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var concatSourceMap = new _concatWithSourcemaps2.default(true, 'app.js', '\n'); /**
                                                                                 * @file 处理js文件
                                                                                 * @author zhuxin04
                                                                                 */

function inSubPackage(appConfig, filename) {
    if (appConfig.subPackages) {
        return appConfig.subPackages.some(function (packageItem) {
            return packageItem.pages.some(function (subpage) {
                var filePath = packageItem.root + '/' + subpage;
                return filePath === filename;
            });
        });
    }
    return false;
}

function isSelfExecuteFile(config, filename) {
    var pages = makeAllPages(config);
    return !!~pages.indexOf(filename) || /app$/.exec(filename);
}

function makeAllPages(config) {
    if (!config.subPackages) {
        return config.pages;
    }
    return config.subPackages.reduce(function (resultPages, subPackage) {
        return resultPages.concat(subPackage.pages.map(function (page) {
            return subPackage.root + '/' + page;
        }));
    }, []).concat(config.pages);
}

function renderContents(config, workPath, filePath, mergeFilePath, isFirst, originContent) {
    var workRootStructure = /\/([^\/]*?)\/?$/g.exec(workPath);
    var workDir = workRootStructure ? workRootStructure[1] : '';
    var pathRegx = new RegExp(workDir + '\/(.*?\.js)$', 'g');
    var res = null;
    filePath = _path2.default.relative(workPath, filePath);
    // while (res = pathRegx.exec(filePath)) {
    //     filePath = res[1];
    //     pathRegx.lastIndex = 0;
    // }
    var queryPath = (0, _util.formatPath)(filePath.replace(/\.js/, ''));
    var supplement = isSelfExecuteFile(config, queryPath) ? 'window.__swanRoute=\'' + queryPath + '\';require(\'' + queryPath + '\');' : '';
    var startTpl = 'define(\'' + queryPath + '\', function (require, module, exports, define, swan, getApp, ' + 'window, document, frames, self, location, navigator, localStorage, history, Caches) {\n';
    var endTpl = '\n});\n' + supplement;
    var originFilePath = _path2.default.dirname((0, _util.pathJoin)(workPath, filePath));
    // 源文件相对于编译生成文件的相对路劲
    var fileRelativeDirPath = _path2.default.relative(_path2.default.dirname(mergeFilePath), originFilePath);
    var fileRelativePath = (0, _util.pathJoin)(fileRelativeDirPath, _path2.default.basename(filePath));
    var jsContent = startTpl + originContent + endTpl + '\n';
    var lines = originContent.split('\n').length;
    var generator = new _sourceMap2.default.SourceMapGenerator({
        file: '' + fileRelativePath
    });
    for (var i = 1, len = lines; i <= lines; i++) {
        var generatedLine = i + 3;
        !isFirst && (generatedLine = i + 5);
        generator.addMapping({
            generated: {
                line: generatedLine,
                column: 0
            },
            source: '' + fileRelativePath,
            original: {
                line: i,
                column: 0
            },
            name: '' + fileRelativePath
        });
    }
    concatSourceMap.add(fileRelativePath, originContent, generator.toString());
    return jsContent;
}

function mergeFiles(files, mergeFilePath, config, workPath, options, isLoopEnd) {
    var sourcemaps = options.sourcemaps;
    var allContents = '';
    function run(isFirst) {
        if (!files.length) {
            if (options.uglify) {
                allContents = (0, _util.uglifyTransformProcession)(allContents);
            }
            // const sourceMapping = concatSourceMap.sourceMap;
            // if (sourcemaps === 'inline') {
            //     allContents += inlineSourceMapComment(sourceMapping);
            // } else {
            //     const sourceMapPath = mergeFilePath + '.map';
            //     const ws = fs.createWriteStream(sourceMapPath);
            //     const ps = new stream.PassThrough();
            //     ps.push(sourceMapping);
            //     ps.pipe(ws);
            //     allContents += '//# sourceMappingURL=app.js.map';
            // }
            _fs2.default.writeFile(mergeFilePath, allContents, function (err) {
                if (err) {
                    (0, _util.log)(err, 'error');
                } else {
                    _log2.default.emit('finish:js');
                }
            });
            return;
        }
        var filteItem = files.shift();
        _fs2.default.readFile(filteItem, 'utf-8', function (err, content) {
            try {
                content = (0, _util.babelTransformProcession)(content, filteItem);
            } catch (error) {
                (0, _util.log)('---------------' + error + '----------------', 'error');
            }
            content = renderContents(config, workPath, filteItem, mergeFilePath, isFirst, content);
            allContents += content;
            run(false);
        });
    }
    run(true);
}

function processJs(appConfig, workPath, defaultDeployPath, options, errorCallback, isLoopEnd) {
    var excludePaths = options.excludePackages.map(function (excludePackage) {
        return workPath + excludePackage.baseWorkPath + '/';
    });
    var sourcePath = workPath + options.usingPackage.baseWorkPath;
    var userJs = (0, _util.displayFiles)(sourcePath, /(.*).js$/, [defaultDeployPath]);
    var upPositionJs = [];
    var downPositionJs = [];
    var workRootStructure = /\/([^\/]*?)\/?$/g.exec(workPath);
    var workDir = workRootStructure ? workRootStructure[1] : '';
    userJs.forEach(function (filepath) {
        var pathRegx = new RegExp(workDir + '\/(.*).js$', 'g');
        var pathStructure = pathRegx.exec(filepath.replace(/\\/ig, '/'));
        var filename = pathStructure ? pathStructure[1] : '';
        if (!!~appConfig.pages.indexOf(filename) || inSubPackage(appConfig, filename)) {
            downPositionJs.push(filepath);
        } else if (/app$/g.exec(filename)) {
            downPositionJs.unshift(filepath);
        } else {
            upPositionJs.push(filepath);
        }
    });
    var defaultOptions = {
        uglify: true,
        sourcemaps: false
    };
    _log2.default.emit('record:js', 1);
    var mergedOptions = Object.assign(defaultOptions, options);
    var mergeFilePath = (0, _util.pathJoin)(defaultDeployPath, 'app.js');
    (0, _util.mkdirs)(defaultDeployPath);
    mergeFiles(upPositionJs.concat(downPositionJs), mergeFilePath, appConfig, workPath, options, isLoopEnd);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9wcm9jZXNzLWpzLmpzIl0sIm5hbWVzIjpbInJlbmRlckNvbnRlbnRzIiwicHJvY2Vzc0pzIiwiY29uY2F0U291cmNlTWFwIiwiQ29uY2F0IiwiaW5TdWJQYWNrYWdlIiwiYXBwQ29uZmlnIiwiZmlsZW5hbWUiLCJzdWJQYWNrYWdlcyIsInNvbWUiLCJwYWNrYWdlSXRlbSIsInBhZ2VzIiwic3VicGFnZSIsImZpbGVQYXRoIiwicm9vdCIsImlzU2VsZkV4ZWN1dGVGaWxlIiwiY29uZmlnIiwibWFrZUFsbFBhZ2VzIiwiaW5kZXhPZiIsImV4ZWMiLCJyZWR1Y2UiLCJyZXN1bHRQYWdlcyIsInN1YlBhY2thZ2UiLCJjb25jYXQiLCJtYXAiLCJwYWdlIiwid29ya1BhdGgiLCJtZXJnZUZpbGVQYXRoIiwiaXNGaXJzdCIsIm9yaWdpbkNvbnRlbnQiLCJ3b3JrUm9vdFN0cnVjdHVyZSIsIndvcmtEaXIiLCJwYXRoUmVneCIsIlJlZ0V4cCIsInJlcyIsInBhdGgiLCJyZWxhdGl2ZSIsInF1ZXJ5UGF0aCIsInJlcGxhY2UiLCJzdXBwbGVtZW50Iiwic3RhcnRUcGwiLCJlbmRUcGwiLCJvcmlnaW5GaWxlUGF0aCIsImRpcm5hbWUiLCJmaWxlUmVsYXRpdmVEaXJQYXRoIiwiZmlsZVJlbGF0aXZlUGF0aCIsImJhc2VuYW1lIiwianNDb250ZW50IiwibGluZXMiLCJzcGxpdCIsImxlbmd0aCIsImdlbmVyYXRvciIsIlNvdXJjZU1hcCIsIlNvdXJjZU1hcEdlbmVyYXRvciIsImZpbGUiLCJpIiwibGVuIiwiZ2VuZXJhdGVkTGluZSIsImFkZE1hcHBpbmciLCJnZW5lcmF0ZWQiLCJsaW5lIiwiY29sdW1uIiwic291cmNlIiwib3JpZ2luYWwiLCJuYW1lIiwiYWRkIiwidG9TdHJpbmciLCJtZXJnZUZpbGVzIiwiZmlsZXMiLCJvcHRpb25zIiwiaXNMb29wRW5kIiwic291cmNlbWFwcyIsImFsbENvbnRlbnRzIiwicnVuIiwidWdsaWZ5IiwiZnMiLCJ3cml0ZUZpbGUiLCJlcnIiLCJsb2dFbWl0dGVyIiwiZW1pdCIsImZpbHRlSXRlbSIsInNoaWZ0IiwicmVhZEZpbGUiLCJjb250ZW50IiwiZXJyb3IiLCJkZWZhdWx0RGVwbG95UGF0aCIsImVycm9yQ2FsbGJhY2siLCJleGNsdWRlUGF0aHMiLCJleGNsdWRlUGFja2FnZXMiLCJleGNsdWRlUGFja2FnZSIsImJhc2VXb3JrUGF0aCIsInNvdXJjZVBhdGgiLCJ1c2luZ1BhY2thZ2UiLCJ1c2VySnMiLCJ1cFBvc2l0aW9uSnMiLCJkb3duUG9zaXRpb25KcyIsImZvckVhY2giLCJwYXRoU3RydWN0dXJlIiwiZmlsZXBhdGgiLCJwdXNoIiwidW5zaGlmdCIsImRlZmF1bHRPcHRpb25zIiwibWVyZ2VkT3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFvRGdCQSxjLEdBQUFBLGM7a0JBeUZRQyxTOztBQXpJeEI7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFXQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBQ0EsSUFBTUMsa0JBQWtCLElBQUlDLDhCQUFKLENBQVcsSUFBWCxFQUFpQixRQUFqQixFQUEyQixJQUEzQixDQUF4QixDLENBdkJBOzs7OztBQXdCQSxTQUFTQyxZQUFULENBQXNCQyxTQUF0QixFQUFpQ0MsUUFBakMsRUFBMkM7QUFDdkMsUUFBSUQsVUFBVUUsV0FBZCxFQUEyQjtBQUN2QixlQUFPRixVQUFVRSxXQUFWLENBQXNCQyxJQUF0QixDQUEyQixVQUFVQyxXQUFWLEVBQXVCO0FBQ3JELG1CQUFPQSxZQUFZQyxLQUFaLENBQWtCRixJQUFsQixDQUF1QixVQUFVRyxPQUFWLEVBQW1CO0FBQzdDLG9CQUFJQyxXQUFXSCxZQUFZSSxJQUFaLEdBQW1CLEdBQW5CLEdBQXlCRixPQUF4QztBQUNBLHVCQUFPQyxhQUFhTixRQUFwQjtBQUNILGFBSE0sQ0FBUDtBQUlILFNBTE0sQ0FBUDtBQU1IO0FBQ0QsV0FBTyxLQUFQO0FBQ0g7O0FBRUQsU0FBU1Es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TS9CLFdBQVcwRixnQkFBZ0JBLGNBQWMsQ0FBZCxDQUFoQixHQUFtQyxFQUFwRDtBQUNBLFlBQUksQ0FBQyxDQUFDLENBQUMzRixVQUFVSyxLQUFWLENBQWdCTyxPQUFoQixDQUF3QlgsUUFBeEIsQ0FBSCxJQUF3Q0YsYUFBYUMsU0FBYixFQUF3QkMsUUFBeEIsQ0FBNUMsRUFBK0U7QUFDM0V3RiwyQkFBZUksSUFBZixDQUFvQkQsUUFBcEI7QUFDSCxTQUZELE1BR0ssSUFBSSxRQUFRL0UsSUFBUixDQUFhWixRQUFiLENBQUosRUFBNEI7QUFDN0J3RiwyQkFBZUssT0FBZixDQUF1QkYsUUFBdkI7QUFDSCxTQUZJLE1BR0E7QUFDREoseUJBQWFLLElBQWIsQ0FBa0JELFFBQWxCO0FBQ0g7QUFDSixLQWJEO0FBY0EsUUFBTUcsaUJBQWlCO0FBQ25CM0IsZ0JBQVEsSUFEVztBQUVuQkgsb0JBQVk7QUFGTyxLQUF2QjtBQUlBTyxrQkFBV0MsSUFBWCxDQUFnQixXQUFoQixFQUE2QixDQUE3QjtBQUNBLFFBQU11QixnQkFBZ0JDLE9BQU9DLE1BQVAsQ0FBY0gsY0FBZCxFQUE4QmhDLE9BQTlCLENBQXRCO0FBQ0EsUUFBTTFDLGdCQUFnQixvQkFBUzBELGlCQUFULEVBQTRCLFFBQTVCLENBQXRCO0FBQ0Esc0JBQU9BLGlCQUFQO0FBQ0FsQixlQUFXMkIsYUFBYXZFLE1BQWIsQ0FBb0J3RSxjQUFwQixDQUFYLEVBQWdEcEUsYUFBaEQsRUFBK0RyQixTQUEvRCxFQUEwRW9CLFFBQTFFLEVBQW9GMkMsT0FBcEYsRUFBNkZDLFNBQTdGO0FBQ0giLCJmaWxlIjoicHJvY2Vzcy1qcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGZpbGUg5aSE55CGanPmlofku7ZcbiAqIEBhdXRob3Igemh1eGluMDRcbiAqL1xuaW1wb3J0IHN0cmVhbSBmcm9tICdzdHJlYW0nO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGVqcyBmcm9tICdlanMnO1xuaW1wb3J0IHtcbiAgICBta2RpcnMsXG4gICAgcGF0aEpvaW4sXG4gICAgZGlzcGxheUZpbGVzLFxuICAgIGJhYmVsVHJhbnNmb3JtLFxuICAgIHVnbGlmeVRyYW5zZm9ybSxcbiAgICBiYWJlbFRyYW5zZm9ybVByb2Nlc3Npb24sXG4gICAgdWdsaWZ5VHJhbnNmb3JtUHJvY2Vzc2lvbixcbiAgICBsb2csXG4gICAgZm9ybWF0UGF0aFxufSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IGxvZ0VtaXR0ZXIgZnJvbSAnLi9sb2cnO1xuaW1wb3J0IENvbmNhdCBmcm9tICdjb25jYXQtd2l0aC1zb3VyY2VtYXBzJztcbmltcG9ydCBTb3VyY2VNYXAgZnJvbSAnc291cmNlLW1hcCc7XG5pbXBvcnQgaW5saW5lU291cmNlTWFwQ29tbWVudCBmcm9tICdpbmxpbmUtc291cmNlLW1hcC1jb21tZW50JztcbmNvbnN0IGNvbmNhdFNvdXJjZU1hcCA9IG5ldyBDb25jYXQodHJ1ZSwgJ2FwcC5qcycsICdcXG4nKTtcbmZ1bmN0aW9uIGluU3ViUGFja2FnZShhcHBDb25maWcsIGZpbGVuYW1lKSB7XG4gICAgaWYgKGFwcENvbmZpZy5zdWJQYWNrYWdlcykge1xuICAgICAgICByZXR1cm4gYXBwQ29uZmlnLnN1YlBhY2thZ2VzLnNvbWUoZnVuY3Rpb24gKHBhY2thZ2VJdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFja2FnZUl0ZW0ucGFnZXMuc29tZShmdW5jdGlvbiAoc3VicGFnZSkge1xuICAgICAgICAgICAgICAgIGxldCBmaWxlUGF0aCA9IHBhY2thZ2VJdGVtLnJvb3QgKyAnLycgKyBzdWJwYWdlO1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWxlUGF0aCA9PT0gZmlsZW5hbWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gaXNTZWxmRXhlY3V0ZUZpbGUoY29uZmlnLCBmaWxlbmFtZSkge1xuICAgIGNvbnN0IHBhZ2VzID0gbWFrZUFsbFBhZ2VzKGNvbmZpZyk7XG4gICAgcmV0dXJuICEhfnBhZ2VzLmluZGV4T2YoZmlsZW5hbWUpIHx8IC9hcHAkLy5leGVjKGZpbGVuYW1lKTtcbn1cblxuZnVuY3Rpb24gbWFrZUFsbFBhZ2VzKGNvbmZpZykge1xuICAgIGlmICghY29uZmlnLnN1YlBhY2thZ2VzKSB7XG4gICAgICAgIHJldHVybiBjb25maWcucGFnZXM7XG4gICAgfVxuICAgIHJldHVybiBjb25maWcuc3ViUGFja2FnZXMucmVkdWNlKGZ1bmN0aW9uIChyZXN1bHRQYWdlcywgc3ViUGFja2FnZSkge1xuICAgICAgICByZXR1cm4gcmVzdWx0UGFnZXMuY29uY2F0KHN1YlBhY2thZ2UucGFnZXMubWFwKGZ1bmN0aW9uIChwYWdlKSB7XG4gICAgICAgICAgICByZXR1cm4gc3ViUGFja2FnZS5yb290ICsgJy8nICsgcGFnZTtcbiAgICAgICAgfSkpO1xuICAgIH0sIFtdKS5jb25jYXQoY29uZmlnLnBhZ2VzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckNvbnRlbnRzKGNvbmZpZywgd29ya1BhdGgsIGZpbGVQYXRoLCBtZXJnZUZpbGVQYXRoLCBpc0ZpcnN0LCBvcmlnaW5Db250ZW50KSB7XG4gICAgbGV0IHdvcmtSb290U3RydWN0dXJlID0gL1xcLyhbXlxcL10qPylcXC8/JC9nLmV4ZWMod29ya1BhdGgpO1xuICAgIGxldCB3b3JrRGlyID0gd29ya1Jvb3RTdHJ1Y3R1cmUgPyB3b3JrUm9vdFN0cnVjdHVyZVsxXSA6ICcnO1xuICAgIGxldCBwYXRoUmVneCA9IG5ldyBSZWdFeHAod29ya0RpciArICdcXC8oLio/XFwuanMpJCcsICdnJyk7XG4gICAgbGV0IHJlcyA9IG51bGw7XG4gICAgZmlsZVBhdGggPSBwYXRoLnJlbGF0aXZlKHdvcmtQYXRoLCBmaWxlUGF0aCk7XG4gICAgLy8gd2hpbGUgKHJlcyA9IHBhdGhSZWd4LmV4ZWMoZmlsZVBhdGgpKSB7XG4gICAgLy8gICAgIGZpbGVQYXRoID0gcmVzWzFdO1xuICAgIC8vICAgICBwYXRoUmVneC5sYXN0SW5kZXggPSAwO1xuICAgIC8vIH1cbiAgICBsZXQgcXVlcnlQYXRoID0gZm9ybWF0UGF0aChmaWxlUGF0aC5yZXBsYWNlKC9cXC5qcy8sICcnKSk7XG4gICAgbGV0IHN1cHBsZW1lbnQgPSBpc1NlbGZFeGVjdXRlRmlsZShjb25maWcsIHF1ZXJ5UGF0aClcbiAgICAgICAgPyBgd2luZG93Ll9fc3dhblJvdXRlPScke3F1ZXJ5UGF0aH0nO3JlcXVpcmUoJyR7cXVlcnlQYXRofScpO2BcbiAgICAgICAgOiAnJztcbiAgICBsZXQgc3RhcnRUcGwgPSBgZGVmaW5lKCcke3F1ZXJ5UGF0aH0nLCBmdW5jdGlvbiAocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzLCBkZWZpbmUsIHN3YW4sIGdldEFwcCwgYFxuICAgICAgICArICd3aW5kb3csIGRvY3VtZW50LCBmcmFtZXMsIHNlbGYsIGxvY2F0aW9uLCBuYXZpZ2F0b3IsIGxvY2FsU3RvcmFnZSwgaGlzdG9yeSwgQ2FjaGVzKSB7XFxuJztcbiAgICBsZXQgZW5kVHBsID0gYFxcbn0pO1xcbiR7c3VwcGxlbWVudH1gO1xuICAgIGxldCBvcmlnaW5GaWxlUGF0aCA9IHBhdGguZGlybmFtZShwYXRoSm9pbih3b3JrUGF0aCwgZmlsZVBhdGgpKTtcbiAgICAvLyDmupDmlofku7bnm7jlr7nkuo7nvJbor5HnlJ/miJDmlofku7bnmoTnm7jlr7not6/lirJcbiAgICBsZXQgZmlsZVJlbGF0aXZlRGlyUGF0aCA9IHBhdGgucmVsYXRpdmUocGF0aC5kaXJuYW1lKG1lcmdlRmlsZVBhdGgpLCBvcmlnaW5GaWxlUGF0aCk7XG4gICAgbGV0IGZpbGVSZWxhdGl2ZVBhdGggPSBwYXRoSm9pbihmaWxlUmVsYXRpdmVEaXJQYXRoLCBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKSk7XG4gICAgbGV0IGpzQ29udGVudCA9IHN0YXJ0VHBsICsgb3JpZ2luQ29udGVudCArIGVuZFRwbCArICdcXG4nO1xuICAgIGxldCBsaW5lcyA9IG9yaWdpbkNvbnRlbnQuc3BsaXQoJ1xcbicpLmxlbmd0aDtcbiAgICBsZXQgZ2VuZXJhdG9yID0gbmV3IFNvdXJjZU1hcC5Tb3VyY2VNYXBHZW5lcmF0b3Ioe1xuICAgICAgICBmaWxlOiBgJHtmaWxlUmVsYXRpdmVQYXRofWBcbiAgICB9KTtcbiAgICBmb3IgKGxldCBpID0gMSwgbGVuID0gbGluZXM7IGkgPD0gbGluZXM7IGkrKykge1xuICAgICAgICBsZXQgZ2VuZXJhdGVkTGluZSA9IGkgKyAzO1xuICAgICAgICAhaXNGaXJzdCAmJiAoZ2VuZXJhdGVkTGluZSA9IGkgKyA1KTtcbiAgICAgICAgZ2VuZXJhdG9yLmFkZE1hcHBpbmcoe1xuICAgICAgICAgICAgZ2VuZXJhdGVkOiB7XG4gICAgICAgICAgICAgICAgbGluZTogZ2VuZXJhdGVkTGluZSxcbiAgICAgICAgICAgICAgICBjb2x1bW46IDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzb3VyY2U6IGAke2ZpbGVSZWxhdGl2ZVBhdGh9YCxcbiAgICAgICAgICAgIG9yaWdpbmFsOiB7XG4gICAgICAgICAgICAgICAgbGluZTogaSxcbiAgICAgICAgICAgICAgICBjb2x1bW46IDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuYW1lOiBgJHtmaWxlUmVsYXRpdmVQYXRofWBcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNvbmNhdFNvdXJjZU1hcC5hZGQoZmlsZVJlbGF0aXZlUGF0aCwgb3JpZ2luQ29udGVudCwgZ2VuZXJhdG9yLnRvU3RyaW5nKCkpO1xuICAgIHJldHVybiAganNDb250ZW50O1xufVxuXG5mdW5jdGlvbiBtZXJnZUZpbGVzKGZpbGVzLCBtZXJnZUZpbGVQYXRoLCBjb25maWcsIHdvcmtQYXRoLCBvcHRpb25zLCBpc0xvb3BFbmQpIHtcbiAgICBsZXQgc291cmNlbWFwcyA9IG9wdGlvbnMuc291cmNlbWFwcztcbiAgICBsZXQgYWxsQ29udGVudHMgPSAnJztcbiAgICBmdW5jdGlvbiBydW4oaXNGaXJzdCkge1xuICAgICAgICBpZiAoIWZpbGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMudWdsaWZ5KSB7XG4gICAgICAgICAgICAgICAgYWxsQ29udGVudHMgPSB1Z2xpZnlUcmFuc2Zvcm1Qcm9jZXNzaW9uKGFsbENvbnRlbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNvbnN0IHNvdXJjZU1hcHBpbmcgPSBjb25jYXRTb3VyY2VNYXAuc291cmNlTWFwO1xuICAgICAgICAgICAgLy8gaWYgKHNvdXJjZW1hcHMgPT09ICdpbmxpbmUnKSB7XG4gICAgICAgICAgICAvLyAgICAgYWxsQ29udGVudHMgKz0gaW5saW5lU291cmNlTWFwQ29tbWVudChzb3VyY2VNYXBwaW5nKTtcbiAgICAgICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyAgICAgY29uc3Qgc291cmNlTWFwUGF0aCA9IG1lcmdlRmlsZVBhdGggKyAnLm1hcCc7XG4gICAgICAgICAgICAvLyAgICAgY29uc3Qgd3MgPSBmcy5jcmVhdGVXcml0ZVN0cmVhbShzb3VyY2VNYXBQYXRoKTtcbiAgICAgICAgICAgIC8vICAgICBjb25zdCBwcyA9IG5ldyBzdHJlYW0uUGFzc1Rocm91Z2goKTtcbiAgICAgICAgICAgIC8vICAgICBwcy5wdXNoKHNvdXJjZU1hcHBpbmcpO1xuICAgICAgICAgICAgLy8gICAgIHBzLnBpcGUod3MpO1xuICAgICAgICAgICAgLy8gICAgIGFsbENvbnRlbnRzICs9ICcvLyMgc291cmNlTWFwcGluZ1VSTD1hcHAuanMubWFwJztcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIGZzLndyaXRlRmlsZShtZXJnZUZpbGVQYXRoLCBhbGxDb250ZW50cywgZXJyID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZyhlcnIsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ0VtaXR0ZXIuZW1pdCgnZmluaXNoOmpzJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGZpbHRlSXRlbSA9IGZpbGVzLnNoaWZ0KCk7XG4gICAgICAgIGZzLnJlYWRGaWxlKGZpbHRlSXRlbSwgJ3V0Zi04JywgKGVyciwgY29udGVudCkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb250ZW50ID0gYmFiZWxUcmFuc2Zvcm1Qcm9jZXNzaW9uKGNvbnRlbnQsIGZpbHRlSXRlbSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGxvZyhgLS0tLS0tLS0tLS0tLS0tJHtlcnJvcn0tLS0tLS0tLS0tLS0tLS0tYCwgJ2Vycm9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250ZW50ID0gcmVuZGVyQ29udGVudHMoY29uZmlnLCB3b3JrUGF0aCwgZmlsdGVJdGVtLCBtZXJnZUZpbGVQYXRoLCBpc0ZpcnN0LCBjb250ZW50KTtcbiAgICAgICAgICAgIGFsbENvbnRlbnRzICs9IGNvbnRlbnQ7XG4gICAgICAgICAgICBydW4oZmFsc2UpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcnVuKHRydWUpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBwcm9jZXNzSnMoYXBwQ29uZmlnLCB3b3JrUGF0aCwgZGVmYXVsdERlcGxveVBhdGgsIG9wdGlvbnMsIGVycm9yQ2FsbGJhY2ssIGlzTG9vcEVuZCkge1xuICAgIGNvbnN0IGV4Y2x1ZGVQYXRocyA9IG9wdGlvbnMuZXhjbHVkZVBhY2thZ2VzLm1hcChmdW5jdGlvbiAoZXhjbHVkZVBhY2thZ2UpIHtcbiAgICAgICAgcmV0dXJuIHdvcmtQYXRoICsgZXhjbHVkZVBhY2thZ2UuYmFzZVdvcmtQYXRoICsgJy8nO1xuICAgIH0pO1xuICAgIGNvbnN0IHNvdXJjZVBhdGggPSB3b3JrUGF0aCArIG9wdGlvbnMudXNpbmdQYWNrYWdlLmJhc2VXb3JrUGF0aDtcbiAgICBjb25zdCB1c2VySnMgPSBkaXNwbGF5RmlsZXMoc291cmNlUGF0aCwgLyguKikuanMkLywgW2RlZmF1bHREZXBsb3lQYXRoXSk7XG4gICAgbGV0IHVwUG9zaXRpb25KcyA9IFtdO1xuICAgIGxldCBkb3duUG9zaXRpb25KcyA9IFtdO1xuICAgIGNvbnN0IHdvcmtSb290U3RydWN0dXJlID0gL1xcLyhbXlxcL10qPylcXC8/JC9nLmV4ZWMod29ya1BhdGgpO1xuICAgIGNvbnN0IHdvcmtEaXIgPSB3b3JrUm9vdFN0cnVjdHVyZSA/IHdvcmtSb290U3RydWN0dXJlWzFdIDogJyc7XG4gICAgdXNlckpzLmZvckVhY2goZmlsZXBhdGggPT4ge1xuICAgICAgICBjb25zdCBwYXRoUmVneCA9IG5ldyBSZWdFeHAod29ya0RpciArICdcXC8oLiopLmpzJCcsICdnJyk7XG4gICAgICAgIGNvbnN0IHBhdGhTdHJ1Y3R1cmUgPSBwYXRoUmVneC5leGVjKGZpbGVwYXRoLnJlcGxhY2UoL1xcXFwvaWcsICcvJykpO1xuICAgICAgICBjb25zdCBmaWxlbmFtZSA9IHBhdGhTdHJ1Y3R1cmUgPyBwYXRoU3RydWN0dXJlWzFdIDogJyc7XG4gICAgICAgIGlmICghIX5hcHBDb25maWcucGFnZXMuaW5kZXhPZihmaWxlbmFtZSkgfHwgaW5TdWJQYWNrYWdlKGFwcENvbmZpZywgZmlsZW5hbWUpKSB7XG4gICAgICAgICAgICBkb3duUG9zaXRpb25Kcy5wdXNoKGZpbGVwYXRoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICgvYXBwJC9nLmV4ZWMoZmlsZW5hbWUpKSB7XG4gICAgICAgICAgICBkb3duUG9zaXRpb25Kcy51bnNoaWZ0KGZpbGVwYXRoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHVwUG9zaXRpb25Kcy5wdXNoKGZpbGVwYXRoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGNvbnN0IGRlZmF1bHRPcHRpb25zID0ge1xuICAgICAgICB1Z2xpZnk6IHRydWUsXG4gICAgICAgIHNvdXJjZW1hcHM6IGZhbHNlXG4gICAgfTtcbiAgICBsb2dFbWl0dGVyLmVtaXQoJ3JlY29yZDpqcycsIDEpO1xuICAgIGNvbnN0IG1lcmdlZE9wdGlvbnMgPSBPYmplY3QuYXNzaWduKGRlZmF1bHRPcHRpb25zLCBvcHRpb25zKTtcbiAgICBjb25zdCBtZXJnZUZpbGVQYXRoID0gcGF0aEpvaW4oZGVmYXVsdERlcGxveVBhdGgsICdhcHAuanMnKTtcbiAgICBta2RpcnMoZGVmYXVsdERlcGxveVBhdGgpO1xuICAgIG1lcmdlRmlsZXModXBQb3NpdGlvbkpzLmNvbmNhdChkb3duUG9zaXRpb25KcyksIG1lcmdlRmlsZVBhdGgsIGFwcENvbmZpZywgd29ya1BhdGgsIG9wdGlvbnMsIGlzTG9vcEVuZCk7XG59XG5cbiJdfQ==