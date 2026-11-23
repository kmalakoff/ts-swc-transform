import Module from 'module';
import { bindSync } from 'node-version-call';
import path from 'path';
import loadConfigSync from 'read-tsconfig-sync';
import url from 'url';

import type { TSConfig } from './types.ts';

const major = +process.versions.node.split('.')[0];
// `node -e`, `node -p` and stdin scripts define require and __filename as globals, so a typeof check alone
// sends the ESM build down the CJS branch there; only the CJS build has module-scoped bindings that differ from the globals.
const _require = typeof require !== 'undefined' && require !== global.require ? require : Module.createRequire(import.meta.url);
const __dirname = path.dirname(typeof __filename !== 'undefined' && __filename !== global.__filename ? __filename : url.fileURLToPath(import.meta.url));
const workerPath = path.join(__dirname, '..', 'cjs', 'workers', 'transformSync.js');

function run(contents: string, fileName: string, tsconfig: TSConfig) {
  return _require(workerPath)(contents, fileName, tsconfig);
}

// spawnOptions: false - no node/npm spawn (library call only)
const worker = major >= 20 ? run : bindSync('>=20', workerPath, { spawnOptions: false });

import type { Output } from '@swc/core';
export default function transformSync(contents: string, fileName: string, tsconfig?: TSConfig): Output {
  if (typeof contents !== 'string') throw new Error('transformSync: unexpected contents');
  if (typeof fileName !== 'string') throw new Error('transformSync: unexpected fileName');
  if (!tsconfig) tsconfig = loadConfigSync(process.cwd()) ?? undefined;
  if (!tsconfig) throw new Error('transformSync: failed to load tsconfig');
  return worker(contents, fileName, tsconfig) as Output;
}
