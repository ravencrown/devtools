'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.stringify = exports.parser = undefined;

var _index = require('./domhandler/index');

var _index2 = _interopRequireDefault(_index);

var _index3 = require('./htmlparser/index');

var _index4 = _interopRequireDefault(_index3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @file
 * @author tanghao
 * @date 2018/5/17
 */
var defaultOptions = {
    xmlMode: false,
    lowerCaseAttributeNames: false,
    recognizeSelfClosing: true,
    lowerCaseTags: false
};

var attribsToString = function attribsToString(attribs) {
    return Object.keys(attribs).map(function (key) {
        return key + '="' + attribs[key] + '"';
    }).join(' ');
};

var nodeToString = function nodeToString(name, attribs, content, selfclose) {
    return selfclose ? '<' + name + ' ' + attribs + ' />' : '<' + name + ' ' + attribs + '>' + content + '</' + name + '>';
};

var tplDataTransform = function tplDataTransform(data) {
    return data.replace('{{', '{{{').replace('}}', '}}}');
};

var parser = exports.parser = function parser(swanStr) {
    var handler = new _index2.default();
    new _index4.default(handler, defaultOptions).end(swanStr);
    return handler.dom;
};

var findCustomTpl = function findCustomTpl(swanNode, swanCustomTemplates) {
    if (!swanNode) {
        return;
    }

    var attribs = swanNode.attribs,
        children = swanNode.children,
        name = swanNode.name;


    if (name === 'template' && attribs.name) {
        var templateName = attribs.name;
        var lowerCaseName = templateName.toLowerCase();

        swanCustomTemplates['template-' + lowerCaseName] = {
            name: 'template-' + lowerCaseName,
            originName: templateName
        };
    }

    children && children.forEach(function (node) {
        return findCustomTpl(node, swanCustomTemplates);
    });
};

var generateSwan = function generateSwan(swanNode, customParams, swanCustomTemplates) {
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
            if (name === 'import' || name === 'include') {
                break;
            }

            if (name === 'block') {
                name = 'template';
            }
            if (name === 'template' && attribs) {
                if (attribs.name) {
                    var templateName = attribs.name;
                    var lowerCaseName = templateName.toLowerCase();

                    customParams.swanCustomTemplates.push({
                        name: 'template-' + lowerCaseName,
                        content: children.map(function (node) {
                            return generateSwan(node, customParams, swanCustomTemplates);
                        }).join(''),
                        originName: templateName
                    });
                    break;
                }
                // 编译无法正确处理大括号问题，先去了
                // if (attribs.data) {
                //     // WXML 传入object是两层大括号，san需要三层，做下转换
                //     attribs.data = tplDataTransform(attribs.data);
                // }
                if (attribs.is) {
                    var is = attribs.is;
                    delete attribs.is;
                    var isVariable = /^{{/.exec(is) && /}}$/.exec(is);
                    if (isVariable) {
                        swan = Object.keys(swanCustomTemplates).map(function (key) {
                            var customTemplate = swanCustomTemplates[key];
                            var lowerCaseName = customTemplate.name;
                            var proccessedIs = is.replace(/(^{{)|(}}$)/g, '');
                            var sif = proccessedIs + ' == \'' + customTemplate.originName + '\'';
                            var content = children.map(function (node) {
                                return generateSwan(node, customParams, swanCustomTemplates);
                            }).join('');
                            var attribsStr = 's-if="' + sif + '" ' + attribsToString(attribs);
                            return nodeToString(lowerCaseName, attribsStr, content, selfclose);
                        }).join('');
                    } else {
                        var _lowerCaseName = 'template-' + is.toLowerCase();
                        var _content = children.map(function (node) {
                            return generateSwan(node, customParams, swanCustomTemplates);
                        }).join('');
                        var attribsStr = attribsToString(attribs);
                        return nodeToString(_lowerCaseName, attribsStr, _content, selfclose);
                    }
                    break;
                }
            }

            var content = children.map(function (node) {
                return generateSwan(node, customParams, swanCustomTemplates);
            }).join('');
            swan = nodeToString(name, attribsToString(attribs), content, selfclose);
            break;
        case 'text':
            swan = data;
            break;
    }
    return swan;
};

