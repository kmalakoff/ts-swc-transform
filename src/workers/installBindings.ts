import fs from 'fs';
import path from 'path';
import installModule from 'install-module-linked';
import resolve from 'resolve';

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

export default function installBindings(target, callback) {
  const { name, version, nodeModules } = getDependencyInfo(target);
  const installString = version ? `${name}@${version}` : name;

  installModule(installString, nodeModules, (err) => {
    console.log(`installed ${path.join(nodeModules, name)} ${!err ? 'successfully' : 'with errors: ${err.message}'}`);
    callback(err);
  });
}
