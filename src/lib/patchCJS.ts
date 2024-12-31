import { requireRegEx } from '../constants.js';
import extensions from '../extensions.js';
import makeReplacements from './makeReplacements.js';

// https://github.com/vercel/next.js/blob/20b63e13ab2631d6043277895d373aa31a1b327c/packages/next/taskfile-swc.js#L118-L125
const interopClientDefaultExport = "/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) {}; module.exports = exports.default; }";

export default function patchCJS(output, options, _basename) {
  const cjsExtension = options.extensions?.cjs || '.js';

  output.code = makeReplacements(output.code, requireRegEx, extensions, cjsExtension);
  output.code += interopClientDefaultExport;

  return cjsExtension;
}
