const path = require('path');
const installModule = require('install-module-linked');
const findDependency = require('../lib/findDependency.cjs');

module.exports = function installBindings(target, callback) {
  const { name, version, modulePath } = findDependency('@swc/core/package.json', target);
  const nodeModules = path.join(modulePath, '..', 'node_modules');
  const installString = version ? `${name}@${version}` : name;

  installModule(installString, nodeModules, (err) => {
    console.log(`installed ${path.join(nodeModules, name)} ${!err ? 'successfully' : 'with errors: ${err.message}'}`);
    callback(err);
  });
};
