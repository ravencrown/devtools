'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getAppConfig = getAppConfig;
exports.getAllPackages = getAllPackages;
exports.formatPath = formatPath;
exports.mkdirs = mkdirs;
exports.displayFiles = displayFiles;
exports.babelTransformProcession = babelTransformProcession;
exports.uglifyTransformProcession = uglifyTransformProcession;
exports.babelTransform = babelTransform;
exports.uglifyTransform = uglifyTransform;
exports.log = log;
exports.compilationProgress = compilationProgress;
/**
 * @file 工具类
 * @author zhuxin04
 */
var path = require('path');
var fs = require('fs');
var babel = require('babel-core');
var stream = require('stream');
var babelEnv = require('babel-preset-env');
var uglifyJS = require('uglify-js');
var transformExportExtensions = require('babel-plugin-transform-export-extensions');
var transformClassProperties = require('babel-plugin-transform-class-properties');
var transformObjectRestSpread = require('babel-plugin-transform-object-rest-spread');
var isAbsolutePath = exports.isAbsolutePath = path.isAbsolute;
var pathJoin = exports.pathJoin = path.join;
var pathResolve = exports.pathResolve = path.resolve;

function getAppConfig(workPath) {
    var appJsonPath = pathJoin(workPath, 'app.json');
    return JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
}

function getAllPackages(appConfig, basePath, workPath, defaultDeployPath, options, errorCallback) {
    var subRoots = [];
    var subPackages = appConfig['subPackages'] || [];
    var subPackagesConfig = subPackages.map(function (subPackage) {
        return {
            packageName: subPackage['root'],
            pagesWholePath: subPackage['pages'].map(function (pagePath) {
                return subPackage['root'] + '/' + pagePath;
            }),
            baseWorkPath: '/' + subPackage['root'],
            deployPath: defaultDeployPath + subPackage['root'],
            pages: subPackage['pages'],
            packageWorkPath: workPath + '/' + subPackage['root']
        };
    });
    var mainPacakgeName = '/';
    var mainPackageConfig = {
        isMain: true,
        packageName: mainPacakgeName,
        pagesWholePath: appConfig['pages'].map(function (pagePath) {
            return mainPacakgeName + '/' + pagePath;
        }),
        baseWorkPath: '',
        deployPath: defaultDeployPath + mainPacakgeName,
        pages: appConfig['pages'],
        packageWorkPath: workPath + '/' + mainPacakgeName
    };
    subPackagesConfig.unshift(mainPackageConfig);
    return subPackagesConfig;
}

function formatPath(pathStr) {
    var reg = /\\/ig;
    return pathStr.replace(reg, '/');
}

