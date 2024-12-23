import fs from 'fs';
import path from 'path';
import installModule from 'install-module-linked';
import Queue from 'queue-cb';
import resolve from 'resolve';
import resolveOnce from 'resolve-once-cb';
// @ts-ignore
import lazy from './lazy.cjs';
const swc = lazy('@swc/core');

function installBindings(callback) {
  const swcPackagePath = resolve.sync('@swc/core/package.json');
  const swcDir = path.dirname(path.dirname(swcPackagePath));
  const { optionalDependencies } = JSON.parse(fs.readFileSync(swcPackagePath, 'utf8'));
  const depKey = `${process.platform}-${process.arch}`;

  const queue = new Queue();
  Object.keys(optionalDependencies)
    .filter((name) => name.indexOf(depKey) >= 0)
    .map((name) => {
      queue.defer((callback) => {
        const version = optionalDependencies[name];
        const installString = `${name}${version ? `@${version}` : ''}`;
        installModule(installString, path.dirname(swcDir), callback);
      });
    });
  queue.await(callback);
}

function loadSWC(callback) {
  installBindings((err) => {
    if (err) return callback(err);
    try {
      return callback(null, swc());
    } catch (err) {
      return callback(err);
    }
  });
}

export default resolveOnce(loadSWC);