var stringify = exports.stringify = function stringify(swanNode, customParams) {
    var swanCustomTemplates = {};
    if (Array.isArray(swanNode)) {
        swanNode.forEach(function (node) {
            return findCustomTpl(node, swanCustomTemplates);
        });
        return swanNode.map(function (node) {
            return generateSwan(node, customParams, swanCustomTemplates);
        }).join('');
    } else {
        findCustomTpl(swanNode, swanCustomTemplates);
        return generateSwan(swanNode, customParams, swanCustomTemplates);
    }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zd2FucGFyc2VyL2luZGV4LmpzIl0sIm5hbWVzIjpbImRlZmF1bHRPcHRpb25zIiwieG1sTW9kZSIsImxvd2VyQ2FzZUF0dHJpYnV0ZU5hbWVzIiwicmVjb2duaXplU2VsZkNsb3NpbmciLCJsb3dlckNhc2VUYWdzIiwiYXR0cmlic1RvU3RyaW5nIiwiYXR0cmlicyIsIk9iamVjdCIsImtleXMiLCJtYXAiLCJrZXkiLCJqb2luIiwibm9kZVRvU3RyaW5nIiwibmFtZSIsImNvbnRlbnQiLCJzZWxmY2xvc2UiLCJ0cGxEYXRhVHJhbnNmb3JtIiwiZGF0YSIsInJlcGxhY2UiLCJwYXJzZXIiLCJzd2FuU3RyIiwiaGFuZGxlciIsIkhhbmRsZXIiLCJQYXJzZXIiLCJlbmQiLCJkb20iLCJmaW5kQ3VzdG9tVHBsIiwic3dhbk5vZGUiLCJzd2FuQ3VzdG9tVGVtcGxhdGVzIiwiY2hpbGRyZW4iLCJ0ZW1wbGF0ZU5hbWUiLCJsb3dlckNhc2VOYW1lIiwidG9Mb3dlckNhc2UiLCJvcmlnaW5OYW1lIiwiZm9yRWFjaCIsIm5vZGUiLCJnZW5lcmF0ZVN3YW4iLCJjdXN0b21QYXJhbXMiLCJzd2FuIiwidHlwZSIsInB1c2giLCJpcyIsImlzVmFyaWFibGUiLCJleGVjIiwiY3VzdG9tVGVtcGxhdGUiLCJwcm9jY2Vzc2VkSXMiLCJzaWYiLCJhdHRyaWJzU3RyIiwic3RyaW5naWZ5IiwiQXJyYXkiLCJpc0FycmF5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBS0E7Ozs7QUFDQTs7Ozs7O0FBTkE7Ozs7O0FBUUEsSUFBTUEsaUJBQWlCO0FBQ25CQyxhQUFTLEtBRFU7QUFFbkJDLDZCQUF5QixLQUZOO0FBR25CQywwQkFBc0IsSUFISDtBQUluQkMsbUJBQWU7QUFKSSxDQUF2Qjs7QUFPQSxJQUFNQyxrQkFBa0IsU0FBbEJBLGVBQWtCLENBQVVDLE9BQVYsRUFBbUI7QUFDdkMsV0FBT0MsT0FBT0MsSUFBUCxDQUFZRixPQUFaLEVBQXFCRyxHQUFyQixDQUF5QjtB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LG1CQUFwQixDQUFSO0FBQUEsU0FBakI7QUFDQSxlQUFPRCxTQUFTbEIsR0FBVCxDQUFhO0FBQUEsbUJBQVEyQixhQUFhRCxJQUFiLEVBQW1CRSxZQUFuQixFQUFpQ1QsbUJBQWpDLENBQVI7QUFBQSxTQUFiLEVBQTRFakIsSUFBNUUsQ0FBaUYsRUFBakYsQ0FBUDtBQUNILEtBSEQsTUFHTztBQUNIZSxzQkFBY0MsUUFBZCxFQUF3QkMsbUJBQXhCO0FBQ0EsZUFBT1EsYUFBYVQsUUFBYixFQUF1QlUsWUFBdkIsRUFBcUNULG1CQUFyQyxDQUFQO0FBQ0g7QUFDSixDQVRNIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZVxuICogQGF1dGhvciB0YW5naGFvXG4gKiBAZGF0ZSAyMDE4LzUvMTdcbiAqL1xuaW1wb3J0IEhhbmRsZXIgZnJvbSAnLi9kb21oYW5kbGVyL2luZGV4JztcbmltcG9ydCBQYXJzZXIgZnJvbSAnLi9odG1scGFyc2VyL2luZGV4JztcblxuY29uc3QgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgeG1sTW9kZTogZmFsc2UsXG4gICAgbG93ZXJDYXNlQXR0cmlidXRlTmFtZXM6IGZhbHNlLFxuICAgIHJlY29nbml6ZVNlbGZDbG9zaW5nOiB0cnVlLFxuICAgIGxvd2VyQ2FzZVRhZ3M6IGZhbHNlXG59O1xuXG5jb25zdCBhdHRyaWJzVG9TdHJpbmcgPSBmdW5jdGlvbiAoYXR0cmlicykge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhhdHRyaWJzKS5tYXAoa2V5ID0+IGAke2tleX09XCIke2F0dHJpYnNba2V5XX1cImApLmpvaW4oJyAnKTtcbn07XG5cbmNvbnN0IG5vZGVUb1N0cmluZyA9IGZ1bmN0aW9uIChuYW1lLCBhdHRyaWJzLCBjb250ZW50LCBzZWxmY2xvc2UpIHtcbiAgICByZXR1cm4gc2VsZmNsb3NlXG4gICAgICAgID8gYDwke25hbWV9ICR7YXR0cmlic30gLz5gXG4gICAgICAgIDogYDwke25hbWV9ICR7YXR0cmlic30+JHtjb250ZW50fTwvJHtuYW1lfT5gO1xufTtcblxuY29uc3QgdHBsRGF0YVRyYW5zZm9ybSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgcmV0dXJuIGRhdGEucmVwbGFjZSgne3snLCAne3t7JykucmVwbGFjZSgnfX0nLCAnfX19Jyk7XG59O1xuXG5leHBvcnQgY29uc3QgcGFyc2VyID0gZnVuY3Rpb24gKHN3YW5TdHIpIHtcbiAgICBsZXQgaGFuZGxlciA9IG5ldyBIYW5kbGVyKCk7XG4gICAgbmV3IFBhcnNlcihoYW5kbGVyLCBkZWZhdWx0T3B0aW9ucykuZW5kKHN3YW5TdHIpO1xuICAgIHJldHVybiBoYW5kbGVyLmRvbTtcbn07XG5cbmNvbnN0IGZpbmRDdXN0b21UcGwgPSBmdW5jdGlvbiAoc3dhbk5vZGUsIHN3YW5DdXN0b21UZW1wbGF0ZXMpIHtcbiAgICBpZiAoIXN3YW5Ob2RlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB7YXR0cmlicywgY2hpbGRyZW4sIG5hbWV9ID0gc3dhbk5vZGU7XG5cbiAgICBpZiAobmFtZSA9PT0gJ3RlbXBsYXRlJyAmJiBhdHRyaWJzLm5hbWUpIHtcbiAgICAgICAgY29uc3QgdGVtcGxhdGVOYW1lID0gYXR0cmlicy5uYW1lO1xuICAgICAgICBjb25zdCBsb3dlckNhc2VOYW1lID0gdGVtcGxhdGVOYW1lLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgc3dhbkN1c3RvbVRlbXBsYXRlc1tgdGVtcGxhdGUtJHtsb3dlckNhc2VOYW1lfWBdID0ge1xuICAgICAgICAgICAgbmFtZTogYHRlbXBsYXRlLSR7bG93ZXJDYXNlTmFtZX1gLFxuICAgICAgICAgICAgb3JpZ2luTmFtZTogdGVtcGxhdGVOYW1lXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgY2hpbGRyZW4gJiYgY2hpbGRyZW4uZm9yRWFjaChub2RlID0+IGZpbmRDdXN0b21UcGwobm9kZSwgc3dhbkN1c3RvbVRlbXBsYXRlcykpO1xufTtcblxuY29uc3QgZ2VuZXJhdGVTd2FuID0gZnVuY3Rpb24gKHN3YW5Ob2RlLCBjdXN0b21QYXJhbXMsIHN3YW5DdXN0b21UZW1wbGF0ZXMpIHtcbiAgICBpZiAoIXN3YW5Ob2RlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IHN3YW4gPSAnJztcbiAgICBsZXQge25hbWUsIGF0dHJpYnMsIGNoaWxkcmVuLCBzZWxmY2xvc2UsIHR5cGUsIGRhdGF9ID0gc3dhbk5vZGU7XG5cbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSAndGFnJzpcbiAgICAgICAgICAgIGlmIChuYW1lID09PSAnaW1wb3J0JyB8fCBuYW1lID09PSAnaW5jbHVkZScpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG5hbWUgPT09ICdibG9jaycpIHtcbiAgICAgICAgICAgICAgICBuYW1lID0gJ3RlbXBsYXRlJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChuYW1lID09PSAndGVtcGxhdGUnICYmIGF0dHJpYnMpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXR0cmlicy5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlTmFtZSA9IGF0dHJpYnMubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbG93ZXJDYXNlTmFtZSA9IHRlbXBsYXRlTmFtZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbVBhcmFtcy5zd2FuQ3VzdG9tVGVtcGxhdGVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogYHRlbXBsYXRlLSR7bG93ZXJDYXNlTmFtZX1gLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogY2hpbGRyZW4ubWFwKG5vZGUgPT4gZ2VuZXJhdGVTd2FuKG5vZGUsIGN1c3RvbVBhcmFtcywgc3dhbkN1c3RvbVRlbXBsYXRlcykpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmpvaW4oJycpLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luTmFtZTogdGVtcGxhdGVOYW1lXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8g57yW6K+R5peg5rOV5q2j56Gu5aSE55CG5aSn5ous5Y+36Zeu6aKY77yM5YWI5Y675LqGXG4gICAgICAgICAgICAgICAgLy8gaWYgKGF0dHJpYnMuZGF0YSkge1xuICAgICAgICAgICAgICAgIC8vICAgICAvLyBXWE1MIOS8oOWFpW9iamVjdOaYr+S4pOWxguWkp+aLrOWPt++8jHNhbumcgOimgeS4ieWxgu+8jOWBmuS4i+i9rOaNolxuICAgICAgICAgICAgICAgIC8vICAgICBhdHRyaWJzLmRhdGEgPSB0cGxEYXRhVHJhbnNmb3JtKGF0dHJpYnMuZGF0YSk7XG4gICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgIGlmIChhdHRyaWJzLmlzKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBpcyA9IGF0dHJpYnMuaXM7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBhdHRyaWJzLmlzO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpc1ZhcmlhYmxlID0gL157ey8uZXhlYyhpcykgJiYgL319JC8uZXhlYyhpcyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1ZhcmlhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2FuID0gT2JqZWN0LmtleXMoc3dhbkN1c3RvbVRlbXBsYXRlcykubWFwKGtleSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VzdG9tVGVtcGxhdGUgPSBzd2FuQ3VzdG9tVGVtcGxhdGVzW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGxvd2VyQ2FzZU5hbWUgPSBjdXN0b21UZW1wbGF0ZS5uYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb2NjZXNzZWRJcyA9IGlzLnJlcGxhY2UoLyhee3spfCh9fSQpL2csICcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzaWYgPSBgJHtwcm9jY2Vzc2VkSXN9ID09ICcke2N1c3RvbVRlbXBsYXRlLm9yaWdpbk5hbWV9J2A7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGNoaWxkcmVuLm1hcChub2RlID0+IGdlbmVyYXRlU3dhbihub2RlLCBjdXN0b21QYXJhbXMsIHN3YW5DdXN0b21UZW1wbGF0ZXMpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuam9pbignJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXR0cmlic1N0ciA9IGBzLWlmPVwiJHtzaWZ9XCIgJHthdHRyaWJzVG9TdHJpbmcoYXR0cmlicyl9YDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbm9kZVRvU3RyaW5nKGxvd2VyQ2FzZU5hbWUsIGF0dHJpYnNTdHIsIGNvbnRlbnQsIHNlbGZjbG9zZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5qb2luKCcnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBsb3dlckNhc2VOYW1lID0gYHRlbXBsYXRlLSR7aXMudG9Mb3dlckNhc2UoKX1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGNoaWxkcmVuLm1hcChub2RlID0+IGdlbmVyYXRlU3dhbihub2RlLCBjdXN0b21QYXJhbXMsIHN3YW5DdXN0b21UZW1wbGF0ZXMpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5qb2luKCcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGF0dHJpYnNTdHIgPSBhdHRyaWJzVG9TdHJpbmcoYXR0cmlicyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbm9kZVRvU3RyaW5nKGxvd2VyQ2FzZU5hbWUsIGF0dHJpYnNTdHIsIGNvbnRlbnQsIHNlbGZjbG9zZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gY2hpbGRyZW4ubWFwKG5vZGUgPT4gZ2VuZXJhdGVTd2FuKG5vZGUsIGN1c3RvbVBhcmFtcywgc3dhbkN1c3RvbVRlbXBsYXRlcykpLmpvaW4oJycpO1xuICAgICAgICAgICAgc3dhbiA9IG5vZGVUb1N0cmluZyhuYW1lLCBhdHRyaWJzVG9TdHJpbmcoYXR0cmlicyksIGNvbnRlbnQsIHNlbGZjbG9zZSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAndGV4dCc6XG4gICAgICAgICAgICBzd2FuID0gZGF0YTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gc3dhbjtcbn07XG5cbmV4cG9ydCBjb25zdCBzdHJpbmdpZnkgPSBmdW5jdGlvbiAoc3dhbk5vZGUsIGN1c3RvbVBhcmFtcykge1xuICAgIGxldCBzd2FuQ3VzdG9tVGVtcGxhdGVzID0ge307XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoc3dhbk5vZGUpKSB7XG4gICAgICAgIHN3YW5Ob2RlLmZvckVhY2gobm9kZSA9PiBmaW5kQ3VzdG9tVHBsKG5vZGUsIHN3YW5DdXN0b21UZW1wbGF0ZXMpKTtcbiAgICAgICAgcmV0dXJuIHN3YW5Ob2RlLm1hcChub2RlID0+IGdlbmVyYXRlU3dhbihub2RlLCBjdXN0b21QYXJhbXMsIHN3YW5DdXN0b21UZW1wbGF0ZXMpKS5qb2luKCcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmaW5kQ3VzdG9tVHBsKHN3YW5Ob2RlLCBzd2FuQ3VzdG9tVGVtcGxhdGVzKTtcbiAgICAgICAgcmV0dXJuIGdlbmVyYXRlU3dhbihzd2FuTm9kZSwgY3VzdG9tUGFyYW1zLCBzd2FuQ3VzdG9tVGVtcGxhdGVzKTtcbiAgICB9XG59O1xuIl19