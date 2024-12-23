import transformDirectoryCallbackCJS from '../cjs/transformDirectory.js';
import transformDirectoryCallbackWorker from '../workers/transformDirectory.js';

// @ts-ignore
import lazy from '../lib/lazy.cjs';
let transformDirectoryCallback = transformDirectoryCallbackWorker;
try {
  // typescript cannot be loaded so run in lts
  lazy('typescript')();
} catch {
  transformDirectoryCallback = transformDirectoryCallbackCJS;
}

/**
 * @param {string} src The source directory to traverse.
 * @param {string} dest The output directory to write files to.
 * @param {string} type The type of transform ('esm' or 'cjs').
 * @param {{sourceMaps: boolean}} options Options to pass to swc.
 * @param {(err?: Error) =>} [callback] Optional callback. Uses promise if callback not provided.
 * @returns {void | Promise<any>} Optional promise if callback not provided.
 */
export default function transformDirectory(src, dest, type, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  options = options || {};
  if (typeof src !== 'string') throw new Error('transformDirectory: unexpected source');
  if (typeof dest !== 'string') throw new Error('transformDirectory: unexpected destination directory');
  if (typeof type !== 'string') throw new Error('transformDirectory: unexpected type');

  if (typeof callback === 'function') return transformDirectoryCallback(src, dest, type, options, callback);
  return new Promise((resolve, reject) => {
    transformDirectoryCallback(src, dest, type, options, function compileCallback(err, result) {
      err ? reject(err) : resolve(result);
    });
  });
}
