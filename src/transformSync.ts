import path from 'path';
import url from 'url';

// @ts-ignore
import lazy from './lib/lazy.cjs';
import packageRoot from './lib/packageRoot.js';
// @ts-ignore
import process from './lib/process.cjs';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const major = +process.versions.node.split('.')[0];
const version = major < 14 ? '14' : 'local';
const root = packageRoot(__dirname, 'ts-swc-transform');
const worker = path.resolve(root, 'dist', 'cjs', 'workers', 'transformSync.js');
const call = lazy('node-version-call');

/**
 * @param {string} contents The file contents.
 * @param {string} fileName The filename.
 * @returns {{ code: string, map?: string }} Returns object with the transformed code and source map if option sourceMaps was provided.
 */
export default function transformSync(contents, fileName, config) {
  return call()({ version, callbacks: true }, worker, contents, fileName, config);
}
