import path from 'path';
import url from 'url';

// @ts-ignore
import lazy from './lib/lazy.cjs';
import packageRoot from './lib/packageRoot.js';
import version from './lib/transformVersion.js';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const root = packageRoot(__dirname);
const worker = path.resolve(root, 'dist', 'cjs', 'workers', 'transformDirectory.js');
const call = lazy('node-version-call');

function transformDirectoryCallback(src, dest, type, options, callback) {
  try {
    const res = call()({ version, callbacks: true }, worker, src, dest, type, options);
    return callback(null, res);
  } catch (err) {
    return callback(err);
  }
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
