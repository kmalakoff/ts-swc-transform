const path = require('path');
const fs = require('fs');
const resolveOnce = require('resolve-once-cb');
const findDependency = require('./findDependency.cjs');

const workerPath = path.join(__dirname, 'install.cjs');

const existsSync = (test) => {
  try {
    (fs.accessSync || fs.statSync)(test);
    return true;
  } catch (_) {
    return false;
  }
};

const bindings = {};
module.exports = function ensureBindings(identifier, target, callback) {
  if (bindings[identifier] === undefined) bindings[identifier] = {};
  if (bindings[identifier][target] === undefined) {
    bindings[identifier][target] = resolveOnce((cb) => {
      const { name, nodeModules } = findDependency(identifier, target);
      return existsSync(path.join(nodeModules, name)) ? cb() : require(workerPath)(identifier, target, cb);
    });
  }
  bindings[identifier][target](callback);
};

const bindingsSync = {};
module.exports.sync = (identifier, target) => {
  if (bindingsSync[identifier] === undefined) bindingsSync[identifier] = {};
  if (bindingsSync[identifier][target] === undefined) {
    bindingsSync[identifier][target] = (() => {
      const { name, nodeModules } = findDependency(identifier, target);
      return existsSync(path.join(nodeModules, name)) ? target : require('function-exec-sync')({ callbacks: true }, workerPath, identifier, target);
    })();
  }
};
