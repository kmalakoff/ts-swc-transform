"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, /**
 * @param {string} src The source directory to traverse.
 * @param {string} dest The output directory to write files to.
 * @param {string} type The type of transform ('esm' or 'cjs').
 * @param {{sourceMaps: boolean}} options Options to pass to swc.
 * @param {(err?: Error) =>} [callback] Optional callback. Uses promise if callback not provided.
 * @returns {void | Promise<any>} Optional promise if callback not provided.
 */ "default", {
    enumerable: true,
    get: function() {
        return transformDirectory;
    }
});
var _path = /*#__PURE__*/ _interop_require_default(require("path"));
var _fsiterator = /*#__PURE__*/ _interop_require_default(require("fs-iterator"));
var _gettsconfigcompat = /*#__PURE__*/ _interop_require_default(require("get-tsconfig-compat"));
var _createMatcher = /*#__PURE__*/ _interop_require_default(require("./createMatcher.js"));
var _transformFile = /*#__PURE__*/ _interop_require_default(require("./transformFile.js"));
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
function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        if (enumerableOnly) {
            symbols = symbols.filter(function(sym) {
                return Object.getOwnPropertyDescriptor(object, sym).enumerable;
            });
        }
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function transformDirectoryCallback(src, dest, type, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    if (typeof src !== 'string') throw new Error('transformDirectory: unexpected source');
    if (typeof dest !== 'string') throw new Error('transformDirectory: unexpected destination directory');
    if (typeof type !== 'string') throw new Error('transformDirectory: unexpected type');
    var cwd = options.cwd || process.cwd();
    var config = options.confg ? options.confg : _gettsconfigcompat.default.getTsconfig(_path.default.resolve(cwd, 'tsconfig.json'));
    var matcher = (0, _createMatcher.default)(config);
    options = _object_spread_props(_object_spread({}, options), {
        config: config
    });
    var iterator = new _fsiterator.default(src);
    iterator.forEach(function(entry, cb) {
        if (!entry.stats.isFile()) return cb();
        if (!matcher(entry.fullPath)) return cb();
        (0, _transformFile.default)(entry.fullPath, _path.default.dirname(_path.default.join(dest, entry.path)), type, options, cb);
    }, {
        callbacks: true,
        concurrency: options.concurrency || 1024
    }, callback);
}
function transformDirectory(src, dest, type, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = null;
    }
    options = options || {};
    if (typeof callback === 'function') return transformDirectoryCallback(src, dest, type, options, callback);
    return new Promise(function(resolve, reject) {
        transformDirectoryCallback(src, dest, type, options, function compileCallback(err, result) {
            err ? reject(err) : resolve(result);
        });
    });
}
/* CJS INTEROP */ if (exports.__esModule && exports.default) { if(typeof exports.default === 'object') Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { if (key !== 'default') exports.default[key] = exports[key]; }; module.exports = exports.default; }