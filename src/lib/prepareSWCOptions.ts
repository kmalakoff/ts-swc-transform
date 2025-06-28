import type { Options } from '@swc/core';
import { installSync } from 'install-optional';
import Module from 'module';
import path from 'path';
import url from 'url';

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));

import type { TSConfig } from '../types.ts';

export interface TranspilerOptions {
  tsxOptions: Options;
  nonTsxOptions: Options;
}

export default function prepareSWCOptions(tsconfig: TSConfig): TranspilerOptions {
  installSync('@swc/core', `${process.platform}-${process.arch}`, { cwd: __dirname });
  try {
    const ts = _require('typescript');
    const swc = _require('@swc/core');
    const transpiler = _require('ts-node/transpilers/swc');
    const parsed = ts.parseJsonConfigFileContent(tsconfig.config, ts.sys, path.dirname(tsconfig.path));
    return transpiler.createSwcOptions(parsed.options, undefined, swc, 'swc');
  } catch (err) {
    console.log(`prepareSWCOptions failed: ${err.message}`);
    return {} as TranspilerOptions;
  }
}
