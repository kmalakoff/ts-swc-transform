import fs from 'fs';
import path from 'path';
import Queue from 'queue-cb';
import resolve from 'resolve';
import installModule from './install-module/index.js';
export default function installBindings(callback) {
  const swcPackagePath = resolve.sync('@swc/core/package.json');
  const swcDir = path.dirname(path.dirname(swcPackagePath));
  const { optionalDependencies } = JSON.parse(fs.readFileSync(swcPackagePath, 'utf8'));
  const _installDir = path.dirname(swcDir);
  const depKey = `${process.platform}-${process.arch}`;

  const queue = new Queue();
  Object.keys(optionalDependencies)
    .filter((name) => name.indexOf(depKey) >= 0)
    .map((name) => {
      queue.defer((callback) => {
        const version = optionalDependencies[name];
        const installString = `${name}${version ? `@${version}` : ''}`;
        const installedAt = path.join(path.dirname(swcDir), ...name.split('/'));
        installModule(installString, installedAt, callback);
      });
    });
  queue.await(callback);
}
