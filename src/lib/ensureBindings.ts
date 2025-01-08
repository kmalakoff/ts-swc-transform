import fs from 'fs';
import path from 'path';
import installModule, { sync as installModuleSync } from 'install-module-linked';
import resolve from 'resolve';
import resolveOnce from 'resolve-once-cb';

const existsSync = (test) => {
  try {
    (fs.accessSync || fs.statSync)(test);
    return true;
  } catch (_) {
    return false;
  }
};

function findDependency(identifier, target) {
  const packagePath = resolve.sync(`${identifier}/package.json`);
  const nodeModules = identifier[0] === '@' ? path.join(packagePath, '..', '..', '..') : path.join(packagePath, '..', '..');
  const optionalDependencies = JSON.parse(fs.readFileSync(packagePath, 'utf8')).optionalDependencies;
  const name = Object.keys(optionalDependencies).find((name) => name.indexOf(target) >= 0);
  return name ? { name, version: optionalDependencies[name], nodeModules } : null;
}

const bindings = {};
export default function ensureBindings(identifier, target, callback) {
  if (bindings[identifier] === undefined) bindings[identifier] = {};
  if (bindings[identifier][target] === undefined) {
    bindings[identifier][target] = resolveOnce((cb) => {
      const { name, version, nodeModules } = findDependency(identifier, target);
      const installString = version ? `${name}@${version}` : name;
      return existsSync(path.join(nodeModules, name)) ? cb() : installModule(installString, nodeModules, cb);
    });
  }
  bindings[identifier][target](callback);
}

const bindingsSync = {};
export function sync(identifier, target) {
  if (bindingsSync[identifier] === undefined) bindingsSync[identifier] = {};
  if (bindingsSync[identifier][target] === undefined) {
    bindingsSync[identifier][target] = (() => {
      const { name, version, nodeModules } = findDependency(identifier, target);
      const installString = version ? `${name}@${version}` : name;
      return existsSync(path.join(nodeModules, name)) ? target : installModuleSync(installString, nodeModules);
    })();
  }
}
