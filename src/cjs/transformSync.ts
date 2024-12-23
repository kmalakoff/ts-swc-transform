import path from 'path';
import url from 'url';
import type { TsConfigResult } from 'get-tsconfig-compat';

// @ts-ignore
import lazy from '../lib/lazy.cjs';
import packageRoot from '../lib/packageRoot.js';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const root = packageRoot(__dirname);
const worker = path.resolve(root, 'dist', 'cjs', 'workers', 'transformSync.js');
const version = 'lts';
const call = lazy('node-version-call');

/**
 * @param {string} contents The file contents.
 * @param {string} fileName The filename.
 * @param {TsConfigResult} tsconfig The configuration.
 * @returns {{ code: string, map?: string }} Returns object with the transformed code and source map if option sourceMaps was provided.
 */
export default function transformSync(contents: string, fileName: string, tsconfig: TsConfigResult) {
  return call()({ version, callbacks: true }, worker, contents, fileName, tsconfig);
}
