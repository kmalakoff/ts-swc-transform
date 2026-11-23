import Module from 'module';
import { bind } from 'node-version-call';
import path from 'path';
import loadConfigSync from 'read-tsconfig-sync';
import url from 'url';

import type { ConfigOptions, InternalConfigOptions, TargetType, TransformDirectoryCallback } from './types.ts';

const major = +process.versions.node.split('.')[0];
// `node -e`, `node -p` and stdin scripts define require and __filename as globals, so a typeof check alone
// sends the ESM build down the CJS branch there; only the CJS build has module-scoped bindings that differ from the globals.
const _require = typeof require !== 'undefined' && require !== global.require ? require : Module.createRequire(import.meta.url);
const __dirname = path.dirname(typeof __filename !== 'undefined' && __filename !== global.__filename ? __filename : url.fileURLToPath(import.meta.url));
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
    const tsconfig = options.tsconfig ? options.tsconfig : (loadConfigSync(src) ?? undefined);
    if (!tsconfig) throw new Error('transformDirectory: failed to load tsconfig');
    const opts: InternalConfigOptions = { ...options, tsconfig };

    if (typeof callback === 'function') return worker(src, dest, type, opts, callback);
    return new Promise<string[]>((resolve, reject) => worker(src, dest, type, opts, (err, result) => (err ? reject(err) : resolve(result ?? []))));
  } catch (err) {
    if (typeof callback === 'function') return callback(err as Error);
    return Promise.reject(err);
  }
}
