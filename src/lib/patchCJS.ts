import type { Output } from '@swc/core';
import type { Entry } from 'fs-iterator';
import path from 'path';
import { replaceExtension } from './rewriteExtensions.ts';

// https://github.com/vercel/next.js/blob/20b63e13ab2631d6043277895d373aa31a1b327c/packages/next/taskfile-swc.js#L118-L125
export const interop = "/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) {}; module.exports = exports.default; }";

export default function patchCJS(entry: Entry, output: Output): string {
  output.code += interop;

  return replaceExtension(path.extname(entry.basename));
}
