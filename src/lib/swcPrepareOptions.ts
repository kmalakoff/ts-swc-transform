import path from 'path';
import swcInstallBindings from './swcInstallBindings.js';

import Module from 'module';
import lazy from 'lazy-cache';
const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const tsLazy = lazy(_require)('typescript');
const swcLazy = lazy(_require)('@swc/core');
const transpilerLazy = lazy(_require)('ts-node/transpilers/swc');

import type { TsConfigResult } from 'get-tsconfig-compat';

export default function swcPrepareOptions(tsconfig: TsConfigResult, callback) {
  swcInstallBindings((err) => {
    if (err) return callback(err);

    try {
      const ts = tsLazy();
      const swc = swcLazy();
      const transpiler = transpilerLazy();
      const parsed = ts.parseJsonConfigFileContent(tsconfig.config, ts.sys, path.dirname(tsconfig.path));
      callback(null, transpiler.createSwcOptions(parsed.options, undefined, swc, 'swc'));
    } catch (err) {
      callback(err);
    }
  });
}
