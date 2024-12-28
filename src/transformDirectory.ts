import path from 'path';
import url from 'url';
import wrapWorker from './lib/wrapWorker.js';
const major = +process.versions.node.split('.')[0];
const version = major < 14 ? 'stable' : 'local';
const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const workerWrapper = wrapWorker(path.resolve(__dirname, '..', 'cjs', 'workers', 'transformDirectory.js'));

import type { TransformDirectoryCallback, TransformDirectoryOptions, TransformResult } from './types.js';

/**
 * @param {string} src The source directory to traverse.
 * @param {string} dest The output directory to write files to.
 * @param {string} type The type of transform ('esm' or 'cjs').
 * @param {{sourceMaps: boolean}} options Options to pass to swc.
 * @param {(err?: Error) =>} [callback] Optional callback. Uses promise if callback not provided.
 * @returns {void | Promise<any>} Optional promise if callback not provided.
 */
export default function transformDirectory(src: string, dest: string, type: string, options?: TransformDirectoryOptions | TransformDirectoryCallback, callback?: TransformDirectoryCallback): undefined | Promise<TransformResult[]> {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  options = options || {};
  if (typeof src !== 'string') throw new Error('transformDirectory: unexpected source');
  if (typeof dest !== 'string') throw new Error('transformDirectory: unexpected destination directory');
  if (typeof type !== 'string') throw new Error('transformDirectory: unexpected type');

  if (typeof callback === 'function') return workerWrapper(version, src, dest, type, options, callback);
  return new Promise((resolve, reject) => {
    workerWrapper(version, src, dest, type, options, (err, result) => {
      err ? reject(err) : resolve(result);
    });
  });
}
