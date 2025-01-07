const path = require('path');
const fs = require('fs');
const resolve = require('resolve');

module.exports = function findDependency(identifier, target) {
  const packagePath = resolve.sync(`${identifier}/package.json`);
  const nodeModules = identifier[0] === '@' ? path.join(packagePath, '..', '..', '..') : path.join(packagePath, '..', '..');
  const optionalDependencies = JSON.parse(fs.readFileSync(packagePath, 'utf8')).optionalDependencies;
  const name = Object.keys(optionalDependencies).find((name) => name.indexOf(target) >= 0);
  return name ? { name, version: optionalDependencies[name], nodeModules } : null;
};
