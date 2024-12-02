"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, /**
 * @param {string} src The source directory to traverse.
 * @param {string} dest The output directory to write the file to.
 * @param {string} type The type of transform ('esm' or 'cjs').
 * @param {{sourceMaps: boolean}} options Options to pass to swc.
 * @param {(err: Error | null, destFilePath: string) =>} [callback] Optional callback returing the path to the transformed file. Uses promise if callback not provided.
 * @returns {void | Promise<string>} Optional promise returing the path to the transformed file if callback not provided.
 */ "default", {
    enumerable: true,
    get: function() {
        return transformFile;
    }
});
var _fs = /*#__PURE__*/ _interop_require_default(require("fs"));
var _path = /*#__PURE__*/ _interop_require_default(require("path"));
var _calloncefn = /*#__PURE__*/ _interop_require_default(require("call-once-fn"));
var _gettsconfigcompat = /*#__PURE__*/ _interop_require_default(require("get-tsconfig-compat"));
var _mkdirp = /*#__PURE__*/ _interop_require_default(require("mkdirp"));
var _queuecb = /*#__PURE__*/ _interop_require_default(require("queue-cb"));
var _regexDependencies = /*#__PURE__*/ _interop_require_default(require("./lib/regexDependencies.js"));
var _transformSynccjs = /*#__PURE__*/ _interop_require_default(require("./transformSync.js"));
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _object_spread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property(target, key, source[key]);
        });
    }
    return target;
}
var regexESM = (0, _regexDependencies.default)(true);
var regexCJS = (0, _regexDependencies.default)();
var importReplaceMJS = [
    '.js',
    '.ts',
    '.tsx',
    '.mts',
    '.mjs'
];
var importReplaceCJS = [
    '.cts'
];
var requireReplaceJS = [
    '.mjs',
    '.cjs',
    '.ts',
    '.tsx',
    '.mts',
    '.cts'
];
function makeReplacements(code, regex, extensions, extension) {
    var _loop = function() {
        var dependency = match[1] || match[2] || match[3] || match[4];
        var ext = extensions.find(function(x) {
            return dependency.slice(-x.length) === x;
        });
        if (ext) matches.push({
            ext: ext,
            match: match,
            dependency: dependency
        });
        match = regex.exec(code);
    };
    var matches = [];
    var match = regex.exec(code);
    while(match)_loop();
    matches = matches.reverse();
    for(var index in matches){
        var match1 = matches[index];
        var start = match1.match.index + match1.match[0].indexOf(match1.dependency) + match1.dependency.indexOf(match1.ext);
        code = code.substring(0, start) + extension + code.substring(start + match1.ext.length);
    }
    return code;
}
// https://github.com/vercel/next.js/blob/20b63e13ab2631d6043277895d373aa31a1b327c/packages/next/taskfile-swc.js#L118-L125
var interopClientDefaultExport = "/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; }; module.exports = exports.default; } catch (_) {} }";
function transformFileCallback(src, dest, type, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    options = options || {};
    if (typeof src !== 'string') throw new Error('transformFile: unexpected source');
    if (typeof dest !== 'string') throw new Error('transformFile: unexpected destination directory');
    if (typeof type !== 'string') throw new Error('transformFile: unexpected type');
    _fs.default.readFile(src, 'utf8', function(err, contents) {
        if (err) return callback(err);
        callback = (0, _calloncefn.default)(callback);
        try {
            var config = options.confg ? options.confg : _gettsconfigcompat.default.getTsconfig(src);
            // overrides for cjs
            if (type === 'cjs') {
                config = _object_spread({}, config);
                config.config = _object_spread({}, config.config || {});
                config.config.compilerOptions = _object_spread({}, config.config.compilerOptions || {});
                config.config.compilerOptions.module = 'CommonJS';
                config.config.compilerOptions.target = 'ES5';
            }
            var basename = _path.default.basename(src);
            var output = (0, _transformSynccjs.default)(contents, basename, config);
            // infer extension and patch .mjs imports
            var ext = _path.default.extname(basename);
            if (type === 'esm') {
                ext = importReplaceMJS.indexOf(ext) >= 0 ? '.mjs' : ext;
                output.code = makeReplacements(output.code, regexESM, importReplaceMJS, '.mjs');
                ext = importReplaceCJS.indexOf(ext) >= 0 ? '.cjs' : ext;
                output.code = makeReplacements(output.code, regexESM, importReplaceCJS, '.cjs');
            } else {
                ext = requireReplaceJS.indexOf(ext) >= 0 ? '.js' : ext;
                output.code = makeReplacements(output.code, regexCJS, requireReplaceJS, '.js');
                output.code += interopClientDefaultExport;
            }
            var destFilePath = _path.default.join(dest, basename.replace(/\.[^/.]+$/, '') + ext);
            (0, _mkdirp.default)(_path.default.dirname(destFilePath), function() {
                var queue = new _queuecb.default();
                queue.defer(_fs.default.writeFile.bind(null, destFilePath, output.code, 'utf8'));
                !options.sourceMaps || queue.defer(_fs.default.writeFile.bind(null, "".concat(destFilePath, ".map"), output.map, 'utf8'));
                queue.await(function() {
                    return err ? callback(err) : callback(null, destFilePath);
                });
            });
        } catch (err) {
            callback(err);
        }
    });
}
function transformFile(src, dest, type, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = null;
    }
    options = options || {};
    if (typeof callback === 'function') return transformFileCallback(src, dest, type, options, callback);
    return new Promise(function(resolve, reject) {
        transformFileCallback(src, dest, type, options, function compileCallback(err, result) {
            err ? reject(err) : resolve(result);
        });
    });
}
/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; }; module.exports = exports.default; } catch (_) {} }