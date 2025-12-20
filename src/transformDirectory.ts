import Module from 'module';
import { bind } from 'node-version-call';
import path from 'path';
import loadConfigSync from 'read-tsconfig-sync';
import url from 'url';

import type { ConfigOptions, TargetType, TransformDirectoryCallback } from './types.ts';

const major = +process.versions.node.split('.')[0];
const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const __dirname = path.dirname(typeof __filename === 'undefined' ? url.fileURLToPath(import.meta.url) : __filename);
const workerPath = path.join(__dirname, '..', 'cjs', 'workers', 'transformDirectory.js');

function run(src: string, dest: string, type: TargetType, options: ConfigOptions, callback: TransformDirectoryCallback) {
  return _require(workerPath)(src, dest, type, options, callback);
}

// spawnOptions: false - no node/npm spawn (library call only)
const worker = major >= 20 ? run : bind('>=20', workerPath, { callbacks: true, spawnOptions: false });

export default function transformDirectory(src: string, dest: string, type: TargetType, callback: TransformDirectoryCallback): void;
export default function transformDirectory(src: string, dest: string, type: TargetType, options: ConfigOptions, callback: TransformDirectoryCallback): void;
export default function transformDirectory(src: string, dest: string, type: TargetType): Promise<string[]>;
export default function transformDirectory(src: string, dest: string, type: TargetType, options: ConfigOptions): Promise<string[]>;
export default function transformDirectory(src: string, dest: string, type: TargetType, options?: ConfigOptions | TransformDirectoryCallback, callback?: TransformDirectoryCallback): void | Promise<string[]> {
  try {
    if (typeof src !== 'string') throw new Error('transformDirectory: unexpected source');
    if (typeof dest !== 'string') throw new Error('transformDirectory: unexpected destination directory');
    if (typeof type !== 'string') throw new Error('transformDirectory: unexpected type');

    callback = typeof options === 'function' ? options : callback;
    options = typeof options === 'function' ? {} : ((options || {}) as ConfigOptions);
    const tsconfig = options.tsconfig ? options.tsconfig : loadConfigSync(src);
    const opts: ConfigOptions = { tsconfig, ...options };

    if (typeof callback === 'function') return worker(src, dest, type, opts, callback);
    return new Promise((resolve, reject) =>
      worker(src, dest, type, opts, (err, result) => {
        err ? reject(err) : resolve(result);
      })
    );
  } catch (err) {
    if (callback) callback(err);
    else return Promise.reject(err);
  }
}
