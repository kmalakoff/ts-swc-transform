const path = require('path');
const fs = require('fs');
const lazy = require('lazy-cache');
const resolveOnceMap = require('resolve-once-map-cb');
const installBindings = require('../workers/installBindings');
const findDependency = require('./findDependency.cjs');

const workerPath = path.join(__dirname, 'workers', 'installBindings.cjs');
const major = +process.versions.node.split('.')[0];
const version = major < 14 ? 'stable' : 'local';

const existsSync = (test) => {
  try {
    (fs.accessSync || fs.statSync)(test);
    return true;
  } catch (_) {
    return false;
  }
};

const install = lazy((target) => {
  const { name, modulePath } = findDependency('@swc/core', target);
  return existsSync(path.join(modulePath, '..', 'node_modules', name)) ? target : require('node-version-call')({ version, callbacks: true }, workerPath, target);
});

module.exports = resolveOnceMap((target, callback) => {
  const { name, modulePath } = findDependency('@swc/core', target);
  return existsSync(path.join(modulePath, '..', 'node_modules', name)) ? callback() : installBindings(target, callback);
});
module.exports.sync = (target) => install(target)();
