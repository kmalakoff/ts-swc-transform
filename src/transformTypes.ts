import Module from 'module';
import { bind } from 'node-version-call';
import path from 'path';
import loadConfigSync from 'read-tsconfig-sync';
import url from 'url';

import type { ConfigOptions, TransformTypesCallback } from './types.ts';

const major = +process.versions.node.split('.')[0];
const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const __dirname = path.dirname(typeof __filename === 'undefined' ? url.fileURLToPath(import.meta.url) : __filename);
const workerPath = path.join(__dirname, '..', 'cjs', 'workers', 'transformTypes.js');

function run(src: string, dest: string, options: ConfigOptions, callback: TransformTypesCallback) {
  return _require(workerPath)(src, dest, options, callback);
}

// spawnOptions: false - no node/npm spawn (library call only)
const worker = major >= 20 ? run : bind('>=20', workerPath, { callbacks: true, spawnOptions: false });

export default function transformTypes(src: string, dest: string, callback: TransformTypesCallback): void;
export default function transformTypes(src: string, dest: string, options: ConfigOptions, callback: TransformTypesCallback): void;
export default function transformTypes(src: string, dest: string): Promise<string[]>;
export default function transformTypes(src: string, dest: string, options: ConfigOptions): Promise<string[]>;
export default function transformTypes(src: string, dest: string, options?: ConfigOptions | TransformTypesCallback, callback?: TransformTypesCallback): void | Promise<string[]> {
  try {
    if (typeof src !== 'string') throw new Error('transformTypes: unexpected source');
    if (typeof dest !== 'string') throw new Error('transformTypes: unexpected destination directory');

    if (typeof options === 'function') {
      callback = options;
      options = undefined;
    }
    const baseOpts = (options || {}) as ConfigOptions;
    const tsconfig = baseOpts.tsconfig ? baseOpts.tsconfig : loadConfigSync(src);
    const opts: ConfigOptions = { tsconfig, ...baseOpts };

    if (typeof callback === 'function') return worker(src, dest, opts, callback);
    return new Promise((resolve, reject) => worker(src, dest, opts, (err, result) => (err ? reject(err) : resolve(result))));
  } catch (err) {
    if (callback) callback(err);
    else return Promise.reject(err);
  }
}
