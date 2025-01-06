import resolveOnceMap from 'resolve-once-map-cb';
import installBindings, { isInstalled } from '../workers/installBindings';

import path from 'path';
import url from 'url';

import Module from 'module';
import lazy from 'lazy-cache';
const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const __dirname = path.dirname(typeof __filename === 'undefined' ? url.fileURLToPath(import.meta.url) : __filename);
const workerPath = path.join(__dirname, '..', '..', 'cjs', 'workers', 'installBindings.cjs');
const major = +process.versions.node.split('.')[0];
const version = major < 14 ? 'stable' : 'local';

const callLazy = lazy(_require)('node-version-call');
const install = lazy((target) => {
  return isInstalled(target) ? target : callLazy()({ version, callbacks: true }, workerPath, target);
});

export const sync = (target) => install(target)();
export default resolveOnceMap((target, callback) => {
  return isInstalled(target) ? callback() : installBindings(target, callback);
});
