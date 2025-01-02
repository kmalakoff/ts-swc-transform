import installBindings from '../workers/installBindings';
export default installBindings;

import path from 'path';
import url from 'url';

import Module from 'module';
import lazy from 'lazy-cache';
const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const __dirname = path.dirname(typeof __filename === 'undefined' ? url.fileURLToPath(import.meta.url) : __filename);
const workerPath = path.resolve(__dirname, '..', '..', 'cjs', 'workers', 'installBindings.cjs');
const major = +process.versions.node.split('.')[0];
const version = major < 14 ? 'stable' : 'local';

const call = lazy(_require)('node-version-call');
import memoize from 'lodash.memoize';
export const sync = memoize(() => call()({ version, callbacks: true }, workerPath));
