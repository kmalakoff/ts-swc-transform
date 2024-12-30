import path from 'path';
import url from 'url';
import loadTsConfig from './loadTsConfig.js';

const major = +process.versions.node.split('.')[0];
const version = major < 14 ? 'stable' : 'local';
const __dirname = path.dirname(typeof __filename === 'undefined' ? url.fileURLToPath(import.meta.url) : __filename);
import wrapWorker from './lib/wrapWorker.js';
const workerWrapper = wrapWorker(path.resolve(__dirname, '..', 'cjs', 'workers', 'transformTypes.js'));

import type { ConfigOptions, TransformResult, TransformTypesCallback } from './types.js';

/**
 * @param {string} src The source directory to traverse.
 * @param {string} dest The output directory to write files to.
 * @param {{tsconfig: TsConfigResult}} options Options.
 * @param {(err?: Error) =>} [callback] Optional callback. Uses promise if callback not provided.
 * @returns {void | Promise<any>} Optional promise if callback not provided.
 */
export default function transformTypes(src: string, dest: string, options?: ConfigOptions | TransformTypesCallback, callback?: TransformTypesCallback): undefined | Promise<TransformResult[]> {
  try {
    if (typeof src !== 'string') throw new Error('transformTypes: unexpected source');
    if (typeof dest !== 'string') throw new Error('transformTypes: unexpected destination directory');

    if (typeof options === 'function') {
      callback = options as TransformTypesCallback;
      options = null;
    }
    options = options || {};
    const tsconfig = loadTsConfig({ cwd: src, ...options }, 'transformFile');
    options = { tsconfig, ...options };

    if (typeof callback === 'function') return workerWrapper(version, src, dest, options, callback);
    return new Promise((resolve, reject) =>
      workerWrapper(version, src, dest, options, (err, result) => {
        err ? reject(err) : resolve(result);
      })
    );
  } catch (err) {
    console.log(err);
    if (callback) callback(err);
    else return Promise.reject(err);
  }
}
