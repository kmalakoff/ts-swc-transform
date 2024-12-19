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
    extensions: function() {
        return _extensions.default;
    },
    resolveFileSync: function() {
        return _resolveFileSync.default;
    },
    toPath: function() {
        return _toPath.default;
    },
    transformDirectory: function() {
        return _transformDirectory.default;
    },
    transformFile: function() {
        return _transformFile.default;
    },
    transformSync: function() {
        return _transformSync.default;
    }
});
var _createMatcher = /*#__PURE__*/ _interop_require_default(require("./createMatcher.js"));
var _extensions = /*#__PURE__*/ _interop_require_default(require("./extensions.js"));
var _resolveFileSync = /*#__PURE__*/ _interop_require_default(require("./resolveFileSync.js"));
var _toPath = /*#__PURE__*/ _interop_require_default(require("./toPath.js"));
var _transformFile = /*#__PURE__*/ _interop_require_default(require("./transformFile.js"));
var _transformDirectory = /*#__PURE__*/ _interop_require_default(require("./transformDirectory.js"));
var _transformSync = /*#__PURE__*/ _interop_require_default(require("./transformSync.js"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) {}; module.exports = exports.default; }