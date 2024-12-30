import Module from 'module';
import lazy from 'lazy-cache';
const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const call = lazy(_require)('node-version-call');

export default function wrapWorkerSync(workerPath: string) {
  const workerLazy = lazy(_require)(workerPath);

  return function workerWrapperSync(version, ...args) {
    if (version === 'local') return workerLazy().apply(null, args);
    return call()({ version, callbacks: true }, workerPath, ...args);
  };
}
