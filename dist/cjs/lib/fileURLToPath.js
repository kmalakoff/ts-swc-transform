"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
var _url = /*#__PURE__*/ _interop_require_default(require("url"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function fileURLToPathPolyfill(fileURL) {
    var path = typeof fileURL === 'string' ? fileURL : fileURL.pathname;
    if (!path.startsWith('file:')) throw new Error('The URL must use the file: protocol');
    return decodeURIComponent(path.substring(7));
}
var _default = _url.default.fileURLToPath || fileURLToPathPolyfill;
/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) {}; module.exports = exports.default; }