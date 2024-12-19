"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return toPath;
    }
});
var _fs = /*#__PURE__*/ _interop_require_default(require("fs"));
var _path = /*#__PURE__*/ _interop_require_default(require("path"));
var _isabsolute = /*#__PURE__*/ _interop_require_default(require("is-absolute"));
var _resolve = /*#__PURE__*/ _interop_require_default(require("resolve"));
var _constants = require("./constants.js");
var _fileURLToPath = /*#__PURE__*/ _interop_require_default(require("./lib/fileURLToPath.js"));
var _processcjs = /*#__PURE__*/ _interop_require_default(require("./lib/process.js"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function getParentPath(context) {
    if (context.parentPath) return _path.default.dirname(context.parentPath);
    return context.parentURL ? _path.default.dirname(toPath(context.parentURL)) : _processcjs.default.cwd();
}
function toPath(specifier, context) {
    if (specifier.startsWith('file:')) return (0, _fileURLToPath.default)(specifier);
    if ((0, _isabsolute.default)(specifier)) return specifier;
    if (specifier[0] === '.') {
        var parentPath = context ? getParentPath(context) : _processcjs.default.cwd();
        return _path.default.resolve(parentPath, specifier);
    }
    if (_constants.moduleRegEx.test(specifier)) {
        var parentPath1 = context ? getParentPath(context) : _processcjs.default.cwd();
        var pkg = null;
        var main = _resolve.default.sync(specifier, {
            basedir: parentPath1,
            extensions: [
                '.js',
                '.json',
                '.node',
                '.mjs'
            ],
            packageFilter: function packageFilter(json, dir) {
                pkg = {
                    json: json,
                    dir: dir
                };
                return json;
            }
        });
        if (!pkg || !pkg.json.module) return main; // no modules, use main
        if (pkg.json.name === specifier) return _path.default.resolve(pkg.dir, pkg.json.module); // the module
        // a relative path. Only accept if it doesn't break the relative naming and it exists
        var modulePath = _path.default.resolve(pkg.dir, pkg.json.module);
        var mainPath = _path.default.resolve(pkg.dir, pkg.json.main);
        var moduleResolved = _path.default.resolve(modulePath, _path.default.relative(mainPath, main));
        return moduleResolved.indexOf(specifier.replace(pkg.json.name, '')) < 0 || !_fs.default.existsSync(moduleResolved) ? main : moduleResolved;
    }
    return specifier;
}
/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) {}; module.exports = exports.default; }