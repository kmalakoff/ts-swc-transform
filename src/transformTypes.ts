import Module from 'module';
import { bind } from 'node-version-call';
import path from 'path';
import loadConfigSync from 'read-tsconfig-sync';
import url from 'url';

import type { ConfigOptions, InternalConfigOptions, TransformTypesCallback } from './types.ts';

const major = +process.versions.node.split('.')[0];
// `node -e`, `node -p` and stdin scripts define require and __filename as globals, so a typeof check alone
// sends the ESM build down the CJS branch there; only the CJS build has module-scoped bindings that differ from the globals.
const _require = typeof require !== 'undefined' && require !== global.require ? require : Module.createRequire(import.meta.url);
const __dirname = path.dirname(typeof __filename !== 'undefined' && __filename !== global.__filename ? __filename : url.fileURLToPath(import.meta.url));
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

    callback = typeof options === 'function' ? options : callback;
    options = typeof options === 'function' ? {} : ((options || {}) as ConfigOptions);
    const tsconfig = options.tsconfig ? options.tsconfig : (loadConfigSync(src) ?? undefined);
    if (!tsconfig) throw new Error('transformTypes: failed to load tsconfig');
    const opts: InternalConfigOptions = { ...options, tsconfig };

    if (typeof callback === 'function') return worker(src, dest, opts, callback);
    return new Promise<string[]>((resolve, reject) => worker(src, dest, opts, (err, result) => (err ? reject(err) : resolve(result ?? []))));
  } catch (err) {
    if (typeof callback === 'function') return callback(err as Error);
    return Promise.reject(err);
  }
}
