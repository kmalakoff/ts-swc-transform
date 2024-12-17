import path from 'path';
import Iterator from 'fs-iterator';
import getTS from 'get-tsconfig-compat';

// @ts-ignore
import createMatcher from './createMatcher.ts';
// @ts-ignore
import transformFile from './transformFile.ts';

function transformDirectoryCallback(src, dest, type, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};

  if (typeof src !== 'string') throw new Error('transformDirectory: unexpected source');
  if (typeof dest !== 'string') throw new Error('transformDirectory: unexpected destination directory');
  if (typeof type !== 'string') throw new Error('transformDirectory: unexpected type');

  const tsconfig = options.tsconfig ? options.tsconfig : getTS.getTsconfig(src);
  const matcher = createMatcher(tsconfig);

  options = { ...options, tsconfig };
  const iterator = new Iterator(src);
  iterator.forEach(
    (entry, cb) => {
      if (!entry.stats.isFile()) return cb();
      if (!matcher(entry.fullPath)) return cb();
      transformFile(entry.fullPath, path.dirname(path.join(dest, entry.path)), type, options, cb);
    },
    { callbacks: true, concurrency: options.concurrency || 1024 },
    callback
  );
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

  if (typeof callback === 'function') return transformDirectoryCallback(src, dest, type, options, callback);
  return new Promise((resolve, reject) => {
    transformDirectoryCallback(src, dest, type, options, function compileCallback(err, result) {
      err ? reject(err) : resolve(result);
    });
  });
}
