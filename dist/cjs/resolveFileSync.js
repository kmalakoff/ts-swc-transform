"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return resolveFileSync;
    }
});
var _fs = /*#__PURE__*/ _interop_require_default(require("fs"));
var _path = /*#__PURE__*/ _interop_require_default(require("path"));
var _extensions = /*#__PURE__*/ _interop_require_default(require("./extensions.js"));
var _toPath = /*#__PURE__*/ _interop_require_default(require("./lib/toPath.js"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
var moduleRegEx = /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/;
var typeFileRegEx = /^[^.]+\.d\.[cm]?ts$/;
var indexExtensions = _extensions.default.map(function(x) {
    return "index".concat(x);
});
function resolveFileSync(specifier, context) {
    var filePath = (0, _toPath.default)(specifier, context);
    var ext = _path.default.extname(filePath);
    var stats;
    try {
        stats = _fs.default.statSync(filePath);
    } catch (_err) {}
    // biome-ignore lint/complexity/useOptionalChain: <explanation>
    if (stats && stats.isDirectory() || specifier.endsWith('/')) {
        var items = _fs.default.readdirSync(filePath);
        var item = items.find(function(x) {
            return indexExtensions.indexOf(x) >= 0;
        });
        if (item) return _path.default.join(filePath, item);
    } else if (!stats || !ext && !moduleRegEx.test(specifier)) {
        var fileName = _path.default.basename(filePath).replace(/(\.[^/.]+)+$/, '');
        var items1 = _fs.default.readdirSync(_path.default.dirname(filePath));
        var item1 = items1.find(function(x) {
            return x.startsWith(fileName) && !typeFileRegEx.test(x) && _extensions.default.indexOf(_path.default.extname(x)) >= 0;
        });
        if (item1) return _path.default.join(_path.default.dirname(filePath), item1);
    }
    // return what was found
    return stats ? filePath : null;
}
/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) {}; module.exports = exports.default; }