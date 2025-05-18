import path from 'path';

// https://github.com/vercel/next.js/blob/20b63e13ab2631d6043277895d373aa31a1b327c/packages/next/taskfile-swc.js#L118-L125
export const interop = "/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) {}; module.exports = exports.default; }";

const EXTENSIONS = ['.ts', '.tsx'];

export default function patchCJS(entry, output, _options) {
  output.code += interop;
  const ext = path.extname(entry.basename);
  return EXTENSIONS.indexOf(ext) >= 0 ? '.js' : ext;
}
