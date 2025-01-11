// bail early
var useCJS = !require('module').createRequire;
if (useCJS) {
  module.exports.moduleResolve = function () { return null };
  module.exports.resolve = function () { return null };
  return;
}
'use strict';

var assert = require('assert');
var fs = require('fs');
var process = require('process');
var url = require('url');
var path = require('path');
var module$1 = require('module');
var v8 = require('v8');
var util = require('util');

/**
 * @typedef ErrnoExceptionFields
 * @property {number | undefined} [errnode]
 * @property {string | undefined} [code]
 * @property {string | undefined} [path]
 * @property {string | undefined} [syscall]
 * @property {string | undefined} [url]
 *
 * @typedef {Error & ErrnoExceptionFields} ErrnoException
 */ /**
 * @typedef {(...parameters: Array<any>) => string} MessageFunction
 */ // Manually “tree shaken” from:
// <https://github.com/nodejs/node/blob/45f5c9b/lib/internal/errors.js>
// Last checked on: Nov 2, 2023.
function _type_of$1(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
var own$1 = {}.hasOwnProperty;
var classRegExp = /^([A-Z][a-z\d]*)+$/;
// Sorted by a rough estimate on most frequently used entries.
var kTypes = new Set([
    'string',
    'function',
    'number',
    'object',
    // Accept 'Function' and 'Object' as alternative to the lower cased version.
    'Function',
    'Object',
    'boolean',
    'bigint',
    'symbol'
]);
var codes = {};
/**
 * Create a list string in the form like 'A and B' or 'A, B, ..., and Z'.
 * We cannot use Intl.ListFormat because it's not available in
 * --without-intl builds.
 *
 * @param {Array<string>} array
 *   An array of strings.
 * @param {string} [type]
 *   The list type to be inserted before the last element.
 * @returns {string}
 */ function formatList(array) {
    var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'and';
    return array.length < 3 ? array.join(" ".concat(type, " ")) : "".concat(array.slice(0, -1).join(', '), ", ").concat(type, " ").concat(array[array.length - 1]);
}
/** @type {Map<string, MessageFunction | string>} */ var messages = new Map();
var nodeInternalPrefix = '__node_internal_';
/** @type {number} */ var userStackTraceLimit;
codes.ERR_INVALID_ARG_TYPE = createError('ERR_INVALID_ARG_TYPE', /**
   * @param {string} name
   * @param {Array<string> | string} expected
   * @param {unknown} actual
   */ function(name, expected, actual) {
    assert(typeof name === 'string', "'name' must be a string");
    if (!Array.isArray(expected)) {
        expected = [
            expected
        ];
    }
    var message = 'The ';
    if (name.endsWith(' argument')) {
        // For cases like 'first argument'
        message += "".concat(name, " ");
    } else {
        var type = name.includes('.') ? 'property' : 'argument';
        message += '"'.concat(name, '" ').concat(type, " ");
    }
    message += 'must be ';
    /** @type {Array<string>} */ var types = [];
    /** @type {Array<string>} */ var instances = [];
    /** @type {Array<string>} */ var other = [];
    var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
    try {
        for(var _iterator = expected[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
            var value = _step.value;
            assert(typeof value === 'string', 'All expected entries have to be of type string');
            if (kTypes.has(value)) {
                types.push(value.toLowerCase());
            } else if (classRegExp.exec(value) === null) {
                assert(value !== 'object', 'The value "object" should be written as "Object"');
                other.push(value);
            } else {
                instances.push(value);
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally{
        try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
                _iterator.return();
            }
        } finally{
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
    // Special handle `object` in case other instances are allowed to outline
    // the differences between each other.
    if (instances.length > 0) {
        var pos = types.indexOf('object');
        if (pos !== -1) {
            types.slice(pos, 1);
            instances.push('Object');
        }
    }
    if (types.length > 0) {
        message += "".concat(types.length > 1 ? 'one of type' : 'of type', " ").concat(formatList(types, 'or'));
        if (instances.length > 0 || other.length > 0) message += ' or ';
    }
    if (instances.length > 0) {
        message += "an instance of ".concat(formatList(instances, 'or'));
        if (other.length > 0) message += ' or ';
    }
    if (other.length > 0) {
        if (other.length > 1) {
            message += "one of ".concat(formatList(other, 'or'));
        } else {
            if (other[0].toLowerCase() !== other[0]) message += 'an ';
            message += "".concat(other[0]);
        }
    }
    message += ". Received ".concat(determineSpecificType(actual));
    return message;
}, TypeError);
codes.ERR_INVALID_MODULE_SPECIFIER = createError('ERR_INVALID_MODULE_SPECIFIER', /**
   * @param {string} request
   * @param {string} reason
   * @param {string} [base]
   */ function(request, reason) {
    var base = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
    return 'Invalid module "'.concat(request, '" ').concat(reason).concat(base ? " imported from ".concat(base) : '');
}, TypeError);
codes.ERR_INVALID_PACKAGE_CONFIG = createError('ERR_INVALID_PACKAGE_CONFIG', /**
   * @param {string} path
   * @param {string} [base]
   * @param {string} [message]
   */ function(path, base, message) {
    return "Invalid package config ".concat(path).concat(base ? " while importing ".concat(base) : '').concat(message ? ". ".concat(message) : '');
}, Error);
codes.ERR_INVALID_PACKAGE_TARGET = createError('ERR_INVALID_PACKAGE_TARGET', /**
   * @param {string} packagePath
   * @param {string} key
   * @param {unknown} target
   * @param {boolean} [isImport=false]
   * @param {string} [base]
   */ function(packagePath, key, target) {
    var isImport = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false, base = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : undefined;
    var relatedError = typeof target === 'string' && !isImport && target.length > 0 && !target.startsWith('./');
    if (key === '.') {
        assert(isImport === false);
        return 'Invalid "exports" main target '.concat(JSON.stringify(target), " defined ") + "in the package config ".concat(packagePath, "package.json").concat(base ? " imported from ".concat(base) : '').concat(relatedError ? '; targets must start with "./"' : '');
    }
    return 'Invalid "'.concat(isImport ? 'imports' : 'exports', '" target ').concat(JSON.stringify(target), " defined for '").concat(key, "' in the package config ").concat(packagePath, "package.json").concat(base ? " imported from ".concat(base) : '').concat(relatedError ? '; targets must start with "./"' : '');
}, Error);
codes.ERR_MODULE_NOT_FOUND = createError('ERR_MODULE_NOT_FOUND', /**
   * @param {string} path
   * @param {string} base
   * @param {boolean} [exactUrl]
   */ function(path, base) {
    var exactUrl = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    return "Cannot find ".concat(exactUrl ? 'module' : 'package', " '").concat(path, "' imported from ").concat(base);
}, Error);
codes.ERR_NETWORK_IMPORT_DISALLOWED = createError('ERR_NETWORK_IMPORT_DISALLOWED', "import of '%s' by %s is not supported: %s", Error);
codes.ERR_PACKAGE_IMPORT_NOT_DEFINED = createError('ERR_PACKAGE_IMPORT_NOT_DEFINED', /**
   * @param {string} specifier
   * @param {string} packagePath
   * @param {string} base
   */ function(specifier, packagePath, base) {
    return 'Package import specifier "'.concat(specifier, '" is not defined').concat(packagePath ? " in package ".concat(packagePath, "package.json") : '', " imported from ").concat(base);
}, TypeError);
codes.ERR_PACKAGE_PATH_NOT_EXPORTED = createError('ERR_PACKAGE_PATH_NOT_EXPORTED', /**
   * @param {string} packagePath
   * @param {string} subpath
   * @param {string} [base]
   */ function(packagePath, subpath) {
    var base = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
    if (subpath === '.') return 'No "exports" main defined in '.concat(packagePath, "package.json").concat(base ? " imported from ".concat(base) : '');
    return "Package subpath '".concat(subpath, '\' is not defined by "exports" in ').concat(packagePath, "package.json").concat(base ? " imported from ".concat(base) : '');
}, Error);
codes.ERR_UNSUPPORTED_DIR_IMPORT = createError('ERR_UNSUPPORTED_DIR_IMPORT', "Directory import '%s' is not supported " + 'resolving ES modules imported from %s', Error);
codes.ERR_UNSUPPORTED_RESOLVE_REQUEST = createError('ERR_UNSUPPORTED_RESOLVE_REQUEST', 'Failed to resolve module specifier "%s" from "%s": Invalid relative URL or base scheme is not hierarchical.', TypeError);
codes.ERR_UNKNOWN_FILE_EXTENSION = createError('ERR_UNKNOWN_FILE_EXTENSION', /**
   * @param {string} extension
   * @param {string} path
   */ function(extension, path) {
    return 'Unknown file extension "'.concat(extension, '" for ').concat(path);
}, TypeError);
codes.ERR_INVALID_ARG_VALUE = createError('ERR_INVALID_ARG_VALUE', /**
   * @param {string} name
   * @param {unknown} value
   * @param {string} [reason='is invalid']
   */ function(name, value) {
    var reason = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'is invalid';
    var inspected = util.inspect(value);
    if (inspected.length > 128) {
        inspected = "".concat(inspected.slice(0, 128), "...");
    }
    var type = name.includes('.') ? 'property' : 'argument';
    return "The ".concat(type, " '").concat(name, "' ").concat(reason, ". Received ").concat(inspected);
}, TypeError);
/**
 * Utility function for registering the error codes. Only used here. Exported
 * *only* to allow for testing.
 * @param {string} sym
 * @param {MessageFunction | string} value
 * @param {ErrorConstructor} constructor
 * @returns {new (...parameters: Array<any>) => Error}
 */ function createError(sym, value, constructor) {
    // Special case for SystemError that formats the error message differently
    // The SystemErrors only have SystemError as their base classes.
    messages.set(sym, value);
    return makeNodeErrorWithCode(constructor, sym);
}
/**
 * @param {ErrorConstructor} Base
 * @param {string} key
 * @returns {ErrorConstructor}
 */ function makeNodeErrorWithCode(Base, key) {
    // @ts-expect-error It’s a Node error.
    return NodeError;
    /**
   * @param {Array<unknown>} parameters
   */ function NodeError() {
        for(var _len = arguments.length, parameters = new Array(_len), _key = 0; _key < _len; _key++){
            parameters[_key] = arguments[_key];
        }
        var limit = Error.stackTraceLimit;
        if (isErrorStackTraceLimitWritable()) Error.stackTraceLimit = 0;
        var error = new Base();
        // Reset the limit and setting the name property.
        if (isErrorStackTraceLimitWritable()) Error.stackTraceLimit = limit;
        var message = getMessage(key, parameters, error);
        Object.defineProperties(error, {
            // Note: no need to implement `kIsNodeError` symbol, would be hard,
            // probably.
            message: {
                value: message,
                enumerable: false,
                writable: true,
                configurable: true
            },
            toString: {
                /** @this {Error} */ value: function value() {
                    return "".concat(this.name, " [").concat(key, "]: ").concat(this.message);
                },
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        captureLargerStackTrace(error);
        // @ts-expect-error It’s a Node error.
        error.code = key;
        return error;
    }
}
/**
 * @returns {boolean}
 */ function isErrorStackTraceLimitWritable() {
    // Do no touch Error.stackTraceLimit as V8 would attempt to install
    // it again during deserialization.
    try {
        if (v8.startupSnapshot.isBuildingSnapshot()) {
            return false;
        }
    } catch (e) {}
    var desc = Object.getOwnPropertyDescriptor(Error, 'stackTraceLimit');
    if (desc === undefined) {
        return Object.isExtensible(Error);
    }
    return own$1.call(desc, 'writable') && desc.writable !== undefined ? desc.writable : desc.set !== undefined;
}
/**
 * This function removes unnecessary frames from Node.js core errors.
 * @template {(...parameters: unknown[]) => unknown} T
 * @param {T} wrappedFunction
 * @returns {T}
 */ function hideStackFrames(wrappedFunction) {
    // We rename the functions that will be hidden to cut off the stacktrace
    // at the outermost one
    var hidden = nodeInternalPrefix + wrappedFunction.name;
    Object.defineProperty(wrappedFunction, 'name', {
        value: hidden
    });
    return wrappedFunction;
}
var captureLargerStackTrace = hideStackFrames(/**
   * @param {Error} error
   * @returns {Error}
   */ // @ts-expect-error: fine
function(error) {
    var stackTraceLimitIsWritable = isErrorStackTraceLimitWritable();
    if (stackTraceLimitIsWritable) {
        userStackTraceLimit = Error.stackTraceLimit;
        Error.stackTraceLimit = Number.POSITIVE_INFINITY;
    }
    Error.captureStackTrace(error);
    // Reset the limit
    if (stackTraceLimitIsWritable) Error.stackTraceLimit = userStackTraceLimit;
    return error;
});
/**
 * @param {string} key
 * @param {Array<unknown>} parameters
 * @param {Error} self
 * @returns {string}
 */ function getMessage(key, parameters, self) {
    var message = messages.get(key);
    assert(message !== undefined, 'expected `message` to be found');
    if (typeof message === 'function') {
        assert(message.length <= parameters.length, "Code: ".concat(key, "; The provided arguments length (").concat(parameters.length, ") does not ") + "match the required ones (".concat(message.length, ")."));
        return Reflect.apply(message, self, parameters);
    }
    var regex = /%[dfijoOs]/g;
    var expectedLength = 0;
    while(regex.exec(message) !== null)expectedLength++;
    assert(expectedLength === parameters.length, "Code: ".concat(key, "; The provided arguments length (").concat(parameters.length, ") does not ") + "match the required ones (".concat(expectedLength, ")."));
    if (parameters.length === 0) return message;
    parameters.unshift(message);
    return Reflect.apply(util.format, null, parameters);
}
/**
 * Determine the specific type of a value for type-mismatch errors.
 * @param {unknown} value
 * @returns {string}
 */ function determineSpecificType(value) {
    if (value === null || value === undefined) {
        return String(value);
    }
    if (typeof value === 'function' && value.name) {
        return "function ".concat(value.name);
    }
    if ((typeof value === "undefined" ? "undefined" : _type_of$1(value)) === 'object') {
        if (value.constructor && value.constructor.name) {
            return "an instance of ".concat(value.constructor.name);
        }
        return "".concat(util.inspect(value, {
            depth: -1
        }));
    }
    var inspected = util.inspect(value, {
        colors: false
    });
    if (inspected.length > 28) {
        inspected = "".concat(inspected.slice(0, 25), "...");
    }
    return "type ".concat(typeof value === "undefined" ? "undefined" : _type_of$1(value), " (").concat(inspected, ")");
}

// Manually “tree shaken” from:
// <https://github.com/nodejs/node/blob/7c3dce0/lib/internal/modules/package_json_reader.js>
// Last checked on: Apr 29, 2023.
// Removed the native dependency.
// Also: no need to cache, we do that in resolve already.
var hasOwnProperty$1 = {}.hasOwnProperty;
var ERR_INVALID_PACKAGE_CONFIG$1 = codes.ERR_INVALID_PACKAGE_CONFIG;
/** @type {Map<string, PackageConfig>} */ var cache = new Map();
/**
 * @param {string} jsonPath
 * @param {{specifier: URL | string, base?: URL}} options
 * @returns {PackageConfig}
 */ function read(jsonPath, param) {
    var base = param.base, specifier = param.specifier;
    var existing = cache.get(jsonPath);
    if (existing) {
        return existing;
    }
    /** @type {string | undefined} */ var string;
    try {
        string = fs.readFileSync(path.toNamespacedPath(jsonPath), 'utf8');
    } catch (error) {
        var exception = /** @type {ErrnoException} */ error;
        if (exception.code !== 'ENOENT') {
            throw exception;
        }
    }
    /** @type {PackageConfig} */ var result = {
        exists: false,
        pjsonPath: jsonPath,
        main: undefined,
        name: undefined,
        type: 'none',
        exports: undefined,
        imports: undefined
    };
    if (string !== undefined) {
        /** @type {Record<string, unknown>} */ var parsed;
        try {
            parsed = JSON.parse(string);
        } catch (error_) {
            var cause = /** @type {ErrnoException} */ error_;
            var _$error = new ERR_INVALID_PACKAGE_CONFIG$1(jsonPath, (base ? '"'.concat(specifier, '" from ') : '') + url.fileURLToPath(base || specifier), cause.message);
            _$error.cause = cause;
            throw _$error;
        }
        result.exists = true;
        if (hasOwnProperty$1.call(parsed, 'name') && typeof parsed.name === 'string') {
            result.name = parsed.name;
        }
        if (hasOwnProperty$1.call(parsed, 'main') && typeof parsed.main === 'string') {
            result.main = parsed.main;
        }
        if (hasOwnProperty$1.call(parsed, 'exports')) {
            // @ts-expect-error: assume valid.
            result.exports = parsed.exports;
        }
        if (hasOwnProperty$1.call(parsed, 'imports')) {
            // @ts-expect-error: assume valid.
            result.imports = parsed.imports;
        }
        // Ignore unknown types for forwards compatibility
        if (hasOwnProperty$1.call(parsed, 'type') && (parsed.type === 'commonjs' || parsed.type === 'module')) {
            result.type = parsed.type;
        }
    }
    cache.set(jsonPath, result);
    return result;
}
/**
 * @param {URL | string} resolved
 * @returns {PackageConfig}
 */ function getPackageScopeConfig(resolved) {
    // Note: in Node, this is now a native module.
    var packageJSONUrl = new URL('package.json', resolved);
    while(true){
        var packageJSONPath = packageJSONUrl.pathname;
        if (packageJSONPath.endsWith('node_modules/package.json')) {
            break;
        }
        var packageConfig = read(url.fileURLToPath(packageJSONUrl), {
            specifier: resolved
        });
        if (packageConfig.exists) {
            return packageConfig;
        }
        var lastPackageJSONUrl = packageJSONUrl;
        packageJSONUrl = new URL('../package.json', packageJSONUrl);
        // Terminates at root where ../package.json equals ../../package.json
        // (can't just check "/package.json" for Windows support).
        if (packageJSONUrl.pathname === lastPackageJSONUrl.pathname) {
            break;
        }
    }
    var packageJSONPath1 = url.fileURLToPath(packageJSONUrl);
    // ^^ Note: in Node, this is now a native module.
    return {
        pjsonPath: packageJSONPath1,
        exists: false,
        type: 'none'
    };
}
/**
 * Returns the package type for a given URL.
 * @param {URL} url - The URL to get the package type for.
 * @returns {PackageType}
 */ function getPackageType(url) {
    // To do @anonrig: Write a C++ function that returns only "type".
    return getPackageScopeConfig(url).type;
}

// Manually “tree shaken” from:
// <https://github.com/nodejs/node/blob/7c3dce0/lib/internal/modules/esm/get_format.js>
// Last checked on: Apr 29, 2023.
var ERR_UNKNOWN_FILE_EXTENSION = codes.ERR_UNKNOWN_FILE_EXTENSION;
var hasOwnProperty = {}.hasOwnProperty;
/** @type {Record<string, string>} */ var extensionFormatMap = {
    // @ts-expect-error: hush.
    __proto__: null,
    '.cjs': 'commonjs',
    '.js': 'module',
    '.json': 'json',
    '.mjs': 'module'
};
/**
 * @param {string | null} mime
 * @returns {string | null}
 */ function mimeToFormat(mime) {
    if (mime && /\s*(text|application)\/javascript\s*(;\s*charset=utf-?8\s*)?/i.test(mime)) return 'module';
    if (mime === 'application/json') return 'json';
    return null;
}
/**
 * @callback ProtocolHandler
 * @param {URL} parsed
 * @param {{parentURL: string, source?: Buffer}} context
 * @param {boolean} ignoreErrors
 * @returns {string | null | void}
 */ /**
 * @type {Record<string, ProtocolHandler>}
 */ var protocolHandlers = {
    // @ts-expect-error: hush.
    __proto__: null,
    'data:': getDataProtocolModuleFormat,
    'file:': getFileProtocolModuleFormat,
    'http:': getHttpProtocolModuleFormat,
    'https:': getHttpProtocolModuleFormat,
    'node:': function() {
        return 'builtin';
    }
};
/**
 * @param {URL} parsed
 */ function getDataProtocolModuleFormat(parsed) {
    var _ref = /^([^/]+\/[^;,]+)[^,]*?(;base64)?,/.exec(parsed.pathname) || [
        null,
        null,
        null
    ], mime = _ref[1];
    return mimeToFormat(mime);
}
/**
 * Returns the file extension from a URL.
 *
 * Should give similar result to
 * `require('node:path').extname(require('node:url').fileURLToPath(url))`
 * when used with a `file:` URL.
 *
 * @param {URL} url
 * @returns {string}
 */ function extname(url) {
    var pathname = url.pathname;
    var index = pathname.length;
    while(index--){
        var code = pathname.codePointAt(index);
        if (code === 47 /* `/` */ ) {
            return '';
        }
        if (code === 46 /* `.` */ ) {
            return pathname.codePointAt(index - 1) === 47 /* `/` */  ? '' : pathname.slice(index);
        }
    }
    return '';
}
/**
 * @type {ProtocolHandler}
 */ function getFileProtocolModuleFormat(url$1, _context, ignoreErrors) {
    var value = extname(url$1);
    if (value === '.js') {
        var packageType = getPackageType(url$1);
        if (packageType !== 'none') {
            return packageType;
        }
        return 'commonjs';
    }
    if (value === '') {
        var packageType1 = getPackageType(url$1);
        // Legacy behavior
        if (packageType1 === 'none' || packageType1 === 'commonjs') {
            return 'commonjs';
        }
        // Note: we don’t implement WASM, so we don’t need
        // `getFormatOfExtensionlessFile` from `formats`.
        return 'module';
    }
    var format = extensionFormatMap[value];
    if (format) return format;
    // Explicit undefined return indicates load hook should rerun format check
    if (ignoreErrors) {
        return undefined;
    }
    var filepath = url.fileURLToPath(url$1);
    throw new ERR_UNKNOWN_FILE_EXTENSION(value, filepath);
}
function getHttpProtocolModuleFormat() {
// To do: HTTPS imports.
}
/**
 * @param {URL} url
 * @param {{parentURL: string}} context
 * @returns {string | null}
 */ function defaultGetFormatWithoutErrors(url, context) {
    var protocol = url.protocol;
    if (!hasOwnProperty.call(protocolHandlers, protocol)) {
        return null;
    }
    return protocolHandlers[protocol](url, context, true) || null;
}

// Manually “tree shaken” from:
// <https://github.com/nodejs/node/blob/81a9a97/lib/internal/modules/esm/utils.js>
// Last checked on: Apr 29, 2023.
var ERR_INVALID_ARG_VALUE = codes.ERR_INVALID_ARG_VALUE;
// In Node itself these values are populated from CLI arguments, before any
// user code runs.
// Here we just define the defaults.
var DEFAULT_CONDITIONS = Object.freeze([
    'node',
    'import'
]);
var DEFAULT_CONDITIONS_SET = new Set(DEFAULT_CONDITIONS);
/**
 * Returns the default conditions for ES module loading.
 */ function getDefaultConditions() {
    return DEFAULT_CONDITIONS;
}
/**
 * Returns the default conditions for ES module loading, as a Set.
 */ function getDefaultConditionsSet() {
    return DEFAULT_CONDITIONS_SET;
}
/**
 * @param {Array<string>} [conditions]
 * @returns {Set<string>}
 */ function getConditionsSet(conditions) {
    if (conditions !== undefined && conditions !== getDefaultConditions()) {
        if (!Array.isArray(conditions)) {
            throw new ERR_INVALID_ARG_VALUE('conditions', conditions, 'expected an array');
        }
        return new Set(conditions);
    }
    return getDefaultConditionsSet();
}

// Manually “tree shaken” from:
// <https://github.com/nodejs/node/blob/81a9a97/lib/internal/modules/esm/resolve.js>
// Last checked on: Apr 29, 2023.
/**
 * @typedef {import('node:fs').Stats} Stats
 * @typedef {import('./errors.js').ErrnoException} ErrnoException
 * @typedef {import('./package-json-reader.js').PackageConfig} PackageConfig
 */ function _type_of(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
var RegExpPrototypeSymbolReplace = RegExp.prototype[Symbol.replace];
var ERR_NETWORK_IMPORT_DISALLOWED = codes.ERR_NETWORK_IMPORT_DISALLOWED, ERR_INVALID_MODULE_SPECIFIER = codes.ERR_INVALID_MODULE_SPECIFIER, ERR_INVALID_PACKAGE_CONFIG = codes.ERR_INVALID_PACKAGE_CONFIG, ERR_INVALID_PACKAGE_TARGET = codes.ERR_INVALID_PACKAGE_TARGET, ERR_MODULE_NOT_FOUND = codes.ERR_MODULE_NOT_FOUND, ERR_PACKAGE_IMPORT_NOT_DEFINED = codes.ERR_PACKAGE_IMPORT_NOT_DEFINED, ERR_PACKAGE_PATH_NOT_EXPORTED = codes.ERR_PACKAGE_PATH_NOT_EXPORTED, ERR_UNSUPPORTED_DIR_IMPORT = codes.ERR_UNSUPPORTED_DIR_IMPORT, ERR_UNSUPPORTED_RESOLVE_REQUEST = codes.ERR_UNSUPPORTED_RESOLVE_REQUEST;
var own = {}.hasOwnProperty;
var invalidSegmentRegEx = /(^|\\|\/)((\.|%2e)(\.|%2e)?|(n|%6e|%4e)(o|%6f|%4f)(d|%64|%44)(e|%65|%45)(_|%5f)(m|%6d|%4d)(o|%6f|%4f)(d|%64|%44)(u|%75|%55)(l|%6c|%4c)(e|%65|%45)(s|%73|%53))?(\\|\/|$)/i;
var deprecatedInvalidSegmentRegEx = /(^|\\|\/)((\.|%2e)(\.|%2e)?|(n|%6e|%4e)(o|%6f|%4f)(d|%64|%44)(e|%65|%45)(_|%5f)(m|%6d|%4d)(o|%6f|%4f)(d|%64|%44)(u|%75|%55)(l|%6c|%4c)(e|%65|%45)(s|%73|%53))(\\|\/|$)/i;
var invalidPackageNameRegEx = /^\.|%|\\/;
var patternRegEx = /\*/g;
var encodedSeparatorRegEx = /%2f|%5c/i;
/** @type {Set<string>} */ var emittedPackageWarnings = new Set();
var doubleSlashRegEx = /[/\\]{2}/;
/**
 *
 * @param {string} target
 * @param {string} request
 * @param {string} match
 * @param {URL} packageJsonUrl
 * @param {boolean} internal
 * @param {URL} base
 * @param {boolean} isTarget
 */ function emitInvalidSegmentDeprecation(target, request, match, packageJsonUrl, internal, base, isTarget) {
    // @ts-expect-error: apparently it does exist, TS.
    if (process.noDeprecation) {
        return;
    }
    var pjsonPath = url.fileURLToPath(packageJsonUrl);
    var double = doubleSlashRegEx.exec(isTarget ? target : request) !== null;
    process.emitWarning("Use of deprecated ".concat(double ? 'double slash' : 'leading or trailing slash matching', ' resolving "').concat(target, '" for module ') + 'request "'.concat(request, '" ').concat(request === match ? '' : 'matched to "'.concat(match, '" '), 'in the "').concat(internal ? 'imports' : 'exports', '" field module resolution of the package at ').concat(pjsonPath).concat(base ? " imported from ".concat(url.fileURLToPath(base)) : '', "."), 'DeprecationWarning', 'DEP0166');
}
/**
 * @param {URL} url
 * @param {URL} packageJsonUrl
 * @param {URL} base
 * @param {string} [main]
 * @returns {void}
 */ function emitLegacyIndexDeprecation(url$1, packageJsonUrl, base, main) {
    // @ts-expect-error: apparently it does exist, TS.
    if (process.noDeprecation) {
        return;
    }
    var format = defaultGetFormatWithoutErrors(url$1, {
        parentURL: base.href
    });
    if (format !== 'module') return;
    var urlPath = url.fileURLToPath(url$1.href);
    var packagePath = url.fileURLToPath(new url.URL('.', packageJsonUrl));
    var basePath = url.fileURLToPath(base);
    if (!main) {
        process.emitWarning('No "main" or "exports" field defined in the package.json for '.concat(packagePath, ' resolving the main entry point "').concat(urlPath.slice(packagePath.length), '", imported from ').concat(basePath, '.\nDefault "index" lookups for the main are deprecated for ES modules.'), 'DeprecationWarning', 'DEP0151');
    } else if (path.resolve(packagePath, main) !== urlPath) {
        process.emitWarning("Package ".concat(packagePath, ' has a "main" field set to "').concat(main, '", ') + 'excluding the full filename and extension to the resolved file at "'.concat(urlPath.slice(packagePath.length), '", imported from ').concat(basePath, '.\n Automatic extension resolution of the "main" field is ') + 'deprecated for ES modules.', 'DeprecationWarning', 'DEP0151');
    }
}
/**
 * @param {string} path
 * @returns {Stats | undefined}
 */ function tryStatSync(path) {
    // Note: from Node 15 onwards we can use `throwIfNoEntry: false` instead.
    try {
        return fs.statSync(path);
    } catch (e) {
    // Note: in Node code this returns `new Stats`,
    // but in Node 22 that’s marked as a deprecated internal API.
    // Which, well, we kinda are, but still to prevent that warning,
    // just yield `undefined`.
    }
}
/**
 * Legacy CommonJS main resolution:
 * 1. let M = pkg_url + (json main field)
 * 2. TRY(M, M.js, M.json, M.node)
 * 3. TRY(M/index.js, M/index.json, M/index.node)
 * 4. TRY(pkg_url/index.js, pkg_url/index.json, pkg_url/index.node)
 * 5. NOT_FOUND
 *
 * @param {URL} url
 * @returns {boolean}
 */ function fileExists(url) {
    var stats = fs.statSync(url, {
        throwIfNoEntry: false
    });
    var isFile = stats ? stats.isFile() : undefined;
    return isFile === null || isFile === undefined ? false : isFile;
}
/**
 * @param {URL} packageJsonUrl
 * @param {PackageConfig} packageConfig
 * @param {URL} base
 * @returns {URL}
 */ function legacyMainResolve(packageJsonUrl, packageConfig, base) {
    /** @type {URL | undefined} */ var guess;
    if (packageConfig.main !== undefined) {
        guess = new url.URL(packageConfig.main, packageJsonUrl);
        // Note: fs check redundances will be handled by Descriptor cache here.
        if (fileExists(guess)) return guess;
        var tries = [
            "./".concat(packageConfig.main, ".js"),
            "./".concat(packageConfig.main, ".json"),
            "./".concat(packageConfig.main, ".node"),
            "./".concat(packageConfig.main, "/index.js"),
            "./".concat(packageConfig.main, "/index.json"),
            "./".concat(packageConfig.main, "/index.node")
        ];
        var i = -1;
        while(++i < tries.length){
            guess = new url.URL(tries[i], packageJsonUrl);
            if (fileExists(guess)) break;
            guess = undefined;
        }
        if (guess) {
            emitLegacyIndexDeprecation(guess, packageJsonUrl, base, packageConfig.main);
            return guess;
        }
    // Fallthrough.
    }
    var tries1 = [
        './index.js',
        './index.json',
        './index.node'
    ];
    var i1 = -1;
    while(++i1 < tries1.length){
        guess = new url.URL(tries1[i1], packageJsonUrl);
        if (fileExists(guess)) break;
        guess = undefined;
    }
    if (guess) {
        emitLegacyIndexDeprecation(guess, packageJsonUrl, base, packageConfig.main);
        return guess;
    }
    // Not found.
    throw new ERR_MODULE_NOT_FOUND(url.fileURLToPath(new url.URL('.', packageJsonUrl)), url.fileURLToPath(base));
}
/**
 * @param {URL} resolved
 * @param {URL} base
 * @param {boolean} [preserveSymlinks]
 * @returns {URL}
 */ function finalizeResolution(resolved, base, preserveSymlinks) {
    if (encodedSeparatorRegEx.exec(resolved.pathname) !== null) {
        throw new ERR_INVALID_MODULE_SPECIFIER(resolved.pathname, 'must not include encoded "/" or "\\" characters', url.fileURLToPath(base));
    }
    /** @type {string} */ var filePath;
    try {
        filePath = url.fileURLToPath(resolved);
    } catch (error) {
        var cause = /** @type {ErrnoException} */ error;
        Object.defineProperty(cause, 'input', {
            value: String(resolved)
        });
        Object.defineProperty(cause, 'module', {
            value: String(base)
        });
        throw cause;
    }
    var stats = tryStatSync(filePath.endsWith('/') ? filePath.slice(-1) : filePath);
    if (stats && stats.isDirectory()) {
        var _$error = new ERR_UNSUPPORTED_DIR_IMPORT(filePath, url.fileURLToPath(base));
        // @ts-expect-error Add this for `import.meta.resolve`.
        _$error.url = String(resolved);
        throw _$error;
    }
    if (!stats || !stats.isFile()) {
        var _$error1 = new ERR_MODULE_NOT_FOUND(filePath || resolved.pathname, base && url.fileURLToPath(base), true);
        // @ts-expect-error Add this for `import.meta.resolve`.
        _$error1.url = String(resolved);
        throw _$error1;
    }
    if (!preserveSymlinks) {
        var real = fs.realpathSync(filePath);
        var search = resolved.search, hash = resolved.hash;
        resolved = url.pathToFileURL(real + (filePath.endsWith(path.sep) ? '/' : ''));
        resolved.search = search;
        resolved.hash = hash;
    }
    return resolved;
}
/**
 * @param {string} specifier
 * @param {URL | undefined} packageJsonUrl
 * @param {URL} base
 * @returns {Error}
 */ function importNotDefined(specifier, packageJsonUrl, base) {
    return new ERR_PACKAGE_IMPORT_NOT_DEFINED(specifier, packageJsonUrl && url.fileURLToPath(new url.URL('.', packageJsonUrl)), url.fileURLToPath(base));
}
/**
 * @param {string} subpath
 * @param {URL} packageJsonUrl
 * @param {URL} base
 * @returns {Error}
 */ function exportsNotFound(subpath, packageJsonUrl, base) {
    return new ERR_PACKAGE_PATH_NOT_EXPORTED(url.fileURLToPath(new url.URL('.', packageJsonUrl)), subpath, base && url.fileURLToPath(base));
}
/**
 * @param {string} request
 * @param {string} match
 * @param {URL} packageJsonUrl
 * @param {boolean} internal
 * @param {URL} [base]
 * @returns {never}
 */ function throwInvalidSubpath(request, match, packageJsonUrl, internal, base) {
    var reason = 'request is not a valid match in pattern "'.concat(match, '" for the "').concat(internal ? 'imports' : 'exports', '" resolution of ').concat(url.fileURLToPath(packageJsonUrl));
    throw new ERR_INVALID_MODULE_SPECIFIER(request, reason, base && url.fileURLToPath(base));
}
/**
 * @param {string} subpath
 * @param {unknown} target
 * @param {URL} packageJsonUrl
 * @param {boolean} internal
 * @param {URL} [base]
 * @returns {Error}
 */ function invalidPackageTarget(subpath, target, packageJsonUrl, internal, base) {
    target = (typeof target === "undefined" ? "undefined" : _type_of(target)) === 'object' && target !== null ? JSON.stringify(target, null, '') : "".concat(target);
    return new ERR_INVALID_PACKAGE_TARGET(url.fileURLToPath(new url.URL('.', packageJsonUrl)), subpath, target, internal, base && url.fileURLToPath(base));
}
/**
 * @param {string} target
 * @param {string} subpath
 * @param {string} match
 * @param {URL} packageJsonUrl
 * @param {URL} base
 * @param {boolean} pattern
 * @param {boolean} internal
 * @param {boolean} isPathMap
 * @param {Set<string> | undefined} conditions
 * @returns {URL}
 */ function resolvePackageTargetString(target, subpath, match, packageJsonUrl, base, pattern, internal, isPathMap, conditions) {
    if (subpath !== '' && !pattern && target[target.length - 1] !== '/') throw invalidPackageTarget(match, target, packageJsonUrl, internal, base);
    if (!target.startsWith('./')) {
        if (internal && !target.startsWith('../') && !target.startsWith('/')) {
            var isURL = false;
            try {
                new url.URL(target);
                isURL = true;
            } catch (e) {
            // Continue regardless of error.
            }
            if (!isURL) {
                var exportTarget = pattern ? RegExpPrototypeSymbolReplace.call(patternRegEx, target, function() {
                    return subpath;
                }) : target + subpath;
                return packageResolve(exportTarget, packageJsonUrl, conditions);
            }
        }
        throw invalidPackageTarget(match, target, packageJsonUrl, internal, base);
    }
    if (invalidSegmentRegEx.exec(target.slice(2)) !== null) {
        if (deprecatedInvalidSegmentRegEx.exec(target.slice(2)) === null) {
            if (!isPathMap) {
                var request = pattern ? match.replace('*', function() {
                    return subpath;
                }) : match + subpath;
                var resolvedTarget = pattern ? RegExpPrototypeSymbolReplace.call(patternRegEx, target, function() {
                    return subpath;
                }) : target;
                emitInvalidSegmentDeprecation(resolvedTarget, request, match, packageJsonUrl, internal, base, true);
            }
        } else {
            throw invalidPackageTarget(match, target, packageJsonUrl, internal, base);
        }
    }
    var resolved = new url.URL(target, packageJsonUrl);
    var resolvedPath = resolved.pathname;
    var packagePath = new url.URL('.', packageJsonUrl).pathname;
    if (!resolvedPath.startsWith(packagePath)) throw invalidPackageTarget(match, target, packageJsonUrl, internal, base);
    if (subpath === '') return resolved;
    if (invalidSegmentRegEx.exec(subpath) !== null) {
        var request1 = pattern ? match.replace('*', function() {
            return subpath;
        }) : match + subpath;
        if (deprecatedInvalidSegmentRegEx.exec(subpath) === null) {
            if (!isPathMap) {
                var resolvedTarget1 = pattern ? RegExpPrototypeSymbolReplace.call(patternRegEx, target, function() {
                    return subpath;
                }) : target;
                emitInvalidSegmentDeprecation(resolvedTarget1, request1, match, packageJsonUrl, internal, base, false);
            }
        } else {
            throwInvalidSubpath(request1, match, packageJsonUrl, internal, base);
        }
    }
    if (pattern) {
        return new url.URL(RegExpPrototypeSymbolReplace.call(patternRegEx, resolved.href, function() {
            return subpath;
        }));
    }
    return new url.URL(subpath, resolved);
}
/**
 * @param {string} key
 * @returns {boolean}
 */ function isArrayIndex(key) {
    var keyNumber = Number(key);
    if ("".concat(keyNumber) !== key) return false;
    return keyNumber >= 0 && keyNumber < 0xffffffff;
}
/**
 * @param {URL} packageJsonUrl
 * @param {unknown} target
 * @param {string} subpath
 * @param {string} packageSubpath
 * @param {URL} base
 * @param {boolean} pattern
 * @param {boolean} internal
 * @param {boolean} isPathMap
 * @param {Set<string> | undefined} conditions
 * @returns {URL | null}
 */ function resolvePackageTarget(packageJsonUrl, target, subpath, packageSubpath, base, pattern, internal, isPathMap, conditions) {
    if (typeof target === 'string') {
        return resolvePackageTargetString(target, subpath, packageSubpath, packageJsonUrl, base, pattern, internal, isPathMap, conditions);
    }
    if (Array.isArray(target)) {
        /** @type {Array<unknown>} */ var targetList = target;
        if (targetList.length === 0) return null;
        /** @type {ErrnoException | null | undefined} */ var lastException;
        var i = -1;
        while(++i < targetList.length){
            var targetItem = targetList[i];
            /** @type {URL | null} */ var resolveResult = undefined;
            try {
                resolveResult = resolvePackageTarget(packageJsonUrl, targetItem, subpath, packageSubpath, base, pattern, internal, isPathMap, conditions);
            } catch (error) {
                var exception = /** @type {ErrnoException} */ error;
                lastException = exception;
                if (exception.code === 'ERR_INVALID_PACKAGE_TARGET') continue;
                throw error;
            }
            if (resolveResult === undefined) continue;
            if (resolveResult === null) {
                lastException = null;
                continue;
            }
            return resolveResult;
        }
        if (lastException === undefined || lastException === null) {
            return null;
        }
        throw lastException;
    }
    if ((typeof target === "undefined" ? "undefined" : _type_of(target)) === 'object' && target !== null) {
        var keys = Object.getOwnPropertyNames(target);
        var i1 = -1;
        while(++i1 < keys.length){
            var key = keys[i1];
            if (isArrayIndex(key)) {
                throw new ERR_INVALID_PACKAGE_CONFIG(url.fileURLToPath(packageJsonUrl), base, '"exports" cannot contain numeric property keys.');
            }
        }
        i1 = -1;
        while(++i1 < keys.length){
            var key1 = keys[i1];
            if (key1 === 'default' || conditions && conditions.has(key1)) {
                // @ts-expect-error: indexable.
                var conditionalTarget = /** @type {unknown} */ target[key1];
                var resolveResult1 = resolvePackageTarget(packageJsonUrl, conditionalTarget, subpath, packageSubpath, base, pattern, internal, isPathMap, conditions);
                if (resolveResult1 === undefined) continue;
                return resolveResult1;
            }
        }
        return null;
    }
    if (target === null) {
        return null;
    }
    throw invalidPackageTarget(packageSubpath, target, packageJsonUrl, internal, base);
}
/**
 * @param {unknown} exports
 * @param {URL} packageJsonUrl
 * @param {URL} base
 * @returns {boolean}
 */ function isConditionalExportsMainSugar(exports, packageJsonUrl, base) {
    if (typeof exports === 'string' || Array.isArray(exports)) return true;
    if ((typeof exports === "undefined" ? "undefined" : _type_of(exports)) !== 'object' || exports === null) return false;
    var keys = Object.getOwnPropertyNames(exports);
    var isConditionalSugar = false;
    var i = 0;
    var keyIndex = -1;
    while(++keyIndex < keys.length){
        var key = keys[keyIndex];
        var currentIsConditionalSugar = key === '' || key[0] !== '.';
        if (i++ === 0) {
            isConditionalSugar = currentIsConditionalSugar;
        } else if (isConditionalSugar !== currentIsConditionalSugar) {
            throw new ERR_INVALID_PACKAGE_CONFIG(url.fileURLToPath(packageJsonUrl), base, '"exports" cannot contain some keys starting with \'.\' and some not.' + ' The exports object must either be an object of package subpath keys' + ' or an object of main entry condition name keys only.');
        }
    }
    return isConditionalSugar;
}
/**
 * @param {string} match
 * @param {URL} pjsonUrl
 * @param {URL} base
 */ function emitTrailingSlashPatternDeprecation(match, pjsonUrl, base) {
    // @ts-expect-error: apparently it does exist, TS.
    if (process.noDeprecation) {
        return;
    }
    var pjsonPath = url.fileURLToPath(pjsonUrl);
    if (emittedPackageWarnings.has(pjsonPath + '|' + match)) return;
    emittedPackageWarnings.add(pjsonPath + '|' + match);
    process.emitWarning('Use of deprecated trailing slash pattern mapping "'.concat(match, '" in the ') + '"exports" field module resolution of the package at '.concat(pjsonPath).concat(base ? " imported from ".concat(url.fileURLToPath(base)) : '', '. Mapping specifiers ending in "/" is no longer supported.'), 'DeprecationWarning', 'DEP0155');
}
/**
 * @param {URL} packageJsonUrl
 * @param {string} packageSubpath
 * @param {Record<string, unknown>} packageConfig
 * @param {URL} base
 * @param {Set<string> | undefined} conditions
 * @returns {URL}
 */ function packageExportsResolve(packageJsonUrl, packageSubpath, packageConfig, base, conditions) {
    var exports = packageConfig.exports;
    if (isConditionalExportsMainSugar(exports, packageJsonUrl, base)) {
        exports = {
            '.': exports
        };
    }
    if (own.call(exports, packageSubpath) && !packageSubpath.includes('*') && !packageSubpath.endsWith('/')) {
        // @ts-expect-error: indexable.
        var target = exports[packageSubpath];
        var resolveResult = resolvePackageTarget(packageJsonUrl, target, '', packageSubpath, base, false, false, false, conditions);
        if (resolveResult === null || resolveResult === undefined) {
            throw exportsNotFound(packageSubpath, packageJsonUrl, base);
        }
        return resolveResult;
    }
    var bestMatch = '';
    var bestMatchSubpath = '';
    var keys = Object.getOwnPropertyNames(exports);
    var i = -1;
    while(++i < keys.length){
        var key = keys[i];
        var patternIndex = key.indexOf('*');
        if (patternIndex !== -1 && packageSubpath.startsWith(key.slice(0, patternIndex))) {
            // When this reaches EOL, this can throw at the top of the whole function:
            //
            // if (StringPrototypeEndsWith(packageSubpath, '/'))
            //   throwInvalidSubpath(packageSubpath)
            //
            // To match "imports" and the spec.
            if (packageSubpath.endsWith('/')) {
                emitTrailingSlashPatternDeprecation(packageSubpath, packageJsonUrl, base);
            }
            var patternTrailer = key.slice(patternIndex + 1);
            if (packageSubpath.length >= key.length && packageSubpath.endsWith(patternTrailer) && patternKeyCompare(bestMatch, key) === 1 && key.lastIndexOf('*') === patternIndex) {
                bestMatch = key;
                bestMatchSubpath = packageSubpath.slice(patternIndex, packageSubpath.length - patternTrailer.length);
            }
        }
    }
    if (bestMatch) {
        // @ts-expect-error: indexable.
        var target1 = /** @type {unknown} */ exports[bestMatch];
        var resolveResult1 = resolvePackageTarget(packageJsonUrl, target1, bestMatchSubpath, bestMatch, base, true, false, packageSubpath.endsWith('/'), conditions);
        if (resolveResult1 === null || resolveResult1 === undefined) {
            throw exportsNotFound(packageSubpath, packageJsonUrl, base);
        }
        return resolveResult1;
    }
    throw exportsNotFound(packageSubpath, packageJsonUrl, base);
}
/**
 * @param {string} a
 * @param {string} b
 */ function patternKeyCompare(a, b) {
    var aPatternIndex = a.indexOf('*');
    var bPatternIndex = b.indexOf('*');
    var baseLengthA = aPatternIndex === -1 ? a.length : aPatternIndex + 1;
    var baseLengthB = bPatternIndex === -1 ? b.length : bPatternIndex + 1;
    if (baseLengthA > baseLengthB) return -1;
    if (baseLengthB > baseLengthA) return 1;
    if (aPatternIndex === -1) return 1;
    if (bPatternIndex === -1) return -1;
    if (a.length > b.length) return -1;
    if (b.length > a.length) return 1;
    return 0;
}
/**
 * @param {string} name
 * @param {URL} base
 * @param {Set<string>} [conditions]
 * @returns {URL}
 */ function packageImportsResolve(name, base, conditions) {
    if (name === '#' || name.startsWith('#/') || name.endsWith('/')) {
        var reason = 'is not a valid internal imports specifier name';
        throw new ERR_INVALID_MODULE_SPECIFIER(name, reason, url.fileURLToPath(base));
    }
    /** @type {URL | undefined} */ var packageJsonUrl;
    var packageConfig = getPackageScopeConfig(base);
    if (packageConfig.exists) {
        packageJsonUrl = url.pathToFileURL(packageConfig.pjsonPath);
        var imports = packageConfig.imports;
        if (imports) {
            if (own.call(imports, name) && !name.includes('*')) {
                var resolveResult = resolvePackageTarget(packageJsonUrl, imports[name], '', name, base, false, true, false, conditions);
                if (resolveResult !== null && resolveResult !== undefined) {
                    return resolveResult;
                }
            } else {
                var bestMatch = '';
                var bestMatchSubpath = '';
                var keys = Object.getOwnPropertyNames(imports);
                var i = -1;
                while(++i < keys.length){
                    var key = keys[i];
                    var patternIndex = key.indexOf('*');
                    if (patternIndex !== -1 && name.startsWith(key.slice(0, -1))) {
                        var patternTrailer = key.slice(patternIndex + 1);
                        if (name.length >= key.length && name.endsWith(patternTrailer) && patternKeyCompare(bestMatch, key) === 1 && key.lastIndexOf('*') === patternIndex) {
                            bestMatch = key;
                            bestMatchSubpath = name.slice(patternIndex, name.length - patternTrailer.length);
                        }
                    }
                }
                if (bestMatch) {
                    var target = imports[bestMatch];
                    var resolveResult1 = resolvePackageTarget(packageJsonUrl, target, bestMatchSubpath, bestMatch, base, true, true, false, conditions);
                    if (resolveResult1 !== null && resolveResult1 !== undefined) {
                        return resolveResult1;
                    }
                }
            }
        }
    }
    throw importNotDefined(name, packageJsonUrl, base);
}
/**
 * @param {string} specifier
 * @param {URL} base
 */ function parsePackageName(specifier, base) {
    var separatorIndex = specifier.indexOf('/');
    var validPackageName = true;
    var isScoped = false;
    if (specifier[0] === '@') {
        isScoped = true;
        if (separatorIndex === -1 || specifier.length === 0) {
            validPackageName = false;
        } else {
            separatorIndex = specifier.indexOf('/', separatorIndex + 1);
        }
    }
    var packageName = separatorIndex === -1 ? specifier : specifier.slice(0, separatorIndex);
    // Package name cannot have leading . and cannot have percent-encoding or
    // \\ separators.
    if (invalidPackageNameRegEx.exec(packageName) !== null) {
        validPackageName = false;
    }
    if (!validPackageName) {
        throw new ERR_INVALID_MODULE_SPECIFIER(specifier, 'is not a valid package name', url.fileURLToPath(base));
    }
    var packageSubpath = '.' + (separatorIndex === -1 ? '' : specifier.slice(separatorIndex));
    return {
        packageName: packageName,
        packageSubpath: packageSubpath,
        isScoped: isScoped
    };
}
/**
 * @param {string} specifier
 * @param {URL} base
 * @param {Set<string> | undefined} conditions
 * @returns {URL}
 */ function packageResolve(specifier, base, conditions) {
    if (module$1.builtinModules.includes(specifier)) {
        return new url.URL('node:' + specifier);
    }
    var _parsePackageName = parsePackageName(specifier, base), packageName = _parsePackageName.packageName, packageSubpath = _parsePackageName.packageSubpath, isScoped = _parsePackageName.isScoped;
    // ResolveSelf
    var packageConfig = getPackageScopeConfig(base);
    // Can’t test.
    /* c8 ignore next 16 */ if (packageConfig.exists) {
        var packageJsonUrl = url.pathToFileURL(packageConfig.pjsonPath);
        if (packageConfig.name === packageName && packageConfig.exports !== undefined && packageConfig.exports !== null) {
            return packageExportsResolve(packageJsonUrl, packageSubpath, packageConfig, base, conditions);
        }
    }
    var packageJsonUrl1 = new url.URL('./node_modules/' + packageName + '/package.json', base);
    var packageJsonPath = url.fileURLToPath(packageJsonUrl1);
    /** @type {string} */ var lastPath;
    do {
        var stat = tryStatSync(packageJsonPath.slice(0, -13));
        if (!stat || !stat.isDirectory()) {
            lastPath = packageJsonPath;
            packageJsonUrl1 = new url.URL((isScoped ? '../../../../node_modules/' : '../../../node_modules/') + packageName + '/package.json', packageJsonUrl1);
            packageJsonPath = url.fileURLToPath(packageJsonUrl1);
            continue;
        }
        // Package match.
        var packageConfig1 = read(packageJsonPath, {
            base: base,
            specifier: specifier
        });
        if (packageConfig1.exports !== undefined && packageConfig1.exports !== null) {
            return packageExportsResolve(packageJsonUrl1, packageSubpath, packageConfig1, base, conditions);
        }
        if (packageSubpath === '.') {
            return legacyMainResolve(packageJsonUrl1, packageConfig1, base);
        }
        return new url.URL(packageSubpath, packageJsonUrl1);
    // Cross-platform root check.
    }while (packageJsonPath.length !== lastPath.length);
    throw new ERR_MODULE_NOT_FOUND(packageName, url.fileURLToPath(base), false);
}
/**
 * @param {string} specifier
 * @returns {boolean}
 */ function isRelativeSpecifier(specifier) {
    if (specifier[0] === '.') {
        if (specifier.length === 1 || specifier[1] === '/') return true;
        if (specifier[1] === '.' && (specifier.length === 2 || specifier[2] === '/')) {
            return true;
        }
    }
    return false;
}
/**
 * @param {string} specifier
 * @returns {boolean}
 */ function shouldBeTreatedAsRelativeOrAbsolutePath(specifier) {
    if (specifier === '') return false;
    if (specifier[0] === '/') return true;
    return isRelativeSpecifier(specifier);
}
/**
 * The “Resolver Algorithm Specification” as detailed in the Node docs (which is
 * sync and slightly lower-level than `resolve`).
 *
 * @param {string} specifier
 *   `/example.js`, `./example.js`, `../example.js`, `some-package`, `fs`, etc.
 * @param {URL} base
 *   Full URL (to a file) that `specifier` is resolved relative from.
 * @param {Set<string>} [conditions]
 *   Conditions.
 * @param {boolean} [preserveSymlinks]
 *   Keep symlinks instead of resolving them.
 * @returns {URL}
 *   A URL object to the found thing.
 */ function moduleResolve(specifier, base, conditions, preserveSymlinks) {
    // Note: The Node code supports `base` as a string (in this internal API) too,
    // we don’t.
    var protocol = base.protocol;
    var isData = protocol === 'data:';
    var isRemote = isData || protocol === 'http:' || protocol === 'https:';
    // Order swapped from spec for minor perf gain.
    // Ok since relative URLs cannot parse as URLs.
    /** @type {URL | undefined} */ var resolved;
    if (shouldBeTreatedAsRelativeOrAbsolutePath(specifier)) {
        try {
            resolved = new url.URL(specifier, base);
        } catch (error_) {
            var error = new ERR_UNSUPPORTED_RESOLVE_REQUEST(specifier, base);
            error.cause = error_;
            throw error;
        }
    } else if (protocol === 'file:' && specifier[0] === '#') {
        resolved = packageImportsResolve(specifier, base, conditions);
    } else {
        try {
            resolved = new url.URL(specifier);
        } catch (error_) {
            // Note: actual code uses `canBeRequiredWithoutScheme`.
            if (isRemote && !module$1.builtinModules.includes(specifier)) {
                var error1 = new ERR_UNSUPPORTED_RESOLVE_REQUEST(specifier, base);
                error1.cause = error_;
                throw error1;
            }
            resolved = packageResolve(specifier, base, conditions);
        }
    }
    assert(resolved !== undefined, 'expected to be defined');
    if (resolved.protocol !== 'file:') {
        return resolved;
    }
    return finalizeResolution(resolved, base, preserveSymlinks);
}
/**
 * @param {string} specifier
 * @param {URL | undefined} parsed
 * @param {URL | undefined} parsedParentURL
 */ function checkIfDisallowedImport(specifier, parsed, parsedParentURL) {
    if (parsedParentURL) {
        // Avoid accessing the `protocol` property due to the lazy getters.
        var parentProtocol = parsedParentURL.protocol;
        if (parentProtocol === 'http:' || parentProtocol === 'https:') {
            if (shouldBeTreatedAsRelativeOrAbsolutePath(specifier)) {
                // Avoid accessing the `protocol` property due to the lazy getters.
                var parsedProtocol = parsed === null || parsed === undefined ? undefined : parsed.protocol;
                // `data:` and `blob:` disallowed due to allowing file: access via
                // indirection
                if (parsedProtocol && parsedProtocol !== 'https:' && parsedProtocol !== 'http:') {
                    throw new ERR_NETWORK_IMPORT_DISALLOWED(specifier, parsedParentURL, 'remote imports cannot import from a local location.');
                }
                return {
                    url: (parsed === null || parsed === undefined ? undefined : parsed.href) || ''
                };
            }
            if (module$1.builtinModules.includes(specifier)) {
                throw new ERR_NETWORK_IMPORT_DISALLOWED(specifier, parsedParentURL, 'remote imports cannot import from a local location.');
            }
            throw new ERR_NETWORK_IMPORT_DISALLOWED(specifier, parsedParentURL, 'only relative and absolute specifiers are supported.');
        }
    }
}
// Note: this is from:
// <https://github.com/nodejs/node/blob/3e74590/lib/internal/url.js#L687>
/**
 * Checks if a value has the shape of a WHATWG URL object.
 *
 * Using a symbol or instanceof would not be able to recognize URL objects
 * coming from other implementations (e.g. in Electron), so instead we are
 * checking some well known properties for a lack of a better test.
 *
 * We use `href` and `protocol` as they are the only properties that are
 * easy to retrieve and calculate due to the lazy nature of the getters.
 *
 * @template {unknown} Value
 * @param {Value} self
 * @returns {Value is URL}
 */ function isURL(self) {
    return Boolean(self && (typeof self === "undefined" ? "undefined" : _type_of(self)) === 'object' && 'href' in self && typeof self.href === 'string' && 'protocol' in self && typeof self.protocol === 'string' && self.href && self.protocol);
}
/**
 * Validate user-input in `context` supplied by a custom loader.
 *
 * @param {unknown} parentURL
 * @returns {asserts parentURL is URL | string | undefined}
 */ function throwIfInvalidParentURL(parentURL) {
    if (parentURL === undefined) {
        return; // Main entry point, so no parent
    }
    if (typeof parentURL !== 'string' && !isURL(parentURL)) {
        throw new codes.ERR_INVALID_ARG_TYPE('parentURL', [
            'string',
            'URL'
        ], parentURL);
    }
}
/**
 * @param {string} specifier
 * @param {{parentURL?: string, conditions?: Array<string>}} context
 * @returns {{url: string, format?: string | null}}
 */ function defaultResolve(specifier) {
    var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var parentURL = context.parentURL;
    assert(parentURL !== undefined, 'expected `parentURL` to be defined');
    throwIfInvalidParentURL(parentURL);
    /** @type {URL | undefined} */ var parsedParentURL;
    if (parentURL) {
        try {
            parsedParentURL = new url.URL(parentURL);
        } catch (e) {
        // Ignore exception
        }
    }
    /** @type {URL | undefined} */ var parsed;
    /** @type {string | undefined} */ var protocol;
    try {
        parsed = shouldBeTreatedAsRelativeOrAbsolutePath(specifier) ? new url.URL(specifier, parsedParentURL) : new url.URL(specifier);
        // Avoid accessing the `protocol` property due to the lazy getters.
        protocol = parsed.protocol;
        if (protocol === 'data:') {
            return {
                url: parsed.href,
                format: null
            };
        }
    } catch (e) {
    // Ignore exception
    }
    // There are multiple deep branches that can either throw or return; instead
    // of duplicating that deeply nested logic for the possible returns, DRY and
    // check for a return. This seems the least gnarly.
    var maybeReturn = checkIfDisallowedImport(specifier, parsed, parsedParentURL);
    if (maybeReturn) return maybeReturn;
    // This must come after checkIfDisallowedImport
    if (protocol === undefined && parsed) {
        protocol = parsed.protocol;
    }
    if (protocol === 'node:') {
        return {
            url: specifier
        };
    }
    // This must come after checkIfDisallowedImport
    if (parsed && parsed.protocol === 'node:') return {
        url: specifier
    };
    var conditions = getConditionsSet(context.conditions);
    var url$1 = moduleResolve(specifier, new url.URL(parentURL), conditions, false);
    return {
        // Do NOT cast `url` to a string: that will work even when there are real
        // problems, silencing them
        url: url$1.href,
        format: defaultGetFormatWithoutErrors(url$1, {
            parentURL: parentURL
        })
    };
}

/**
 * Match `import.meta.resolve` except that `parent` is required (you can pass
 * `import.meta.url`).
 *
 * @param {string} specifier
 *   The module specifier to resolve relative to parent
 *   (`/example.js`, `./example.js`, `../example.js`, `some-package`, `fs`,
 *   etc).
 * @param {string} parent
 *   The absolute parent module URL to resolve from.
 *   You must pass `import.meta.url` or something else.
 * @returns {string}
 *   Returns a string to a full `file:`, `data:`, or `node:` URL
 *   to the found thing.
 */ function resolve(specifier, parent) {
    if (!parent) {
        throw new Error('Please pass `parent`: `import-meta-resolve` cannot ponyfill that');
    }
    try {
        return defaultResolve(specifier, {
            parentURL: parent
        }).url;
    } catch (error) {
        // See: <https://github.com/nodejs/node/blob/45f5c9b/lib/internal/modules/esm/initialize_import_meta.js#L34>
        var exception = /** @type {ErrnoException} */ error;
        if ((exception.code === 'ERR_UNSUPPORTED_DIR_IMPORT' || exception.code === 'ERR_MODULE_NOT_FOUND') && typeof exception.url === 'string') {
            return exception.url;
        }
        throw error;
    }
}

exports.moduleResolve = moduleResolve;
exports.resolve = resolve;
/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) { }; module.exports = exports.default; }
