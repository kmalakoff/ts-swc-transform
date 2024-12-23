import transformTypesCallbackCJS from '../cjs/transformTypes.js';
import transformTypesCallbackWorker from '../workers/transformTypes.js';

// @ts-ignore
import lazy from '../lib/lazy.cjs';
let transformTypesCallback = transformTypesCallbackCJS;
try {
  // typescript cannot be loaded so run in lts
  lazy('typescript')();
  lazy('tsc')();
} catch {
  transformTypesCallback = transformTypesCallbackCJS;
}

/**
 * @param {string} src The source directory to traverse.
 * @param {string} dest The output directory to write files to.
 * @param {{tsconfig: TsConfigResult}} options Options.
 * @param {(err?: Error) =>} [callback] Optional callback. Uses promise if callback not provided.
 * @returns {void | Promise<any>} Optional promise if callback not provided.
 */
export default function transformTypes(src, dest, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  options = options || {};
  if (typeof src !== 'string') throw new Error('transformTypes: unexpected source');
  if (typeof dest !== 'string') throw new Error('transformTypes: unexpected destination directory');

  if (typeof callback === 'function') return transformTypesCallback(src, dest, options, callback);
  return new Promise((resolve, reject) => {
    transformTypesCallback(src, dest, options, function compileCallback(err, result) {
      err ? reject(err) : resolve(result);
    });
  });
}
