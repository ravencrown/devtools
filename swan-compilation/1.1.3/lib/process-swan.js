'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.syntaxFilter = syntaxFilter;
exports.proccessImport = proccessImport;
exports.default = processSwan;

var _stream = require('stream');

var _stream2 = _interopRequireDefault(_stream);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _ejs = require('ejs');

var _ejs2 = _interopRequireDefault(_ejs);

var _util = require('./util');

var _index = require('./swanparser/index');

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @file 处理swan文件
 * @author zhuxin04
 */
var babelEnv = require('babel-preset-env');
var babel = require('babel-core');
var uglifyJS = require('uglify-js');
var transformExportExtensions = require('babel-plugin-transform-export-extensions');
var transformClassProperties = require('babel-plugin-transform-class-properties');
var transformObjectRestSpread = require('babel-plugin-transform-object-rest-spread');


function getSWANTemplate(basePath, swanCorePath, useOldPackHtml) {
    var swanTemplatePath = _path2.default.resolve(swanCorePath, 'dist/box/slaves/swan-template.js');
    // if (useOldPackHtml) {
    //     swanTemplatePath = path.resolve(basePath, 'globals/slaves/swanTemplate.js');
    // }
    return new Promise(function (resolve, reject) {
        _fs2.default.readFile(swanTemplatePath, 'utf-8', function (err, content) {
            if (err) {
                reject(err);
            }
            resolve(content);
        });
    });
}

