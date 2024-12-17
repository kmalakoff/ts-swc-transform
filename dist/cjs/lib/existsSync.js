"use strict";
var accessSync = require('fs-access-sync-compat');
module.exports = function existsSync(path) {
    try {
        accessSync(path);
        return true;
    } catch (_) {
        return false;
    }
};
/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) {}; module.exports = exports.default; }