function mkdirs(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirs(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}

function displayFiles(path, reg, ignoreSearchPaths) {
    var files = [];
    function walk(walkPath) {
        var dirList = fs.readdirSync(walkPath);
        dirList.forEach(function (item) {
            var itemPath = pathJoin(walkPath, item);
            if (fs.statSync(itemPath).isDirectory()) {
                if (!ignoreSearchPaths || ignoreSearchPaths && !~ignoreSearchPaths.indexOf(itemPath)) {
                    walk(itemPath);
                }
            } else {
                if (reg) {
                    reg.test(itemPath) && files.push(itemPath);
                } else {
                    files.push(itemPath);
                }
            }
        });
    }
    walk(path);
    return files;
}

function babelTransformProcession(contents, filePath) {
    try {
        var babelObj = babel.transform(contents, {
            presets: [babelEnv],
            plugins: [transformExportExtensions, transformClassProperties, [transformObjectRestSpread, { useBuiltIns: true }]]
        });
        return babelObj.code;
    } catch (error) {
        log('-----------------' + filePath + ': ' + error, 'error');
        return contents;
    }
}

function uglifyTransformProcession(contents) {
    try {
        var result = uglifyJS.minify(contents);
        return result.code;
    } catch (error) {
        log(error, 'error');
        return contents;
    }
}

function babelTransform(filePath) {
    return new stream.Transform({
        transform: function transform(chunk, enc, cb) {
            try {
                var babelObj = babel.transform(chunk.toString(), {
                    presets: [babelEnv],
                    plugins: [transformExportExtensions, transformClassProperties, [transformObjectRestSpread, { useBuiltIns: true }]]
                });
                cb(null, babelObj.code);
            } catch (error) {
                log(filePath + ': ' + error, 'error');
                cb(null, null);
            }
        }
    });
}

function uglifyTransform() {
    return new stream.Transform({
        transform: function transform(chunk, enc, cb) {
            try {
                var result = uglifyJS.minify(chunk.toString());
                cb(null, result.code);
            } catch (error) {
                log(error, 'error');
                cb(null, null);
            }
        }
    });
}

function log(value) {
    var level = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'log';

    var method = 'log';
    if (process.send) {
        process.send({ method: method, level: level, value: value });
    } else {
        console.log(value);
    }
}

function compilationProgress(progress) {
    var method = 'compilation';
    if (process.send) {
        process.send({ method: method, progress: progress });
    } else {
        console.info({ method: method, progress: progress });
    }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlsLmpzIl0sIm5hbWVzIjpbImdldEFwcENvbmZpZyIsImdldEFsbFBhY2thZ2VzIiwiZm9ybWF0UGF0aCIsIm1rZGlycyIsImRpc3BsYXlGaWxlcyIsImJhYmVsVHJhbnNmb3JtUHJvY2Vzc2lvbiIsInVnbGlmeVRyYW5zZm9ybVByb2Nlc3Npb24iLCJiYWJlbFRyYW5zZm9ybSIsInVnbGlmeVRyYW5zZm9ybSIsImxvZyIsImNvbXBpbGF0aW9uUHJvZ3Jlc3MiLCJwYXRoIiwicmVxdWlyZSIsImZzIiwiYmFiZWwiLCJzdHJlYW0iLCJiYWJlbEVudiIsInVnbGlmeUpTIiwidHJhbnNmb3JtRXhwb3J0RXh0ZW5zaW9ucyIsInRyYW5zZm9ybUNsYXNzUHJvcGVydGllcyIsInRyYW5zZm9ybU9iamVjdFJlc3RTcHJlYWQiLCJpc0Fic29sdXRlUGF0aCIsImlzQWJzb2x1dGUiLCJwYXRoSm9pbiIsImpvaW4iLCJwYXRoUmVzb2x2ZSIsInJlc29sdmUiLCJ3b3JrUGF0aCIsImFwcEpzb25QYXRoIiwiSlNPTiIsInBhcnNlIiwicmVhZEZpbGVTeW5jIiwiYXBwQ29uZmlnIiwiYmFzZVBhdGgiLCJkZWZhdWx0RGVwbG95UGF0aCIsIm9wdGlvbnMiLCJlcnJvckNhbGxiYWNrIiwic3ViUm9vdHMiLCJzdWJQYWNrYWdlcyIsInN1YlBhY2thZ2VzQ29uZmlnIiwibWFwIiwic3ViUGFja2FnZSIsInBhY2thZ2VOYW1lIiwicGFnZXNXaG9sZVBhdGgiLCJwYWdlUGF0aCIsImJhc2VXb3JrUGF0aCIsImRlcGxveVBhdGgiLCJwYWdlcyIsInBhY2thZ2VXb3JrUGF0aCIsIm1haW5QYWNha2dlTmFtZSIsIm1haW5QYWNrYWdlQ29uZmlnIiwiaXNNYWluIiwidW5zaGlmdCIsInBhdGhTdHIiLCJyZWciLCJyZXBsYWNlIiwiZGlybmFtZSIsImV4aXN0c1N5bmMiLCJta2RpclN5bmMiLCJpZ25vcmVTZWFyY2hQYXRocyIsImZpbGVzIiwid2FsayIsIndhbGtQYXRoIiwiZGlyTGlzdCIsInJlYWRkaXJTeW5jIiwiZm9yRWFjaCIsIml0ZW1QYXRoIiwiaXRlbSIsInN0YXRTeW5jIiwiaXNEaXJlY3RvcnkiLCJpbmRleE9mIiwidGVzdCIsInB1c2giLCJjb250ZW50cyIsImZpbGVQYXRoIiwiYmFiZWxPYmoiLCJ0cmFuc2Zvcm0iLCJwcmVzZXRzIiwicGx1Z2lucyIsInVzZUJ1aWx0SW5zIiwiY29kZSIsImVycm9yIiwicmVzdWx0IiwibWluaWZ5IiwiVHJhbnNmb3JtIiwiY2h1bmsiLCJlbmMiLCJjYiIsInRvU3RyaW5nIiwidmFsdWUiLCJsZXZlbCIsIm1ldGhvZCIsInByb2Nlc3MiLCJzZW5kIiwiY29uc29sZSIsInByb2dyZXNzIiwiaW5mbyJdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFpQmdCQSxZLEdBQUFBLFk7UUFLQUMsYyxHQUFBQSxjO1FBK0JBQyxVLEdBQUFBLFU7UUFLQUMsTSxHQUFBQSxNO1FBV0FDLFksR0FBQUEsWTtRQXVCQUMsd0IsR0FBQUEsd0I7UUFpQkFDLHlCLEdBQUFBLHlCO1FBVUFDLGMsR0FBQUEsYztRQXFCQUMsZSxHQUFBQSxlO1FBY0FDLEcsR0FBQUEsRztRQVNBQyxtQixHQUFBQSxtQjtBQW5LaEI7Ozs7QUFJQSxJQUFNQyxPQUFPQyxRQUFRLE1BQVIsQ0FBYjtBQUNBLElBQU1DLEtBQUtELFFBQVEsSUFBUixDQUFYO0FBQ0EsSUFBTUUsUUFBUUYsUUFBUSxZQUFSLENBQWQ7QUFDQSxJQUFNRyxTQUFTSCxRQUFRLFFBQVIsQ0FBZjtBQUNBLElBQU1JLFdBQVdKLFFBQVEsa0JBQVIsQ0FBakI7QUFDQSxJQUFNSyxXQUFXTCxRQUFRLFdBQVIsQ0FBakI7QUFDQSxJQUFNTSw0QkFBNEJOLFFBQVEsMENBQVIsQ0FBbEM7QUFDQSxJQUFNTywyQkFBMkJQLFFBQVEseUNBQVIsQ0FBakM7QUFDQSxJQUFNUSw0QkFBNEJSLFFBQVEsMkNBQVIsQ0FBbEM7QUFDTyxJQUFNUywwQ0FBaUJWLEtBQUtXLFVBQTVCO0FBQ0EsSUFBTUMsOEJBQVdaLEtBQUth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O0FBQ3RDLFFBQU1DLFNBQVMsS0FBZjtBQUNBLFFBQUlDLFFBQVFDLElBQVosRUFBa0I7QUFDZEQsZ0JBQVFDLElBQVIsQ0FBYSxFQUFDRixjQUFELEVBQVNELFlBQVQsRUFBZ0JELFlBQWhCLEVBQWI7QUFDSCxLQUZELE1BRU87QUFDSEssZ0JBQVFyRixHQUFSLENBQVlnRixLQUFaO0FBQ0g7QUFDSjs7QUFFTSxTQUFTL0UsbUJBQVQsQ0FBNkJxRixRQUE3QixFQUF1QztBQUMxQyxRQUFNSixTQUFTLGFBQWY7QUFDQSxRQUFJQyxRQUFRQyxJQUFaLEVBQWtCO0FBQ2RELGdCQUFRQyxJQUFSLENBQWEsRUFBQ0YsY0FBRCxFQUFTSSxrQkFBVCxFQUFiO0FBQ0gsS0FGRCxNQUVPO0FBQ0hELGdCQUFRRSxJQUFSLENBQWEsRUFBQ0wsY0FBRCxFQUFTSSxrQkFBVCxFQUFiO0FBQ0g7QUFDSiIsImZpbGUiOiJ1dGlsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZSDlt6XlhbfnsbtcbiAqIEBhdXRob3Igemh1eGluMDRcbiAqL1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcbmNvbnN0IGJhYmVsID0gcmVxdWlyZSgnYmFiZWwtY29yZScpO1xuY29uc3Qgc3RyZWFtID0gcmVxdWlyZSgnc3RyZWFtJyk7XG5jb25zdCBiYWJlbEVudiA9IHJlcXVpcmUoJ2JhYmVsLXByZXNldC1lbnYnKTtcbmNvbnN0IHVnbGlmeUpTID0gcmVxdWlyZSgndWdsaWZ5LWpzJyk7XG5jb25zdCB0cmFuc2Zvcm1FeHBvcnRFeHRlbnNpb25zID0gcmVxdWlyZSgnYmFiZWwtcGx1Z2luLXRyYW5zZm9ybS1leHBvcnQtZXh0ZW5zaW9ucycpO1xuY29uc3QgdHJhbnNmb3JtQ2xhc3NQcm9wZXJ0aWVzID0gcmVxdWlyZSgnYmFiZWwtcGx1Z2luLXRyYW5zZm9ybS1jbGFzcy1wcm9wZXJ0aWVzJyk7XG5jb25zdCB0cmFuc2Zvcm1PYmplY3RSZXN0U3ByZWFkID0gcmVxdWlyZSgnYmFiZWwtcGx1Z2luLXRyYW5zZm9ybS1vYmplY3QtcmVzdC1zcHJlYWQnKTtcbmV4cG9ydCBjb25zdCBpc0Fic29sdXRlUGF0aCA9IHBhdGguaXNBYnNvbHV0ZTtcbmV4cG9ydCBjb25zdCBwYXRoSm9pbiA9IHBhdGguam9pbjtcbmV4cG9ydCBjb25zdCBwYXRoUmVzb2x2ZSA9IHBhdGgucmVzb2x2ZTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEFwcENvbmZpZyh3b3JrUGF0aCkge1xuICAgIGNvbnN0IGFwcEpzb25QYXRoID0gcGF0aEpvaW4od29ya1BhdGgsICdhcHAuanNvbicpO1xuICAgIHJldHVybiBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhhcHBKc29uUGF0aCwgJ3V0ZjgnKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGxQYWNrYWdlcyhhcHBDb25maWcsIGJhc2VQYXRoLCB3b3JrUGF0aCwgZGVmYXVsdERlcGxveVBhdGgsIG9wdGlvbnMsIGVycm9yQ2FsbGJhY2spIHtcbiAgICBsZXQgc3ViUm9vdHMgPSBbXTtcbiAgICBjb25zdCBzdWJQYWNrYWdlcyA9IGFwcENvbmZpZ1snc3ViUGFja2FnZXMnXSB8fCBbXTtcbiAgICBjb25zdCBzdWJQYWNrYWdlc0NvbmZpZyA9IHN1YlBhY2thZ2VzLm1hcChmdW5jdGlvbiAoc3ViUGFja2FnZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcGFja2FnZU5hbWU6IHN1YlBhY2thZ2VbJ3Jvb3QnXSxcbiAgICAgICAgICAgIHBhZ2VzV2hvbGVQYXRoOiBzdWJQYWNrYWdlWydwYWdlcyddLm1hcChmdW5jdGlvbiAocGFnZVBhdGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3ViUGFja2FnZVsncm9vdCddICsgJy8nICsgcGFnZVBhdGg7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGJhc2VXb3JrUGF0aDogJy8nICsgc3ViUGFja2FnZVsncm9vdCddLFxuICAgICAgICAgICAgZGVwbG95UGF0aDogZGVmYXVsdERlcGxveVBhdGggKyBzdWJQYWNrYWdlWydyb290J10sXG4gICAgICAgICAgICBwYWdlczogc3ViUGFja2FnZVsncGFnZXMnXSxcbiAgICAgICAgICAgIHBhY2thZ2VXb3JrUGF0aDogd29ya1BhdGggKyAnLycgKyBzdWJQYWNrYWdlWydyb290J11cbiAgICAgICAgfTtcbiAgICB9KTtcbiAgICBjb25zdCBtYWluUGFjYWtnZU5hbWUgPSAnLyc7XG4gICAgY29uc3QgbWFpblBhY2thZ2VDb25maWcgPSB7XG4gICAgICAgIGlzTWFpbjogdHJ1ZSxcbiAgICAgICAgcGFja2FnZU5hbWU6IG1haW5QYWNha2dlTmFtZSxcbiAgICAgICAgcGFnZXNXaG9sZVBhdGg6IGFwcENvbmZpZ1sncGFnZXMnXS5tYXAoZnVuY3Rpb24gKHBhZ2VQYXRoKSB7XG4gICAgICAgICAgICByZXR1cm4gbWFpblBhY2FrZ2VOYW1lICsgJy8nICsgcGFnZVBhdGg7XG4gICAgICAgIH0pLFxuICAgICAgICBiYXNlV29ya1BhdGg6ICcnLFxuICAgICAgICBkZXBsb3lQYXRoOiBkZWZhdWx0RGVwbG95UGF0aCArIG1haW5QYWNha2dlTmFtZSxcbiAgICAgICAgcGFnZXM6IGFwcENvbmZpZ1sncGFnZXMnXSxcbiAgICAgICAgcGFja2FnZVdvcmtQYXRoOiB3b3JrUGF0aCArICcvJyArIG1haW5QYWNha2dlTmFtZVxuICAgIH07XG4gICAgc3ViUGFja2FnZXNDb25maWcudW5zaGlmdChtYWluUGFja2FnZUNvbmZpZyk7XG4gICAgcmV0dXJuIHN1YlBhY2thZ2VzQ29uZmlnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0UGF0aChwYXRoU3RyKSB7XG4gICAgY29uc3QgcmVnID0gL1xcXFwvaWc7XG4gICAgcmV0dXJuIHBhdGhTdHIucmVwbGFjZShyZWcsICcvJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBta2RpcnMoZGlybmFtZSkge1xuICAgIGlmIChmcy5leGlzdHNTeW5jKGRpcm5hbWUpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChta2RpcnMocGF0aC5kaXJuYW1lKGRpcm5hbWUpKSkge1xuICAgICAgICAgICAgZnMubWtkaXJTeW5jKGRpcm5hbWUpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkaXNwbGF5RmlsZXMocGF0aCwgcmVnLCBpZ25vcmVTZWFyY2hQYXRocykge1xuICAgIGxldCBmaWxlcyA9IFtdO1xuICAgIGZ1bmN0aW9uIHdhbGsod2Fsa1BhdGgpIHtcbiAgICAgICAgbGV0IGRpckxpc3QgPSBmcy5yZWFkZGlyU3luYyh3YWxrUGF0aCk7XG4gICAgICAgIGRpckxpc3QuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgICAgICAgIGxldCBpdGVtUGF0aCA9IHBhdGhKb2luKHdhbGtQYXRoLCBpdGVtKTtcbiAgICAgICAgICAgIGlmIChmcy5zdGF0U3luYyhpdGVtUGF0aCkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgIGlmICghaWdub3JlU2VhcmNoUGF0aHMgfHwgKGlnbm9yZVNlYXJjaFBhdGhzICYmICF+aWdub3JlU2VhcmNoUGF0aHMuaW5kZXhPZihpdGVtUGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHdhbGsoaXRlbVBhdGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlZykge1xuICAgICAgICAgICAgICAgICAgICByZWcudGVzdChpdGVtUGF0aCkgJiYgZmlsZXMucHVzaChpdGVtUGF0aCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZXMucHVzaChpdGVtUGF0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgd2FsayhwYXRoKTtcbiAgICByZXR1cm4gZmlsZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiYWJlbFRyYW5zZm9ybVByb2Nlc3Npb24oY29udGVudHMsIGZpbGVQYXRoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgbGV0IGJhYmVsT2JqID0gYmFiZWwudHJhbnNmb3JtKGNvbnRlbnRzLCB7XG4gICAgICAgICAgICBwcmVzZXRzOiBbYmFiZWxFbnZdLFxuICAgICAgICAgICAgcGx1Z2luczogW1xuICAgICAgICAgICAgICAgIHRyYW5zZm9ybUV4cG9ydEV4dGVuc2lvbnMsXG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtQ2xhc3NQcm9wZXJ0aWVzLFxuICAgICAgICAgICAgICAgIFt0cmFuc2Zvcm1PYmplY3RSZXN0U3ByZWFkLCB7dXNlQnVpbHRJbnM6IHRydWV9XVxuICAgICAgICAgICAgXVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGJhYmVsT2JqLmNvZGU7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgbG9nKGAtLS0tLS0tLS0tLS0tLS0tLSR7ZmlsZVBhdGh9OiAke2Vycm9yfWAsICdlcnJvcicpO1xuICAgICAgICByZXR1cm4gY29udGVudHM7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdWdsaWZ5VHJhbnNmb3JtUHJvY2Vzc2lvbihjb250ZW50cykge1xuICAgIHRyeSB7XG4gICAgICAgIGxldCByZXN1bHQgPSB1Z2xpZnlKUy5taW5pZnkoY29udGVudHMpO1xuICAgICAgICByZXR1cm4gcmVzdWx0LmNvZGU7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgbG9nKGVycm9yLCAnZXJyb3InKTtcbiAgICAgICAgcmV0dXJuIGNvbnRlbnRzO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJhYmVsVHJhbnNmb3JtKGZpbGVQYXRoKSB7XG4gICAgcmV0dXJuIG5ldyBzdHJlYW0uVHJhbnNmb3JtKHtcbiAgICAgICAgdHJhbnNmb3JtKGNodW5rLCBlbmMsIGNiKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxldCBiYWJlbE9iaiA9IGJhYmVsLnRyYW5zZm9ybShjaHVuay50b1N0cmluZygpLCB7XG4gICAgICAgICAgICAgICAgICAgIHByZXNldHM6IFtiYWJlbEVudl0sXG4gICAgICAgICAgICAgICAgICAgIHBsdWdpbnM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybUV4cG9ydEV4dGVuc2lvbnMsXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1DbGFzc1Byb3BlcnRpZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICBbdHJhbnNmb3JtT2JqZWN0UmVzdFNwcmVhZCwge3VzZUJ1aWx0SW5zOiB0cnVlfV1cbiAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNiKG51bGwsIGJhYmVsT2JqLmNvZGUpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBsb2coYCR7ZmlsZVBhdGh9OiAke2Vycm9yfWAsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgIGNiKG51bGwsIG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1Z2xpZnlUcmFuc2Zvcm0oKSB7XG4gICAgcmV0dXJuIG5ldyBzdHJlYW0uVHJhbnNmb3JtKHtcbiAgICAgICAgdHJhbnNmb3JtKGNodW5rLCBlbmMsIGNiKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSB1Z2xpZnlKUy5taW5pZnkoY2h1bmsudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgY2IobnVsbCwgcmVzdWx0LmNvZGUpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBsb2coZXJyb3IsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgIGNiKG51bGwsIG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2codmFsdWUsIGxldmVsID0gJ2xvZycpIHtcbiAgICBjb25zdCBtZXRob2QgPSAnbG9nJztcbiAgICBpZiAocHJvY2Vzcy5zZW5kKSB7XG4gICAgICAgIHByb2Nlc3Muc2VuZCh7bWV0aG9kLCBsZXZlbCwgdmFsdWV9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZyh2YWx1ZSk7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsYXRpb25Qcm9ncmVzcyhwcm9ncmVzcykge1xuICAgIGNvbnN0IG1ldGhvZCA9ICdjb21waWxhdGlvbic7XG4gICAgaWYgKHByb2Nlc3Muc2VuZCkge1xuICAgICAgICBwcm9jZXNzLnNlbmQoe21ldGhvZCwgcHJvZ3Jlc3N9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmluZm8oe21ldGhvZCwgcHJvZ3Jlc3N9KTtcbiAgICB9XG59Il19