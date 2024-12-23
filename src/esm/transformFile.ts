import transformFileCallbackCJS from '../cjs/transformFile.js';
import transformFileCallbackWorker from '../workers/transformFile.js';

// @ts-ignore
import lazy from '../lib/lazy.cjs';
let transformFileCallback = transformFileCallbackWorker;
try {
  // typescript cannot be loaded so run in lts
  lazy('typescript')();
} catch {
  transformFileCallback = transformFileCallbackCJS;
}

/**
 * @param {string} src The source directory to traverse.
 * @param {string} dest The output directory to write files to.
 * @param {string} type The type of transform ('esm' or 'cjs').
 * @param {{sourceMaps: boolean}} options Options to pass to swc.
 * @param {(err?: Error) =>} [callback] Optional callback. Uses promise if callback not provided.
 * @returns {void | Promise<any>} Optional promise if callback not provided.
 */
export default function transformFile(src, dest, type, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  options = options || {};
  if (typeof src !== 'string') throw new Error('transformFile: unexpected source');
  if (typeof dest !== 'string') throw new Error('transformFile: unexpected destination directory');
  if (typeof type !== 'string') throw new Error('transformFile: unexpected type');

  if (typeof callback === 'function') return transformFileCallback(src, dest, type, options, callback);
  return new Promise((resolve, reject) => {
    transformFileCallback(src, dest, type, options, function compileCallback(err, result) {
      err ? reject(err) : resolve(result);
    });
  });
}
