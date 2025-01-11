// bail early
var useCJS = !require('module').createRequire;
if (useCJS) {
  module.exports.moduleResolve = function () { return null };
  module.exports.resolve = function () { return null };
  return;
}
