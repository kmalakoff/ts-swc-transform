"use strict";
function _array_like_to_array(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_without_holes(arr) {
    if (Array.isArray(arr)) return _array_like_to_array(arr);
}
function _iterable_to_array(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}
function _non_iterable_spread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _to_consumable_array(arr) {
    return _array_without_holes(arr) || _iterable_to_array(arr) || _unsupported_iterable_to_array(arr) || _non_iterable_spread();
}
function _unsupported_iterable_to_array(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array(o, minLen);
}
var path = require('path');
var fs = require('fs');
var tmpdir = require('os').tmpdir;
var tempSuffix = require('temp-suffix');
var mkdirp = require('mkdirp');
var Queue = require('queue-cb');
var spawn = require('cross-spawn-cb');
var once = require('call-once-fn');
module.exports = function installBindings(name, version, callback) {
    callback = once(callback);
    try {
        var tmp = path.join(tmpdir(), 'ts-swc-transform', tempSuffix());
        var source = path.join.apply(null, [
            tmp,
            'node_modules'
        ].concat(_to_consumable_array(name.split('/'))));
        var dest = path.join.apply(null, [
            path.dirname(path.dirname(path.dirname(require.resolve('@swc/core/package.json'))))
        ].concat(_to_consumable_array(name.split('/'))));
        var queue = new Queue(1);
        queue.defer(mkdirp.bind(null, tmp));
        queue.defer(fs.writeFile.bind(null, path.join(tmp, 'package.json'), '{}', 'utf8'));
        queue.defer(function(cb) {
            // remove NODE_OPTIONS from ts-dev-stack
            // biome-ignore lint/performance/noDelete: <explanation>
            delete process.env.NODE_OPTIONS;
            spawn('npm', [
                'install',
                "".concat(name, "@").concat(version)
            ], {
                cwd: tmp
            }, cb);
        });
        queue.defer(fs.rename.bind(null, source, dest));
        queue.await(function(err) {
            fs.rm(tmp, {
                recursive: true,
                force: true
            }, function() {
                return callback(err);
            });
        });
    } catch (err) {
        return callback(err);
    }
};
/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) {}; module.exports = exports.default; }