const path = require('path');
const installModule = require('install-module-linked');
const findDependency = require('./findDependency.cjs');

module.exports = function installBindings(identifier, target, callback) {
  const { name, version, nodeModules } = findDependency(identifier, target);
  const installString = version ? `${name}@${version}` : name;

  installModule(installString, nodeModules, (err) => {
    console.log(`installed ${path.join(nodeModules, name)}${!err ? '' : ' with errors: ${err.message}'}`);
    callback(err);
  });
};
