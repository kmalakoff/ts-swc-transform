import fs from 'fs';
import path from 'path';
import { sync as installModuleSync } from 'install-module-linked';
import resolve from 'resolve';

const existsSync = (test) => {
  try {
    (fs.accessSync || fs.statSync)(test);
    return true;
  } catch (_) {
    return false;
  }
};

const bindingsSync = {};
export default function ensureBindingsSync(identifier, target) {
  if (bindingsSync[identifier] === undefined) bindingsSync[identifier] = {};
  if (bindingsSync[identifier][target] === undefined) {
    bindingsSync[identifier][target] = (() => {
      const packagePath = resolve.sync(`${identifier}/package.json`);
      const nodeModules = identifier[0] === '@' ? path.join(packagePath, '..', '..', '..') : path.join(packagePath, '..', '..');
      const optionalDependencies = JSON.parse(fs.readFileSync(packagePath, 'utf8')).optionalDependencies;
      const name = Object.keys(optionalDependencies).find((name) => name.indexOf(target) >= 0);
      if (!existsSync(path.join(nodeModules, name))) installModuleSync(`${name}@${optionalDependencies[name]}`, nodeModules);
    })();
  }
}
