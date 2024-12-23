import path from 'path';
import url from 'url';
import wrapWorker from './lib/wrapWorker.js';
import worker from './workers/transformTypes.js';
const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const workerPath = path.resolve(__dirname, '..', 'cjs', 'transformTypes.js');
const major = +process.versions.node.split('.')[0];
const version = major < 14 ? 'lts' : 'local';
const workerWrapper = wrapWorker(worker, workerPath, version);

/**
 * @param {string} src The source directory to traverse.
 * @param {string} dest The output directory to write files to.
 * @param {{tsconfig: TsConfigResult}} options Options.
 * @param {(err?: Error) =>} [callback] Optional callback. Uses promise if callback not provided.
 * @returns {void | Promise<any>} Optional promise if callback not provided.
 */
export default function transformTypes(src, dest, _type, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  options = options || {};
  if (typeof src !== 'string') throw new Error('transformTypes: unexpected source');
  if (typeof dest !== 'string') throw new Error('transformTypes: unexpected destination directory');

  if (typeof callback === 'function') return workerWrapper(src, dest, options, callback);
  return new Promise((resolve, reject) => {
    workerWrapper(src, dest, options, (err, result) => {
      err ? reject(err) : resolve(result);
    });
  });
}