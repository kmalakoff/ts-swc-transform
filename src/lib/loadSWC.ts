import installBindings from './installBindings.js';
// @ts-ignore
import lazy from './lazy.cjs';
const lazySWC = lazy('@swc/core');

let swc = null;
let err: Error = null;
export default function loadSWC(callback) {
  if (swc) return callback(null, swc);
  if (err) return callback(err);

  installBindings((err_) => {
    err = err || err_;
    if (err) return callback(err);
    try {
      swc = swc || lazySWC();
      return callback(null, swc);
    } catch (err_) {
      err = err || err_;
      return callback(err);
    }
  });
}
