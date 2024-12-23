import resolveOnce from 'resolve-once-cb';
import installBindings from './installBindings.js';
// @ts-ignore
import lazy from './lazy.cjs';
const swc = lazy('@swc/core');

function loadSWC(callback) {
  installBindings((err) => {
    if (err) return callback(err);
    try {
      return callback(null, swc());
    } catch (err) {
      return callback(err);
    }
  });
}

export default resolveOnce(loadSWC);
