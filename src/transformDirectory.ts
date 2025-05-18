import path from 'path';
import url from 'url';
import loadTsConfig from './loadTsConfig.js';

const major = +process.versions.node.split('.')[0];
const version = major < 14 ? 'stable' : 'local';
const __dirname = path.dirname(typeof __filename === 'undefined' ? url.fileURLToPath(import.meta.url) : __filename);
const workerPath = path.join(__dirname, '..', 'cjs', 'workers', 'transformDirectory.js');

import Module from 'module';
const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;

function dispatch(version, src, dest, type, options, callback) {
  if (version === 'local') return _require(workerPath)(src, dest, type, options, callback);
  try {
    callback(null, _require('node-version-call')({ version, callbacks: true }, workerPath, src, dest, type, options));
  } catch (err) {
    callback(err);
  }
}

import type { ConfigOptions, TransformDirectoryCallback } from './types';
/**
 * @param {string} src The source directory to traverse.
 * @param {string} dest The output directory to write files to.
 * @param {string} type The type of transform ('esm' or 'cjs').
 * @param {{sourceMaps: boolean}} options Options to pass to swc.
 * @param {(err?: Error) =>} [callback] Optional callback. Uses promise if callback not provided.
 * @returns {void | Promise<any>} Optional promise if callback not provided.
 */
export default function transformDirectory(src: string, dest: string, type: string, options?: ConfigOptions | TransformDirectoryCallback, callback?: TransformDirectoryCallback): undefined | Promise<string[]> {
  try {
    if (typeof src !== 'string') throw new Error('transformDirectory: unexpected source');
    if (typeof dest !== 'string') throw new Error('transformDirectory: unexpected destination directory');
    if (typeof type !== 'string') throw new Error('transformDirectory: unexpected type');

    if (typeof options === 'function') {
      callback = options as TransformDirectoryCallback;
      options = null;
    }
    options = options || {};
    const tsconfig = loadTsConfig({ cwd: src, ...options }, 'transformDirectory');
    options = { tsconfig, ...options };

    if (typeof callback === 'function') return dispatch(version, src, dest, type, options, callback) as undefined;
    return new Promise((resolve, reject) => dispatch(version, src, dest, type, options, (err, result) => (err ? reject(err) : resolve(result))));
  } catch (err) {
    if (callback) callback(err);
    else return Promise.reject(err);
  }
}
