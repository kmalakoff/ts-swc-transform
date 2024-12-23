import path from 'path';
import url from 'url';

// @ts-ignore
import lazy from '../lib/lazy.cjs';
import packageRoot from '../lib/packageRoot.js';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const root = packageRoot(__dirname);
const worker = path.resolve(root, 'dist', 'cjs', 'workers', 'transformTypes.js');
const version = 'lts';
const call = lazy('node-version-call');

function transformTypesCallback(src, dest, options, callback) {
  try {
    const res = call()({ version, callbacks: true }, worker, src, dest, options);
    return callback(null, res);
  } catch (err) {
    return callback(err);
  }
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
