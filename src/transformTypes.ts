import path from 'path';
import url from 'url';
// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
import Promise from 'pinkie-promise';
import wrapWorker from './lib/wrapWorker.js';
const major = +process.versions.node.split('.')[0];
const version = major < 14 ? 'stable' : 'local';
const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const workerWrapper = wrapWorker(path.resolve(__dirname, '..', 'cjs', 'workers', 'transformTypes.js'));

import type { TransformTypesCallback, TransformTypesOptions } from './types.js';

/**
 * @param {string} src The source directory to traverse.
 * @param {string} dest The output directory to write files to.
 * @param {{tsconfig: TsConfigResult}} options Options.
 * @param {(err?: Error) =>} [callback] Optional callback. Uses promise if callback not provided.
 * @returns {void | Promise<any>} Optional promise if callback not provided.
 */
export default function transformTypes(src: string, dest: string, options?: TransformTypesOptions | TransformTypesCallback, callback?: TransformTypesCallback): undefined | Promise<undefined> {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  options = options || {};
  if (typeof src !== 'string') throw new Error('transformTypes: unexpected source');
  if (typeof dest !== 'string') throw new Error('transformTypes: unexpected destination directory');

  if (typeof callback === 'function') return workerWrapper(version, src, dest, options, callback);
  return new Promise((resolve, reject) => {
    workerWrapper(version, src, dest, options, (err, result) => {
      err ? reject(err) : resolve(result);
    });
  });
}
