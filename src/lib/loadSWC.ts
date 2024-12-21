import installBindings from './installBindings.js';
// @ts-ignore
import lazy from './lazy.cjs';
const swc = lazy('@swc/core');

export default function loadSWC(callback) {
  installBindings((err) => {
    err ? callback(err) : callback(null, swc());
  });
}