var eventStr = '(capture)?(?:-)?(bind|catch):?(' + 'changing|columnchange|change|getuserinfo|getphonenumber|tap|touchstart|touchmove' + '|touchcancel|touchend|longpress|longtap|transitionend|animationstart|animationiteration|animationend' + '|scrolltoupper|scrolltolower|scroll|load|error|input|focus|blur|submit|reset|confirm|input|play' + '|pause|ended|timeupdate|statechange|netstatus|updatetime|fullscreenchange|error|danmu|linechange' + '|markertap|callouttap|controltap|regionchange|updated|scale|scancode)=(\\\'|\\")(.*?)\\4';
var syntaxMap = [{
    regx: new RegExp(eventStr, 'g'),
    replacer: function replacer() {
        return function (tagStr) {
            var capture = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
            var bind = arguments[2];
            var eventName = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';
            var quota = arguments[4];
            var handlerName = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : '';

            var handlerVariable = /^{{(.*?)}}/g.exec(handlerName);
            if (handlerVariable) {
                handlerName = '' + handlerVariable[1];
            } else {
                handlerName = '\'' + handlerName + '\'';
            }
            return 'on-' + capture + 'bind' + eventName + '="eventHappen(\'' + eventName + '\', $event, ' + (handlerName + ', \'' + capture + '\', \'' + bind + '\')"');
        };
    }
}, {
    regx: /(<[^\>]*)(s-for\s*=\s*[\"\']([^\"\']*?)[\"\'])([^\>]*>)/g,
    replacer: function replacer() {
        return function (tagStr, tagStart, sFor, sForContent, tagEnd) {
            if (/\sin\s/.exec(sForContent)) {
                return tagStr;
            }
            sForContent = sForContent.replace(/(^{{)|}}$/g, '');
            var forItem = /s-for-item\s*=\s*([\"\'])(.*?)\1/g.exec(tagStr);
            var forIndex = /s-for-index\s*=\s*([\"\'])(.*?)\1/g.exec(tagStr);
            forItem = forItem ? forItem[2] : 'item';
            forIndex = forIndex ? forIndex[2] : 'index';
            return tagStart + (' s-for="' + forItem + ', ' + forIndex + ' in ' + sForContent + '"') + tagEnd;
        };
    }
}, {
    regx: /(style=[\"\'])([^\'\"]*?rpx[^\'\"]*?)([\"\'])/g,
    replacer: function replacer() {
        return function (styleAttribute, attrStart, attrContent, attrEnd) {
            var replacedContent = attrContent.replace(/(\d+)rpx/g, function (allValue, valueNumber) {
                return +valueNumber / 7.5 + 'vw';
            });
            return attrStart + replacedContent + attrEnd;
        };
    }
}, {
    regx: /(\n|\r)+/g,
    replacer: function replacer() {
        return ' ';
    }
}, {
    regx: />(\n|\r)*\s*/g,
    replacer: function replacer() {
        return '>';
    }
}];

function generateSwanTemplate(templates) {
    var swanCustomComponentsMapJson = [];
    var swanCustomComponentsCode = templates.map(function (template) {
        var templateVariable = template.name.replace(/-/g, '');
        swanCustomComponentsMapJson.push('\'' + template.name + '\':' + templateVariable);
        return '\n            var ' + templateVariable + ' = san.defineComponent({\n                components: PageComponent.components,\n                template: `<swan-template>' + template.content + '</swan-template>`,\n                inited() {\n                    const setAll = data => {\n                        for (var d in data) {\n                            this.data.set(d, data[d]);\n                        }\n                    };\n                    setAll(this.data.get(\'data\'));\n                    this.watch(\'data\', setAll);\n                },\n                eventHappen(...args) {\n                    this.owner.eventHappen(...args);\n                }\n            });\n        ';
    });
    swanCustomComponentsMapJson = '{' + swanCustomComponentsMapJson.join(',') + '}';
    var swanCustomComponentsCodeJson = swanCustomComponentsCode.join('');
    return {
        swanCustomComponentsCodeJson: swanCustomComponentsCodeJson,
        swanCustomComponentsMapJson: swanCustomComponentsMapJson
    };
}

function syntaxFilter() {
    return function (originContent) {
        var customParams = {
            swanCustomTemplates: []
        };
        var replacedContent = syntaxMap.reduce(function (originContent, currentRep) {
            return originContent.replace(currentRep.regx, currentRep.replacer());
        }, originContent);
        replacedContent = (0, _index.stringify)((0, _index.parser)(replacedContent), customParams);
        var swanCustomComponentsInfo = generateSwanTemplate(customParams.swanCustomTemplates);
        return { replacedContent: replacedContent, swanCustomComponentsInfo: swanCustomComponentsInfo };
    };
}

function wrapBase(basePath, swanCorePath, useOldPackHtml) {
    return function (proccessedContent) {
        var replacedContent = proccessedContent.replacedContent,
            swanCustomComponentsInfo = proccessedContent.swanCustomComponentsInfo;

        return getSWANTemplate(basePath, swanCorePath, useOldPackHtml).then(function (swanTemplateContent) {
            var swanReplaces = Object.assign(swanCustomComponentsInfo, {
                swanContent: replacedContent
            });
            var renderedContent = _ejs2.default.render(swanTemplateContent, swanReplaces);
            return renderedContent;
        });
    };
}

var attribsToString = function attribsToString(attribs) {
    return Object.keys(attribs).map(function (key) {
        return key + '="' + attribs[key] + '"';
    }).join(' ');
};

var nodeToString = function nodeToString(name, attribs, content, selfclose) {
    return selfclose ? '<' + name + ' ' + attribs + ' />' : '<' + name + ' ' + attribs + '>' + content + '</' + name + '>';
};

function generateSwan(swanNode, filePath, quoteType, workPath, cacheImportedPathObj) {
    if (!swanNode) {
        return;
    }
    var swan = '';
    var name = swanNode.name,
        attribs = swanNode.attribs,
        children = swanNode.children,
        selfclose = swanNode.selfclose,
        type = swanNode.type,
        data = swanNode.data;

    switch (type) {
        case 'tag':
            if (name === quoteType || name === quoteType) {
                var src = attribs.src || '';
                var importPath = void 0;
                if (_path2.default.isAbsolute(src)) {
                    importPath = (0, _util.pathJoin)(workPath, src);
                } else {
                    importPath = (0, _util.pathResolve)(_path2.default.dirname(filePath), src);
                }
                // 如果已经import或include的则直接返回空
                if (cacheImportedPathObj[importPath]) {
                    return '';
                }
                if (_fs2.default.existsSync(importPath)) {
                    var importContent = _fs2.default.readFileSync(importPath, 'utf-8');
                    var importNodes = (0, _index.parser)(importContent);
                    swan = importNodes.map(function (node) {
                        return generateSwan(node, importPath, quoteType, workPath, cacheImportedPathObj);
                    }).join('');
                    cacheImportedPathObj[importPath] = swan;
                }
                break;
            }
            var content = children.map(function (node) {
                return generateSwan(node, filePath, quoteType, workPath, cacheImportedPathObj);
            }).join('');
            swan = nodeToString(name, attribsToString(attribs), content, selfclose);
            break;
        case 'comment':
            swan = '<!--' + data + '-->';
            break;
        case 'text':
            swan = data;
            break;
    }
    return swan;
}

function proccessImport(basePath, workPath, filePath, fileContents, importType, options) {
    return new Promise(function (resolve, reject) {
        try {
            var swanNodes = (0, _index.parser)(fileContents);
            var cacheImportedPathObj = {};
            var content = swanNodes.map(function (swanNode) {
                return generateSwan(swanNode, filePath, importType, workPath, cacheImportedPathObj);
            }).join('');
            resolve(content);
        } catch (error) {
            reject(error);
        }
        resolve(fileContents);
    });
}

function renderContents(swanFile, basePath, workPath, customParams, errorCallback, swanCorePath, options, fileContents) {
    return proccessImport(basePath, workPath, swanFile, fileContents, 'import', options).then(function (content) {
        return proccessImport(basePath, workPath, swanFile, content, 'include', options);
    }).then(function (content) {
        (0, _util.log)(swanFile + ':import编译通过');
        return content;
    }).then(syntaxFilter(basePath, swanFile)).then(function (content) {
        (0, _util.log)(swanFile + ':if/for/rpx/template语法编译通过');
        return content;
    }).then(wrapBase(basePath, swanCorePath, options.useOldPackHtml)).then(function (content) {
        (0, _util.log)(swanFile + ':内容套入模板js编译通过');
        return content;
    }).then(function (contents) {
        return contents;
    }).catch(function (err) {
        (0, _util.log)(err, 'error');
    });
}

function compileSwanFile(swanFile, isLast, basePath, defaultDeployPath, workPath, customParams, errorCallback, swanCorePath, options) {
    var packageWorkPath = options.usingPackage.packageWorkPath;

    var readStream = _fs2.default.createReadStream(swanFile, { objectMode: true });
    var fileBaseName = _path2.default.basename(swanFile);
    var relativePath = _path2.default.dirname(_path2.default.relative(packageWorkPath, swanFile));
    var outputPathDir = (0, _util.pathJoin)(defaultDeployPath, relativePath);
    (0, _util.mkdirs)(outputPathDir);
    var outputPath = (0, _util.pathJoin)(outputPathDir, fileBaseName + '.js');
    _fs2.default.readFile(swanFile, { encoding: 'utf8' }, function (err, data) {
        if (err) {
            (0, _util.log)(err, 'error');
        } else {
            renderContents(swanFile, basePath, workPath, customParams, errorCallback, swanCorePath, options, data).then(function (contents) {
                var babelObj = babel.transform(contents, {
                    presets: [babelEnv],
                    plugins: [transformExportExtensions, transformClassProperties, [transformObjectRestSpread, { useBuiltIns: true }]]
                });
                return babelObj.code;
            }).then(function (contents) {
                if (options.uglify) {
                    contents = uglifyJS.minify(contents).code;
                }
                return contents;
            }).then(function (contents) {
                _fs2.default.writeFile(outputPath, contents, function (err) {
                    if (err) {
                        (0, _util.log)(err, 'error');
                    } else {
                        _log2.default.emit('finish:swan');
                    }
                });
            }).catch(function (err) {
                (0, _util.log)(swanFile + ': ' + err, 'error');
            });
        }
    });
}

function processSwan(basePath, workPath, defaultDeployPath, swanCorePath, options, errorCallback, isLoopEnd) {
    var customParams = {
        swanCustomTemplates: [],
        templateContents: {}
    };
    var baseWorkPath = options.usingPackage.baseWorkPath;

    var sourcePath = workPath + baseWorkPath;
    var ignoreSearchPaths = [defaultDeployPath];
    options.excludePackages.map(function (excludePackage) {
        ignoreSearchPaths.push((0, _util.pathJoin)(workPath, excludePackage.baseWorkPath));
    });
    var swanFiles = (0, _util.displayFiles)(sourcePath, /(.*).swan$/, ignoreSearchPaths);
    var swanLen = swanFiles.length;
    _log2.default.emit('record:swan', swanLen);
    if (!swanLen) {
        _log2.default.emit('finish:swan', 0);
    }
    swanFiles.forEach(function (swanFile, index) {
        var isLast = index === swanLen - 1 && isLoopEnd;
        compileSwanFile(swanFile, isLast, basePath, defaultDeployPath, workPath, customParams, errorCallback, swanCorePath, options);
    });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9wcm9jZXNzLXN3YW4uanMiXSwibmFtZXMiOlsic3ludGF4RmlsdGVyIiwicHJvY2Nlc3NJbXBvcnQiLCJwcm9jZXNzU3dhbiIsImJhYmVsRW52IiwicmVxdWlyZSIsImJhYmVsIiwidWdsaWZ5SlMiLCJ0cmFuc2Zvcm1FeHBvcnRFeHRlbnNpb25zIiwidHJhbnNmb3JtQ2xhc3NQcm9wZXJ0aWVzIiwidHJhbnNmb3JtT2JqZWN0UmVzdFNwcmVhZCIsImdldFNXQU5UZW1wbGF0ZSIsImJhc2VQYXRoIiwic3dhbkNvcmVQYXRoIiwidXNlT2xkUGFja0h0bWwiLCJzd2FuVGVtcGxhdGVQYXRoIiwicGF0aCIsInJlc29sdmUiLCJQcm9taXNlIiwicmVqZWN0IiwiZnMiLCJyZWFkRmlsZSIsImVyciIsImNvbnRlbnQiLCJldmVudFN0ciIsInN5bnRheE1hcCIsInJlZ3giLCJSZWdFeHAiLCJyZXBsYWNlciIsInRhZ1N0ciIsImNhcHR1cmUiLCJiaW5kIiwiZXZlbnROYW1lIiwicXVvdGEiLCJoYW5kbGVyTmFtZSIsImhhbmRsZXJWYXJpYWJsZSIsImV4ZWMiLCJ0YWdTdGFydCIsInNGb3IiLCJzRm9yQ29udGVudCIsInRhZ0VuZCIsInJlcGxhY2UiLCJmb3JJdGVtIiwiZm9ySW5kZXgiLCJzdHlsZUF0dHJpYnV0ZSIsImF0dHJTdGFydCIsImF0dHJDb250ZW50IiwiYXR0ckVuZCIsInJlcGxhY2VkQ29udGVudCIsImFsbFZhbHVlIiwidmFsdWVOdW1iZXIiLCJnZW5lcmF0ZVN3YW5UZW1wbGF0ZSIsInRlbXBsYXRlcyIsInN3YW5DdXN0b21Db21wb25lbnRzTWFwSnNvbiIsInN3YW5DdXN0b21Db21wb25lbnRzQ29kZSIsIm1hcCIsInRlbXBsYXRlIiwidGVtcGxhdGVWYXJpYWJsZSIsIm5hbWUiLCJwdXNoIiwiam9pbiIsInN3YW5DdXN0b21Db21wb25lbnRzQ29kZUpzb24iLCJvcmlnaW5Db250ZW50IiwiY3VzdG9tUGFyYW1zIiwic3dhbkN1c3RvbVRlbXBsYXRlcyIsInJlZHVjZSIsImN1cnJlbnRSZXAiLCJzd2FuQ3VzdG9tQ29tcG9uZW50c0luZm8iLCJ3cmFwQmFzZSIsInByb2NjZXNzZWRDb250ZW50IiwidGhlbiIsInN3YW5UZW1wbGF0ZUNvbnRlbnQiLCJzd2FuUmVwbGFjZXMiLCJPYmplY3QiLCJhc3NpZ24iLCJzd2FuQ29udGVudCIsInJlbmRlcmVkQ29udGVudCIsImVqcyIsInJlbmRlciIsImF0dHJpYnNUb1N0cmluZyIsImF0dHJpYnMiLCJrZXlzIiwia2V5Iiwibm9kZVRvU3RyaW5nIiwic2VsZmNsb3NlIiwiZ2VuZXJhdGVTd2FuIiwic3dhbk5vZGUiLCJmaWxlUGF0aCIsInF1b3RlVHlwZSIsIndvcmtQYXRoIiwiY2FjaGVJbXBvcnRlZFBhdGhPYmoiLCJzd2FuIiwiY2hpbGRyZW4iLCJ0eXBlIiwiZGF0YSIsInNyYyIsImltcG9ydFBhdGgiLCJpc0Fic29sdXRlIiwiZGlybmFtZSIsImV4aXN0c1N5bmMiLCJpbXBvcnRDb250ZW50IiwicmVhZEZpbGVTeW5jIiwiaW1wb3J0Tm9kZXMiLCJub2RlIiwiZmlsZUNvbnRlbnRzIiwiaW1wb3J0VHlwZSIsIm9wdGlvbnMiLCJzd2FuTm9kZXMiLCJlcnJvciIsInJlbmRlckNvbnRlbnRzIiwic3dhbkZpbGUiLCJlcnJvckNhbGxiYWNrIiwiY29udGVudHMiLCJjYXRjaCIsImNvbXBpbGVTd2FuRmlsZSIsImlzTGFzdCIsImRlZmF1bHREZXBsb3lQYXRoIiwicGFja2FnZVdvcmtQYXRoIiwidXNpbmdQYWNrYWdlIiwicmVhZFN0cmVhbSIsImNyZWF0ZVJlYWRTdHJlYW0iLCJvYmplY3RNb2RlIiwiZmlsZUJhc2VOYW1lIiwiYmFzZW5hbWUiLCJyZWxhdGl2ZVBhdGgiLCJyZWxhdGl2ZSIsIm91dHB1dFBhdGhEaXIiLCJvdXRwdXRQYXRoIiwiZW5jb2RpbmciLCJiYWJlbE9iaiIsInRyYW5zZm9ybSIsInByZXNldHMiLCJwbHVnaW5zIiwidXNlQnVpbHRJbnMiLCJjb2RlIiwidWdsaWZ5IiwibWluaWZ5Iiwid3JpdGVGaWxlIiwibG9nRW1pdHRlciIsImVtaXQiLCJpc0xvb3BFbmQiLCJ0ZW1wbGF0ZUNvbnRlbnRzIiwiYmFzZVdvcmtQYXRoIiwic291cmNlUGF0aCIsImlnbm9yZVNlYXJjaFBhdGhzIiwiZXhjbHVkZVBhY2thZ2VzIiwiZXhjbHVkZVBhY2thZ2UiLCJzd2FuRmlsZXMiLCJzd2FuTGVuIiwibGVuZ3RoIiwiZm9yRWFjaCIsImluZGV4Il0sIm1hcHBpbmdzIjoiOzs7OztRQTJJZ0JBLFksR0FBQUEsWTtRQXFGQUMsYyxHQUFBQSxjO2tCQTBGUUMsVzs7QUF0VHhCOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBT0E7O0FBVUE7O0FBQ0E7Ozs7OztBQXpCQTs7OztBQVFBLElBQU1DLFdBQVdDLFFBQVEsa0JBQVIsQ0FBakI7QUFDQSxJQUFNQyxRQUFRRCxRQUFRLFlBQVIsQ0FBZDtBQUNBLElBQU1FLFdBQVdGLFFBQVEsV0FBUixDQUFqQjtBQUNBLElBQU1HLDRCQUE0QkgsUUFBUSwwQ0FBUixDQUFsQztBQUNBLElBQU1JLDJCQUEyQkosUUFBUSx5Q0FBUixDQUFqQztBQUNBLElBQU1LLDRCQUE0QkwsUUFBUSwyQ0FBUixDQUFsQzs7O0FBZUEsU0FBU00sZUFBVCxDQUF5QkMsUUFBekIsRUFBbUNDLFlBQW5DLEVBQWlEQyxjQUFqRCxFQUFpRTtBQUM3RCxRQUFJQyxtQkFBbUJDLGVBQUtDLE9BQUwsQ0FBYUosWUFBYixFQUEyQixrQ0FBM0IsQ0FBdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFPLElBQUlLLE9BQUosQ0FBWSxVQUFVRCxPQUFWLEVBQW1CRSxNQUFuQixFQUEyQjtBQUMxQ0MscUJBQUdDLFFBQUgsQ0FBWU4sZ0JBQVosRUFBOEIsT0FBOUIsRUFBdUMsVUFBVU8sR0FBVixFQUFlQyxPQUFmLEVBQXdCO0FBQzNELGdCQUFJRCxHQUFKLEVBQVM7QUFDTEgsdUJBQU9HLEdBQVA7QUFDSDtBQUNETCxvQkFBUU0sT0FBUjtBQUNILFNBTEQ7QUFNSCxLQVBNLENB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QjtBQUNILEtBRkQ7QUFHQSxRQUFNSyxZQUFZLHdCQUFhSixVQUFiLEVBQXlCLFlBQXpCLEVBQXVDQyxpQkFBdkMsQ0FBbEI7QUFDQSxRQUFNSSxVQUFVRCxVQUFVRSxNQUExQjtBQUNBWCxrQkFBV0MsSUFBWCxDQUFnQixhQUFoQixFQUErQlMsT0FBL0I7QUFDQSxRQUFJLENBQUNBLE9BQUwsRUFBYztBQUNWVixzQkFBV0MsSUFBWCxDQUFnQixhQUFoQixFQUErQixDQUEvQjtBQUNIO0FBQ0RRLGNBQVVHLE9BQVYsQ0FBa0IsVUFBQ3hDLFFBQUQsRUFBV3lDLEtBQVgsRUFBcUI7QUFDbkMsWUFBSXBDLFNBQVVvQyxVQUFVSCxVQUFVLENBQXJCLElBQTJCUixTQUF4QztBQUNBMUIsd0JBQWdCSixRQUFoQixFQUEwQkssTUFBMUIsRUFBa0N2RyxRQUFsQyxFQUE0Q3dHLGlCQUE1QyxFQUErRDNCLFFBQS9ELEVBQ0kxQixZQURKLEVBQ2tCZ0QsYUFEbEIsRUFDaUNsRyxZQURqQyxFQUMrQzZGLE9BRC9DO0FBRUgsS0FKRDtBQUtIIiwiZmlsZSI6InByb2Nlc3Mtc3dhbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGZpbGUg5aSE55CGc3dhbuaWh+S7tlxuICogQGF1dGhvciB6aHV4aW4wNFxuICovXG5pbXBvcnQgc3RyZWFtLCB7UmVhZGFibGV9IGZyb20gJ3N0cmVhbSc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZWpzIGZyb20gJ2Vqcyc7XG5jb25zdCBiYWJlbEVudiA9IHJlcXVpcmUoJ2JhYmVsLXByZXNldC1lbnYnKTtcbmNvbnN0IGJhYmVsID0gcmVxdWlyZSgnYmFiZWwtY29yZScpO1xuY29uc3QgdWdsaWZ5SlMgPSByZXF1aXJlKCd1Z2xpZnktanMnKTtcbmNvbnN0IHRyYW5zZm9ybUV4cG9ydEV4dGVuc2lvbnMgPSByZXF1aXJlKCdiYWJlbC1wbHVnaW4tdHJhbnNmb3JtLWV4cG9ydC1leHRlbnNpb25zJyk7XG5jb25zdCB0cmFuc2Zvcm1DbGFzc1Byb3BlcnRpZXMgPSByZXF1aXJlKCdiYWJlbC1wbHVnaW4tdHJhbnNmb3JtLWNsYXNzLXByb3BlcnRpZXMnKTtcbmNvbnN0IHRyYW5zZm9ybU9iamVjdFJlc3RTcHJlYWQgPSByZXF1aXJlKCdiYWJlbC1wbHVnaW4tdHJhbnNmb3JtLW9iamVjdC1yZXN0LXNwcmVhZCcpO1xuaW1wb3J0IHtcbiAgICBta2RpcnMsXG4gICAgcGF0aEpvaW4sXG4gICAgcGF0aFJlc29sdmUsXG4gICAgZGlzcGxheUZpbGVzLFxuICAgIGlzQWJzb2x1dGVQYXRoLFxuICAgIGJhYmVsVHJhbnNmb3JtLFxuICAgIHVnbGlmeVRyYW5zZm9ybSxcbiAgICBsb2dcbn0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7c3RyaW5naWZ5LCBwYXJzZXJ9IGZyb20gJy4vc3dhbnBhcnNlci9pbmRleCc7XG5pbXBvcnQgbG9nRW1pdHRlciBmcm9tICcuL2xvZyc7XG5cblxuZnVuY3Rpb24gZ2V0U1dBTlRlbXBsYXRlKGJhc2VQYXRoLCBzd2FuQ29yZVBhdGgsIHVzZU9sZFBhY2tIdG1sKSB7XG4gICAgbGV0IHN3YW5UZW1wbGF0ZVBhdGggPSBwYXRoLnJlc29sdmUoc3dhbkNvcmVQYXRoLCAnZGlzdC9ib3gvc2xhdmVzL3N3YW4tdGVtcGxhdGUuanMnKTtcbiAgICAvLyBpZiAodXNlT2xkUGFja0h0bWwpIHtcbiAgICAvLyAgICAgc3dhblRlbXBsYXRlUGF0aCA9IHBhdGgucmVzb2x2ZShiYXNlUGF0aCwgJ2dsb2JhbHMvc2xhdmVzL3N3YW5UZW1wbGF0ZS5qcycpO1xuICAgIC8vIH1cbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmcy5yZWFkRmlsZShzd2FuVGVtcGxhdGVQYXRoLCAndXRmLTgnLCBmdW5jdGlvbiAoZXJyLCBjb250ZW50KSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNvbHZlKGNvbnRlbnQpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuY29uc3QgZXZlbnRTdHIgPSAnKGNhcHR1cmUpPyg/Oi0pPyhiaW5kfGNhdGNoKTo/KCdcbiAgICArICdjaGFuZ2luZ3xjb2x1bW5jaGFuZ2V8Y2hhbmdlfGdldHVzZXJpbmZvfGdldHBob25lbnVtYmVyfHRhcHx0b3VjaHN0YXJ0fHRvdWNobW92ZSdcbiAgICArICd8dG91Y2hjYW5jZWx8dG91Y2hlbmR8bG9uZ3ByZXNzfGxvbmd0YXB8dHJhbnNpdGlvbmVuZHxhbmltYXRpb25zdGFydHxhbmltYXRpb25pdGVyYXRpb258YW5pbWF0aW9uZW5kJ1xuICAgICsgJ3xzY3JvbGx0b3VwcGVyfHNjcm9sbHRvbG93ZXJ8c2Nyb2xsfGxvYWR8ZXJyb3J8aW5wdXR8Zm9jdXN8Ymx1cnxzdWJtaXR8cmVzZXR8Y29uZmlybXxpbnB1dHxwbGF5J1xuICAgICsgJ3xwYXVzZXxlbmRlZHx0aW1ldXBkYXRlfHN0YXRlY2hhbmdlfG5ldHN0YXR1c3x1cGRhdGV0aW1lfGZ1bGxzY3JlZW5jaGFuZ2V8ZXJyb3J8ZGFubXV8bGluZWNoYW5nZSdcbiAgICArICd8bWFya2VydGFwfGNhbGxvdXR0YXB8Y29udHJvbHRhcHxyZWdpb25jaGFuZ2V8dXBkYXRlZHxzY2FsZXxzY2FuY29kZSk9KFxcXFxcXCd8XFxcXFwiKSguKj8pXFxcXDQnO1xuY29uc3Qgc3ludGF4TWFwID0gW1xuICAgIHtcbiAgICAgICAgcmVneDogbmV3IFJlZ0V4cChldmVudFN0ciwgJ2cnKSxcbiAgICAgICAgcmVwbGFjZXIoKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHRhZ1N0ciwgY2FwdHVyZSA9ICcnLCBiaW5kLCBldmVudE5hbWUgPSAnJywgcXVvdGEsIGhhbmRsZXJOYW1lID0gJycpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGVyVmFyaWFibGUgPSAvXnt7KC4qPyl9fS9nLmV4ZWMoaGFuZGxlck5hbWUpO1xuICAgICAgICAgICAgICAgIGlmIChoYW5kbGVyVmFyaWFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlck5hbWUgPSBgJHtoYW5kbGVyVmFyaWFibGVbMV19YDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXJOYW1lID0gYCcke2hhbmRsZXJOYW1lfSdgO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYG9uLSR7Y2FwdHVyZX1iaW5kJHtldmVudE5hbWV9PVwiZXZlbnRIYXBwZW4oJyR7ZXZlbnROYW1lfScsICRldmVudCwgYFxuICAgICAgICAgICAgICAgICAgICArIGAke2hhbmRsZXJOYW1lfSwgJyR7Y2FwdHVyZX0nLCAnJHtiaW5kfScpXCJgO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgICByZWd4OiAvKDxbXlxcPl0qKShzLWZvclxccyo9XFxzKltcXFwiXFwnXShbXlxcXCJcXCddKj8pW1xcXCJcXCddKShbXlxcPl0qPikvZyxcbiAgICAgICAgcmVwbGFjZXIoKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHRhZ1N0ciwgdGFnU3RhcnQsIHNGb3IsIHNGb3JDb250ZW50LCB0YWdFbmQpIHtcbiAgICAgICAgICAgICAgICBpZiAoL1xcc2luXFxzLy5leGVjKHNGb3JDb250ZW50KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFnU3RyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzRm9yQ29udGVudCA9IHNGb3JDb250ZW50LnJlcGxhY2UoLyhee3spfH19JC9nLCAnJyk7XG4gICAgICAgICAgICAgICAgbGV0IGZvckl0ZW0gPSAvcy1mb3ItaXRlbVxccyo9XFxzKihbXFxcIlxcJ10pKC4qPylcXDEvZy5leGVjKHRhZ1N0cik7XG4gICAgICAgICAgICAgICAgbGV0IGZvckluZGV4ID0gL3MtZm9yLWluZGV4XFxzKj1cXHMqKFtcXFwiXFwnXSkoLio/KVxcMS9nLmV4ZWModGFnU3RyKTtcbiAgICAgICAgICAgICAgICBmb3JJdGVtID0gZm9ySXRlbSA/IGZvckl0ZW1bMl0gOiAnaXRlbSc7XG4gICAgICAgICAgICAgICAgZm9ySW5kZXggPSBmb3JJbmRleCA/IGZvckluZGV4WzJdIDogJ2luZGV4JztcbiAgICAgICAgICAgICAgICByZXR1cm4gdGFnU3RhcnQgKyBgIHMtZm9yPVwiJHtmb3JJdGVtfSwgJHtmb3JJbmRleH0gaW4gJHtzRm9yQ29udGVudH1cImAgKyB0YWdFbmQ7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICAgIHJlZ3g6IC8oc3R5bGU9W1xcXCJcXCddKShbXlxcJ1xcXCJdKj9ycHhbXlxcJ1xcXCJdKj8pKFtcXFwiXFwnXSkvZyxcbiAgICAgICAgcmVwbGFjZXIoKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHN0eWxlQXR0cmlidXRlLCBhdHRyU3RhcnQsIGF0dHJDb250ZW50LCBhdHRyRW5kKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVwbGFjZWRDb250ZW50ID0gYXR0ckNvbnRlbnQucmVwbGFjZSgvKFxcZCspcnB4L2csIGZ1bmN0aW9uIChhbGxWYWx1ZSwgdmFsdWVOdW1iZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICgoK3ZhbHVlTnVtYmVyKSAvIDcuNSkgKyAndncnO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBhdHRyU3RhcnQgKyByZXBsYWNlZENvbnRlbnQgKyBhdHRyRW5kO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgICByZWd4OiAvKFxcbnxcXHIpKy9nLFxuICAgICAgICByZXBsYWNlcigpIHtcbiAgICAgICAgICAgIHJldHVybiAnICc7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgICAgcmVneDogLz4oXFxufFxccikqXFxzKi9nLFxuICAgICAgICByZXBsYWNlcigpIHtcbiAgICAgICAgICAgIHJldHVybiAnPic7XG4gICAgICAgIH1cbiAgICB9XG5dO1xuXG5mdW5jdGlvbiBnZW5lcmF0ZVN3YW5UZW1wbGF0ZSh0ZW1wbGF0ZXMpIHtcbiAgICBsZXQgc3dhbkN1c3RvbUNvbXBvbmVudHNNYXBKc29uID0gW107XG4gICAgY29uc3Qgc3dhbkN1c3RvbUNvbXBvbmVudHNDb2RlID0gdGVtcGxhdGVzLm1hcChmdW5jdGlvbiAodGVtcGxhdGUpIHtcbiAgICAgICAgY29uc3QgdGVtcGxhdGVWYXJpYWJsZSA9IHRlbXBsYXRlLm5hbWUucmVwbGFjZSgvLS9nLCAnJyk7XG4gICAgICAgIHN3YW5DdXN0b21Db21wb25lbnRzTWFwSnNvbi5wdXNoKGAnJHt0ZW1wbGF0ZS5uYW1lfSc6JHt0ZW1wbGF0ZVZhcmlhYmxlfWApO1xuICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgdmFyICR7dGVtcGxhdGVWYXJpYWJsZX0gPSBzYW4uZGVmaW5lQ29tcG9uZW50KHtcbiAgICAgICAgICAgICAgICBjb21wb25lbnRzOiBQYWdlQ29tcG9uZW50LmNvbXBvbmVudHMsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6IFxcYDxzd2FuLXRlbXBsYXRlPiR7dGVtcGxhdGUuY29udGVudH08L3N3YW4tdGVtcGxhdGU+XFxgLFxuICAgICAgICAgICAgICAgIGluaXRlZCgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2V0QWxsID0gZGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBkIGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGEuc2V0KGQsIGRhdGFbZF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBzZXRBbGwodGhpcy5kYXRhLmdldCgnZGF0YScpKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53YXRjaCgnZGF0YScsIHNldEFsbCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBldmVudEhhcHBlbiguLi5hcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXIuZXZlbnRIYXBwZW4oLi4uYXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIGA7XG4gICAgfSk7XG4gICAgc3dhbkN1c3RvbUNvbXBvbmVudHNNYXBKc29uID0gYHske3N3YW5DdXN0b21Db21wb25lbnRzTWFwSnNvbi5qb2luKCcsJyl9fWA7XG4gICAgY29uc3Qgc3dhbkN1c3RvbUNvbXBvbmVudHNDb2RlSnNvbiA9IHN3YW5DdXN0b21Db21wb25lbnRzQ29kZS5qb2luKCcnKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzd2FuQ3VzdG9tQ29tcG9uZW50c0NvZGVKc29uOiBzd2FuQ3VzdG9tQ29tcG9uZW50c0NvZGVKc29uLFxuICAgICAgICBzd2FuQ3VzdG9tQ29tcG9uZW50c01hcEpzb246IHN3YW5DdXN0b21Db21wb25lbnRzTWFwSnNvblxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzeW50YXhGaWx0ZXIoKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChvcmlnaW5Db250ZW50KSB7XG4gICAgICAgIGNvbnN0IGN1c3RvbVBhcmFtcyA9IHtcbiAgICAgICAgICAgIHN3YW5DdXN0b21UZW1wbGF0ZXM6IFtdXG4gICAgICAgIH07XG4gICAgICAgIGxldCByZXBsYWNlZENvbnRlbnQgPSBzeW50YXhNYXAucmVkdWNlKGZ1bmN0aW9uIChvcmlnaW5Db250ZW50LCBjdXJyZW50UmVwKSB7XG4gICAgICAgICAgICByZXR1cm4gb3JpZ2luQ29udGVudC5yZXBsYWNlKGN1cnJlbnRSZXAucmVneCwgY3VycmVudFJlcC5yZXBsYWNlcigpKTtcbiAgICAgICAgfSwgb3JpZ2luQ29udGVudCk7XG4gICAgICAgIHJlcGxhY2VkQ29udGVudCA9IHN0cmluZ2lmeShwYXJzZXIocmVwbGFjZWRDb250ZW50KSwgY3VzdG9tUGFyYW1zKTtcbiAgICAgICAgY29uc3Qgc3dhbkN1c3RvbUNvbXBvbmVudHNJbmZvID0gZ2VuZXJhdGVTd2FuVGVtcGxhdGUoY3VzdG9tUGFyYW1zLnN3YW5DdXN0b21UZW1wbGF0ZXMpO1xuICAgICAgICByZXR1cm4ge3JlcGxhY2VkQ29udGVudCwgc3dhbkN1c3RvbUNvbXBvbmVudHNJbmZvfTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiB3cmFwQmFzZShiYXNlUGF0aCwgc3dhbkNvcmVQYXRoLCB1c2VPbGRQYWNrSHRtbCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAocHJvY2Nlc3NlZENvbnRlbnQpIHtcbiAgICAgICAgY29uc3Qge3JlcGxhY2VkQ29udGVudCwgc3dhbkN1c3RvbUNvbXBvbmVudHNJbmZvfSA9IHByb2NjZXNzZWRDb250ZW50O1xuICAgICAgICByZXR1cm4gZ2V0U1dBTlRlbXBsYXRlKGJhc2VQYXRoLCBzd2FuQ29yZVBhdGgsIHVzZU9sZFBhY2tIdG1sKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoc3dhblRlbXBsYXRlQ29udGVudCkge1xuICAgICAgICAgICAgY29uc3Qgc3dhblJlcGxhY2VzID0gT2JqZWN0LmFzc2lnbihcbiAgICAgICAgICAgICAgICBzd2FuQ3VzdG9tQ29tcG9uZW50c0luZm8sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBzd2FuQ29udGVudDogcmVwbGFjZWRDb250ZW50XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGNvbnN0IHJlbmRlcmVkQ29udGVudCA9IGVqcy5yZW5kZXIoc3dhblRlbXBsYXRlQ29udGVudCwgc3dhblJlcGxhY2VzKTtcbiAgICAgICAgICAgIHJldHVybiByZW5kZXJlZENvbnRlbnQ7XG4gICAgICAgIH0pO1xuICAgIH07XG59XG5cbmNvbnN0IGF0dHJpYnNUb1N0cmluZyA9IGZ1bmN0aW9uIChhdHRyaWJzKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKGF0dHJpYnMpLm1hcChrZXkgPT4gYCR7a2V5fT1cIiR7YXR0cmlic1trZXldfVwiYCkuam9pbignICcpO1xufTtcblxuY29uc3Qgbm9kZVRvU3RyaW5nID0gZnVuY3Rpb24gKG5hbWUsIGF0dHJpYnMsIGNvbnRlbnQsIHNlbGZjbG9zZSkge1xuICAgIHJldHVybiBzZWxmY2xvc2VcbiAgICAgICAgPyBgPCR7bmFtZX0gJHthdHRyaWJzfSAvPmBcbiAgICAgICAgOiBgPCR7bmFtZX0gJHthdHRyaWJzfT4ke2NvbnRlbnR9PC8ke25hbWV9PmA7XG59O1xuXG5mdW5jdGlvbiBnZW5lcmF0ZVN3YW4oc3dhbk5vZGUsIGZpbGVQYXRoLCBxdW90ZVR5cGUsIHdvcmtQYXRoLCBjYWNoZUltcG9ydGVkUGF0aE9iaikge1xuICAgIGlmICghc3dhbk5vZGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgc3dhbiA9ICcnO1xuICAgIGxldCB7bmFtZSwgYXR0cmlicywgY2hpbGRyZW4sIHNlbGZjbG9zZSwgdHlwZSwgZGF0YX0gPSBzd2FuTm9kZTtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSAndGFnJzpcbiAgICAgICAgICAgIGlmIChuYW1lID09PSBxdW90ZVR5cGUgfHwgbmFtZSA9PT0gcXVvdGVUeXBlKSB7XG4gICAgICAgICAgICAgICAgbGV0IHNyYyA9IGF0dHJpYnMuc3JjIHx8ICcnO1xuICAgICAgICAgICAgICAgIGxldCBpbXBvcnRQYXRoO1xuICAgICAgICAgICAgICAgIGlmIChwYXRoLmlzQWJzb2x1dGUoc3JjKSkge1xuICAgICAgICAgICAgICAgICAgICBpbXBvcnRQYXRoID0gcGF0aEpvaW4od29ya1BhdGgsIHNyYyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW1wb3J0UGF0aCA9IHBhdGhSZXNvbHZlKHBhdGguZGlybmFtZShmaWxlUGF0aCksIHNyYyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIOWmguaenOW3sue7j2ltcG9ydOaIlmluY2x1ZGXnmoTliJnnm7TmjqXov5Tlm57nqbpcbiAgICAgICAgICAgICAgICBpZiAoY2FjaGVJbXBvcnRlZFBhdGhPYmpbaW1wb3J0UGF0aF0pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhpbXBvcnRQYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgaW1wb3J0Q29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhpbXBvcnRQYXRoLCAndXRmLTgnKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGltcG9ydE5vZGVzID0gcGFyc2VyKGltcG9ydENvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICBzd2FuID0gaW1wb3J0Tm9kZXMubWFwKG5vZGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdlbmVyYXRlU3dhbihub2RlLCBpbXBvcnRQYXRoLCBxdW90ZVR5cGUsIHdvcmtQYXRoLCBjYWNoZUltcG9ydGVkUGF0aE9iaik7XG4gICAgICAgICAgICAgICAgICAgIH0pLmpvaW4oJycpO1xuICAgICAgICAgICAgICAgICAgICBjYWNoZUltcG9ydGVkUGF0aE9ialtpbXBvcnRQYXRoXSA9IHN3YW47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGNoaWxkcmVuLm1hcChub2RlID0+IGdlbmVyYXRlU3dhbihub2RlLCBmaWxlUGF0aCwgcXVvdGVUeXBlLFxuICAgICAgICAgICAgICAgIHdvcmtQYXRoLCBjYWNoZUltcG9ydGVkUGF0aE9iaikpLmpvaW4oJycpO1xuICAgICAgICAgICAgc3dhbiA9IG5vZGVUb1N0cmluZyhuYW1lLCBhdHRyaWJzVG9TdHJpbmcoYXR0cmlicyksIGNvbnRlbnQsIHNlbGZjbG9zZSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY29tbWVudCc6XG4gICAgICAgICAgICBzd2FuID0gJzwhLS0nICsgZGF0YSArICctLT4nO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3RleHQnOlxuICAgICAgICAgICAgc3dhbiA9IGRhdGE7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIHN3YW47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm9jY2Vzc0ltcG9ydChiYXNlUGF0aCwgd29ya1BhdGgsIGZpbGVQYXRoLCBmaWxlQ29udGVudHMsIGltcG9ydFR5cGUsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHN3YW5Ob2RlcyA9IHBhcnNlcihmaWxlQ29udGVudHMpO1xuICAgICAgICAgICAgbGV0IGNhY2hlSW1wb3J0ZWRQYXRoT2JqID0ge307XG4gICAgICAgICAgICBsZXQgY29udGVudCA9IHN3YW5Ob2Rlcy5tYXAoc3dhbk5vZGUgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBnZW5lcmF0ZVN3YW4oc3dhbk5vZGUsIGZpbGVQYXRoLCBpbXBvcnRUeXBlLCB3b3JrUGF0aCwgY2FjaGVJbXBvcnRlZFBhdGhPYmopO1xuICAgICAgICAgICAgfSkuam9pbignJyk7XG4gICAgICAgICAgICByZXNvbHZlKGNvbnRlbnQpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgICByZXNvbHZlKGZpbGVDb250ZW50cyk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlckNvbnRlbnRzKHN3YW5GaWxlLCBiYXNlUGF0aCwgd29ya1BhdGgsIGN1c3RvbVBhcmFtcywgZXJyb3JDYWxsYmFjayxcbiAgICBzd2FuQ29yZVBhdGgsIG9wdGlvbnMsIGZpbGVDb250ZW50cykge1xuICAgIHJldHVybiBwcm9jY2Vzc0ltcG9ydChiYXNlUGF0aCwgd29ya1BhdGgsIHN3YW5GaWxlLCBmaWxlQ29udGVudHMsICdpbXBvcnQnLCBvcHRpb25zKVxuICAgICAgICAudGhlbihjb250ZW50ID0+IHtcbiAgICAgICAgICAgIHJldHVybiBwcm9jY2Vzc0ltcG9ydChiYXNlUGF0aCwgd29ya1BhdGgsIHN3YW5GaWxlLCBjb250ZW50LCAnaW5jbHVkZScsIG9wdGlvbnMpO1xuICAgICAgICB9KVxuICAgICAgICAudGhlbihjb250ZW50ID0+IHtcbiAgICAgICAgICAgIGxvZyhzd2FuRmlsZSArICc6aW1wb3J057yW6K+R6YCa6L+HJyk7XG4gICAgICAgICAgICByZXR1cm4gY29udGVudDtcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oc3ludGF4RmlsdGVyKGJhc2VQYXRoLCBzd2FuRmlsZSkpXG4gICAgICAgIC50aGVuKGNvbnRlbnQgPT4ge1xuICAgICAgICAgICAgbG9nKHN3YW5GaWxlICsgJzppZi9mb3IvcnB4L3RlbXBsYXRl6K+t5rOV57yW6K+R6YCa6L+HJyk7XG4gICAgICAgICAgICByZXR1cm4gY29udGVudDtcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4od3JhcEJhc2UoYmFzZVBhdGgsIHN3YW5Db3JlUGF0aCwgb3B0aW9ucy51c2VPbGRQYWNrSHRtbCkpXG4gICAgICAgIC50aGVuKGNvbnRlbnQgPT4ge1xuICAgICAgICAgICAgbG9nKHN3YW5GaWxlICsgJzrlhoXlrrnlpZflhaXmqKHmnb9qc+e8luivkemAmui/hycpO1xuICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKGNvbnRlbnRzID0+IHtcbiAgICAgICAgICAgIHJldHVybiBjb250ZW50cztcbiAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIGxvZyhlcnIsICdlcnJvcicpO1xuICAgICAgICB9KTtcbn1cblxuZnVuY3Rpb24gY29tcGlsZVN3YW5GaWxlKHN3YW5GaWxlLCBpc0xhc3QsIGJhc2VQYXRoLCBkZWZhdWx0RGVwbG95UGF0aCwgd29ya1BhdGgsXG4gICAgY3VzdG9tUGFyYW1zLCBlcnJvckNhbGxiYWNrLCBzd2FuQ29yZVBhdGgsIG9wdGlvbnMpIHtcbiAgICBsZXQge3BhY2thZ2VXb3JrUGF0aH0gPSBvcHRpb25zLnVzaW5nUGFja2FnZTtcbiAgICBsZXQgcmVhZFN0cmVhbSA9IGZzLmNyZWF0ZVJlYWRTdHJlYW0oc3dhbkZpbGUsIHtvYmplY3RNb2RlOiB0cnVlfSk7XG4gICAgbGV0IGZpbGVCYXNlTmFtZSA9IHBhdGguYmFzZW5hbWUoc3dhbkZpbGUpO1xuICAgIGxldCByZWxhdGl2ZVBhdGggPSBwYXRoLmRpcm5hbWUocGF0aC5yZWxhdGl2ZShwYWNrYWdlV29ya1BhdGgsIHN3YW5GaWxlKSk7XG4gICAgbGV0IG91dHB1dFBhdGhEaXIgPSBwYXRoSm9pbihkZWZhdWx0RGVwbG95UGF0aCwgcmVsYXRpdmVQYXRoKTtcbiAgICBta2RpcnMob3V0cHV0UGF0aERpcik7XG4gICAgbGV0IG91dHB1dFBhdGggPSBwYXRoSm9pbihvdXRwdXRQYXRoRGlyLCBgJHtmaWxlQmFzZU5hbWV9LmpzYCk7XG4gICAgZnMucmVhZEZpbGUoc3dhbkZpbGUsIHtlbmNvZGluZzogJ3V0ZjgnfSwgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBsb2coZXJyLCAnZXJyb3InKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlbmRlckNvbnRlbnRzKHN3YW5GaWxlLCBiYXNlUGF0aCwgd29ya1BhdGgsIGN1c3RvbVBhcmFtcywgZXJyb3JDYWxsYmFjayxcbiAgICAgICAgICAgICAgICBzd2FuQ29yZVBhdGgsIG9wdGlvbnMsIGRhdGEpLnRoZW4oY29udGVudHMgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgYmFiZWxPYmogPSBiYWJlbC50cmFuc2Zvcm0oY29udGVudHMsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXNldHM6IFtiYWJlbEVudl0sXG4gICAgICAgICAgICAgICAgICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtRXhwb3J0RXh0ZW5zaW9ucyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1DbGFzc1Byb3BlcnRpZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW3RyYW5zZm9ybU9iamVjdFJlc3RTcHJlYWQsIHt1c2VCdWlsdEluczogdHJ1ZX1dXG4gICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYmFiZWxPYmouY29kZTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC50aGVuKGNvbnRlbnRzID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMudWdsaWZ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50cyA9IHVnbGlmeUpTLm1pbmlmeShjb250ZW50cykuY29kZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudHM7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudGhlbihjb250ZW50cyA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGZzLndyaXRlRmlsZShvdXRwdXRQYXRoLCBjb250ZW50cywgZXJyID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2coZXJyLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nRW1pdHRlci5lbWl0KCdmaW5pc2g6c3dhbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsb2coYCR7c3dhbkZpbGV9OiAke2Vycn1gLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBwcm9jZXNzU3dhbihiYXNlUGF0aCwgd29ya1BhdGgsIGRlZmF1bHREZXBsb3lQYXRoLCBzd2FuQ29yZVBhdGgsIG9wdGlvbnMsXG4gICAgZXJyb3JDYWxsYmFjaywgaXNMb29wRW5kKSB7XG4gICAgbGV0IGN1c3RvbVBhcmFtcyA9IHtcbiAgICAgICAgc3dhbkN1c3RvbVRlbXBsYXRlczogW10sXG4gICAgICAgIHRlbXBsYXRlQ29udGVudHM6IHt9XG4gICAgfTtcbiAgICBjb25zdCB7YmFzZVdvcmtQYXRofSA9IG9wdGlvbnMudXNpbmdQYWNrYWdlO1xuICAgIGNvbnN0IHNvdXJjZVBhdGggPSB3b3JrUGF0aCArIGJhc2VXb3JrUGF0aDtcbiAgICBjb25zdCBpZ25vcmVTZWFyY2hQYXRocyA9IFtkZWZhdWx0RGVwbG95UGF0aF07XG4gICAgb3B0aW9ucy5leGNsdWRlUGFja2FnZXMubWFwKGV4Y2x1ZGVQYWNrYWdlID0+IHtcbiAgICAgICAgaWdub3JlU2VhcmNoUGF0aHMucHVzaChwYXRoSm9pbih3b3JrUGF0aCwgZXhjbHVkZVBhY2thZ2UuYmFzZVdvcmtQYXRoKSk7XG4gICAgfSk7XG4gICAgY29uc3Qgc3dhbkZpbGVzID0gZGlzcGxheUZpbGVzKHNvdXJjZVBhdGgsIC8oLiopLnN3YW4kLywgaWdub3JlU2VhcmNoUGF0aHMpO1xuICAgIGNvbnN0IHN3YW5MZW4gPSBzd2FuRmlsZXMubGVuZ3RoO1xuICAgIGxvZ0VtaXR0ZXIuZW1pdCgncmVjb3JkOnN3YW4nLCBzd2FuTGVuKTtcbiAgICBpZiAoIXN3YW5MZW4pIHtcbiAgICAgICAgbG9nRW1pdHRlci5lbWl0KCdmaW5pc2g6c3dhbicsIDApO1xuICAgIH1cbiAgICBzd2FuRmlsZXMuZm9yRWFjaCgoc3dhbkZpbGUsIGluZGV4KSA9PiB7XG4gICAgICAgIGxldCBpc0xhc3QgPSAoaW5kZXggPT09IHN3YW5MZW4gLSAxKSAmJiBpc0xvb3BFbmQ7XG4gICAgICAgIGNvbXBpbGVTd2FuRmlsZShzd2FuRmlsZSwgaXNMYXN0LCBiYXNlUGF0aCwgZGVmYXVsdERlcGxveVBhdGgsIHdvcmtQYXRoLFxuICAgICAgICAgICAgY3VzdG9tUGFyYW1zLCBlcnJvckNhbGxiYWNrLCBzd2FuQ29yZVBhdGgsIG9wdGlvbnMpO1xuICAgIH0pO1xufSJdfQ==