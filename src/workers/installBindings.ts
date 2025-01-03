import fs from 'fs';
import path from 'path';
import installModule from 'install-module-linked';
import resolve from 'resolve';
import resolveOnceMap from 'resolve-once-map-cb';

export function getDependencyInfo(target) {
  const packagePath = resolve.sync('@swc/core/package.json');
  const nodeModules = path.dirname(path.dirname(path.dirname(packagePath)));
  const optionalDependencies = JSON.parse(fs.readFileSync(packagePath, 'utf8')).optionalDependencies;
  const name = Object.keys(optionalDependencies).find((name) => name.indexOf(target) >= 0);
  return { name, version: optionalDependencies[name], nodeModules };
}

export function isInstalled(target) {
  const { name, nodeModules } = getDependencyInfo(target);
  try {
    fs.statSync(path.join(nodeModules, name));
    return true;
  } catch (_err) {
    return false;
  }
}

export default resolveOnceMap(function installBindings(target, callback) {
  if (isInstalled(target)) return callback();

  const { name, version, nodeModules } = getDependencyInfo(target);
  const installString = version ? `${name}@${version}` : name;

  installModule(installString, nodeModules, (err) => {
    if (err) return callback(err);
    console.log(`installed ${path.join(nodeModules, name)}`);
    callback();
  });
});
