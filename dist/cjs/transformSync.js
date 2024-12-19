"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, /**
 * @param {string} contents The file contents.
 * @param {string} fileName The filename.
 * @returns {{ code: string, map?: string }} Returns object with the transformed code and source map if option sourceMaps was provided.
 */ "default", {
    enumerable: true,
    get: function() {
        return transformSync;
    }
});
var _path = /*#__PURE__*/ _interop_require_default(require("path"));
var _url = /*#__PURE__*/ _interop_require_default(require("url"));
var _process = /*#__PURE__*/ _interop_require_default(require("process"));
var _lazycjs = /*#__PURE__*/ _interop_require_default(require("./lib/lazy.js"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
var major = +_process.default.versions.node.split('.')[0];
var version = major >= 14 ? 'local' : 'lts';
var filename = typeof __filename !== 'undefined' ? __filename : _url.default.fileURLToPath(require("url").pathToFileURL(__filename).toString());
var worker = _path.default.resolve(_path.default.dirname(filename), 'workers', "transformSync".concat(_path.default.extname(filename) === '.mjs' ? '.cjs' : '.js'));
var call = (0, _lazycjs.default)('node-version-call');
function transformSync(contents, fileName, config) {
    return call()(version, worker, contents, fileName, config);
}
/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) {}; module.exports = exports.default; }