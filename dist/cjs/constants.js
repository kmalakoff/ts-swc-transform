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
    moduleRegEx: function() {
        return moduleRegEx;
    },
    typeFileRegEx: function() {
        return typeFileRegEx;
    }
});
var moduleRegEx = /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/;
var typeFileRegEx = /^[^.]+\.d\.[cm]?ts$/;
/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) {}; module.exports = exports.default; }