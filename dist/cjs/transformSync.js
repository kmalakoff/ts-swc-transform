"use strict";
var path = require('path');
var major = +process.versions.node.split('.')[0];
var version = major >= 14 ? 'local' : 'lts';
var worker = path.resolve(__dirname, 'workers', "transformSync".concat(path.extname(__filename)));
var call = null; // break dependencies
/**
 * @param {string} contents The file contents.
 * @param {string} fileName The filename.
 * @returns {{ code: string, map?: string }} Returns object with the transformed code and source map if option sourceMaps was provided.
 */ module.exports = function transformSync(contents, fileName, config) {
    if (!call) call = require('node-version-call'); // break dependencies
    return call(version, worker, contents, fileName, config);
};
/* CJS INTEROP */ if (exports.__esModule && exports.default) { if(typeof exports.default === 'object') Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { if (key !== 'default') exports.default[key] = exports[key]; }; module.exports = exports.default; }