const path = require('path');
const fs = require('fs');
const resolve = require('resolve');
const rimraf2Sync = require('rimraf2').sync;

function rimrafSync(filePath) {
  if (rimraf2Sync) rimraf2Sync(filePath, { disableGlob: true });
  else fs.rmSync(filePath, { recursive: true, force: true });
}

const existsSync = (test) => {
  try {
    (fs.accessSync || fs.statSync)(test);
    return true;
  } catch (_) {
    return false;
  }
};

module.exports = function removeBindings(identifier, prefix) {
  const packagePath = resolve.sync(`${identifier}/package.json`);
  const nodeModules = identifier[0] === '@' ? path.join(packagePath, '..', '..', '..') : path.join(packagePath, '..', '..');
  const optionalDependencies = JSON.parse(fs.readFileSync(packagePath, 'utf8')).optionalDependencies;
  const names = Object.keys(optionalDependencies).filter((name) => name.indexOf(prefix) >= 0);
  names.map((name) => {
    const bindingPath = path.join(nodeModules, name);
    if (!existsSync(bindingPath)) return;
    console.log(`Deleting binding: ${bindingPath}`);
    rimrafSync(bindingPath);
  });
};
