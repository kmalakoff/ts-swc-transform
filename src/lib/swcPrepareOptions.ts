import path from 'path';
import ensureBindingsSync from './ensureBindingsSync';

import Module from 'module';
const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;

import type { TsConfigResult } from 'get-tsconfig-compat';
export default function swcPrepareOptions(tsconfig: TsConfigResult) {
  ensureBindingsSync('@swc/core', `${process.platform}-${process.arch}`);
  try {
    const ts = _require('typescript');
    const swc = _require('@swc/core');
    const transpiler = _require('ts-node/transpilers/swc');
    const parsed = ts.parseJsonConfigFileContent(tsconfig.config, ts.sys, path.dirname(tsconfig.path));
    return transpiler.createSwcOptions(parsed.options, undefined, swc, 'swc');
  } catch (err) {
    console.log(`swcPrepareOptions failed: ${err.message}`);
    return {};
  }
}
