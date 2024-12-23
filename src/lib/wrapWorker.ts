// @ts-ignore
import lazy from './lazy.cjs';
const call = lazy('node-version-call');

export default function wrapWorker(worker, workerPath: string, version: string, sync?: boolean) {
  function workerWrapperAsync(...args) {
    if (version === 'local') return worker.apply(null, args);

    const callback = args.pop();
    try {
      callback(null, call()({ version, callbacks: true }, workerPath, ...args));
    } catch (err) {
      callback(err);
    }
  }

  function workerWrapperSync(...args) {
    if (version === 'local') return worker.apply(null, args);
    return call()({ version, callbacks: true }, workerPath, ...args);
  }
  return sync ? workerWrapperSync : workerWrapperAsync;
}