import type { Options } from '@swc/core';
import { installSync, matchesLibc } from 'install-optional';
import debounce from 'lodash.debounce';
import Module from 'module';
import path from 'path';
import tsConstants from 'ts-constants';
import url from 'url';

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));

import type { TSConfig } from '../types.ts';

export interface TranspilerOptions {
  tsxOptions: Options;
  nonTsxOptions: Options;
}

const installSyncSWC = debounce(installSync, 300, { leading: true, trailing: false });

// tsconfig spells enums as strings ("es2019", "react-jsx"); swc needs the numbers.
function enumValue(map: Record<string, unknown>, value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const wanted = value.replace(/-/g, '').toLowerCase();
  const names = Object.keys(map);
  for (let i = 0; i < names.length; i++) {
    if (typeof map[names[i]] === 'number' && names[i].toLowerCase() === wanted) return map[names[i]];
  }
  return undefined;
}

function normalizeCompilerOptions(raw: Record<string, unknown>): Record<string, unknown> {
  return {
    ...raw,
    target: enumValue(tsConstants.ScriptTarget as unknown as Record<string, unknown>, raw.target),
    module: enumValue(tsConstants.ModuleKind as unknown as Record<string, unknown>, raw.module),
    jsx: enumValue(tsConstants.JsxEmit as unknown as Record<string, unknown>, raw.jsx),
  };
}

export default function prepareSWCOptions(tsconfig: TSConfig): TranspilerOptions {
  installSyncSWC('@swc/core', `${process.platform}-${process.arch}`, { cwd: __dirname, filter: matchesLibc });
  try {
    const ts = _require('typescript');
    const swc = _require('@swc/core');
    const transpiler = _require('ts-node/transpilers/swc');
    // TypeScript 7 dropped the compiler API from the package root, so fall back
    // to resolving the enum-valued fields directly.
    const options = typeof ts.parseJsonConfigFileContent === 'function' ? ts.parseJsonConfigFileContent(tsconfig.config, ts.sys, path.dirname(tsconfig.path)).options : normalizeCompilerOptions((tsconfig.config.compilerOptions || {}) as Record<string, unknown>);
    return transpiler.createSwcOptions(options, undefined, swc, 'swc');
  } catch (err) {
    console.log(`prepareSWCOptions failed: ${err instanceof Error ? err.message : String(err)}`);
    return {} as TranspilerOptions;
  }
}
