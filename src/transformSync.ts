import path from 'path';
import url from 'url';
// @ts-ignore
import lazy from './lazy.cts';
// @ts-ignore
import process from './process.cts';

const major = +process.versions.node.split('.')[0];
const version = major >= 14 ? 'local' : 'lts';
const filename = typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url);
const worker = path.resolve(path.dirname(filename), 'workers', `transformSync${path.extname(filename) === '.mjs' ? '.cjs' : '.js'}`);
const call = lazy('node-version-call');

/**
 * @param {string} contents The file contents.
 * @param {string} fileName The filename.
 * @returns {{ code: string, map?: string }} Returns object with the transformed code and source map if option sourceMaps was provided.
 */
export default function transformSync(contents, fileName, config) {
  return call()(version, worker, contents, fileName, config);
}
