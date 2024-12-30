import path from 'path';
import url from 'url';
import wrapWorker from './lib/wrapWorker.js';
const major = +process.versions.node.split('.')[0];
const version = major < 14 ? 'stable' : 'local';
const __dirname = path.dirname(typeof __filename === 'undefined' ? url.fileURLToPath(import.meta.url) : __filename);
const workerWrapper = wrapWorker(path.resolve(__dirname, '..', 'cjs', 'workers', 'transformFile.js'));

import type { TransformFileCallback, TransformFileOptions } from './types.js';

/**
 * @param {string} src The source directory to traverse.
 * @param {string} dest The output directory to write files to.
 * @param {string} type The type of transform ('esm' or 'cjs').
 * @param {{sourceMaps: boolean}} options Options to pass to swc.
 * @param {(err?: Error) =>} [callback] Optional callback. Uses promise if callback not provided.
 * @returns {void | Promise<any>} Optional promise if callback not provided.
 */
export default function transformFile(src: string, dest: string, type: string, options?: TransformFileOptions | TransformFileCallback, callback?: TransformFileCallback): undefined | Promise<string> {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  options = options || {};
  if (typeof src !== 'string') throw new Error('transformFile: unexpected source');
  if (typeof dest !== 'string') throw new Error('transformFile: unexpected destination directory');
  if (typeof type !== 'string') throw new Error('transformFile: unexpected type');

  if (typeof callback === 'function') return workerWrapper(version, src, dest, type, options, callback);
  return new Promise((resolve, reject) =>
    workerWrapper(version, src, dest, type, options, (err?: Error, result?: string) => {
      err ? reject(err) : resolve(result);
    })
  );
}
