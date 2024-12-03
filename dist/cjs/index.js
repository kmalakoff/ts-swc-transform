"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    createMatcher: function() {
        return _createMatcher.default;
    },
    transformDirectory: function() {
        return _transformDirectory.default;
    },
    transformFile: function() {
        return _transformFile.default;
    },
    transformSync: function() {
        return _transformSynccjs.default;
    }
});
var _createMatcher = /*#__PURE__*/ _interop_require_default(require("./createMatcher.js"));
var _transformFile = /*#__PURE__*/ _interop_require_default(require("./transformFile.js"));
var _transformDirectory = /*#__PURE__*/ _interop_require_default(require("./transformDirectory.js"));
var _transformSynccjs = /*#__PURE__*/ _interop_require_default(require("./transformSync.js"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) {}; module.exports = exports.default; }