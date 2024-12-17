"use strict";
var path = require('path');
var existsSync = require('./existsSync.js');
var lazy = require('../lazy.js');
var major = +process.versions.node.split('.')[0];
var version = major >= 14 ? 'local' : 'lts';
var worker = path.resolve(path.dirname(__dirname), 'workers', "installBinding".concat(path.extname(__filename)));
var call = lazy('node-version-call');
var installDir = path.dirname(path.dirname(path.dirname(require.resolve('@swc/core/package.json'))));
var optionalDependencies = require('@swc/core/package.json').optionalDependencies;
var depKey = "".concat(process.platform, "-").concat(process.arch);
for(var key in optionalDependencies){
    var depPath = path.join(installDir, key);
    if (key.indexOf(depKey) < 0 || existsSync(depPath)) continue;
    try {
        call()({
            version: version,
            callbacks: true
        }, worker, key, optionalDependencies[key]);
    } catch (err) {
        console.log("Failed to install ".concat(key, "@").concat(optionalDependencies[key], ". Error: ").concat(err.message));
    }
}
/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) {}; module.exports = exports.default; }