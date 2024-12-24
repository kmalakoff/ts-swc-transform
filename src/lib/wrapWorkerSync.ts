// @ts-ignore
import lazy from './lazy.cjs';
const call = lazy('node-version-call');

export default function wrapWorkerSync(workerPath: string) {
  return function workerWrapperSync(version, ...args) {
    if (version === 'local') return lazy(workerPath)().apply(null, args);
    return call()({ version, callbacks: true }, workerPath, ...args);
  };
}
