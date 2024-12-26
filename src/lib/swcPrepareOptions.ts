import path from 'path';
import swcInstallBindings from './swcInstallBindings.js';

// @ts-ignore
import lazy from './lazy.cjs';
const lazyTS = lazy('typescript');
const lazySWC = lazy('@swc/core');
const lazyTranspiler = lazy('ts-node/transpilers/swc');

import type { TsConfigResult } from 'get-tsconfig-compat';

export default function swcPrepareOptions(tsconfig: TsConfigResult, callback) {
  swcInstallBindings((err) => {
    if (err) return callback(err);

    try {
      const ts = lazyTS();
      const swc = lazySWC();
      const transpiler = lazyTranspiler();
      const parsed = ts.parseJsonConfigFileContent(tsconfig.config, ts.sys, path.dirname(tsconfig.path));
      callback(null, transpiler.createSwcOptions(parsed.options, undefined, swc, 'swc'));
    } catch (err) {
      callback(err);
    }
  });
}
