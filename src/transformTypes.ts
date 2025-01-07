import path from 'path';
import url from 'url';
import loadTsConfig from './loadTsConfig';

const major = +process.versions.node.split('.')[0];
const version = major < 14 ? 'stable' : 'local';
const __dirname = path.dirname(typeof __filename === 'undefined' ? url.fileURLToPath(import.meta.url) : __filename);
const workerPath = path.join(__dirname, '..', 'cjs', 'workers', 'transformTypes.cjs');

import Module from 'module';
const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;

function dispatch(version, src, dest, options, callback) {
  if (version === 'local') return _require(workerPath)(src, dest, options, callback);
  try {
    callback(null, _require('node-version-call')({ version, callbacks: true }, workerPath, src, dest, options));
  } catch (err) {
    callback(err);
  }
}

import type { ConfigOptions, TransformTypesCallback } from './types';
/**
 * @param {string} src The source directory to traverse.
 * @param {string} dest The output directory to write files to.
 * @param {{tsconfig: TsConfigResult}} options Options.
 * @param {(err?: Error) =>} [callback] Optional callback. Uses promise if callback not provided.
 * @returns {void | Promise<any>} Optional promise if callback not provided.
 */
export default function transformTypes(src: string, dest: string, options?: ConfigOptions | TransformTypesCallback, callback?: TransformTypesCallback): undefined | Promise<string[]> {
  try {
    if (typeof src !== 'string') throw new Error('transformTypes: unexpected source');
    if (typeof dest !== 'string') throw new Error('transformTypes: unexpected destination directory');

    if (typeof options === 'function') {
      callback = options as TransformTypesCallback;
      options = null;
    }
    options = options || {};
    const tsconfig = loadTsConfig({ cwd: src, ...options }, 'transformTypes');
    options = { tsconfig, ...options };

    if (typeof callback === 'function') return dispatch(version, src, dest, options, callback);
    return new Promise((resolve, reject) => dispatch(version, src, dest, options, (err, result) => (err ? reject(err) : resolve(result))));
  } catch (err) {
    if (callback) callback(err);
    else return Promise.reject(err);
  }
}
