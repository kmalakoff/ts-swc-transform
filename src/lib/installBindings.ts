import fs from 'fs';
import os from 'os';
import path from 'path';
import once from 'call-once-fn';
import spawn from 'cross-spawn-cb';
import mkdirp from 'mkdirp-classic';
import Queue from 'queue-cb';
import resolve from 'resolve';
import rimraf2 from 'rimraf2';
import tempSuffix from 'temp-suffix';
import existsSync from './existsSync.js';
// @ts-ignore
import process from './process.cjs';

const swcDir = path.dirname(path.dirname(resolve.sync('@swc/core/package.json')));
const { optionalDependencies } = JSON.parse(fs.readFileSync(path.join(swcDir, 'core', 'package.json'), 'utf8'));
const installDir = path.dirname(swcDir);

export default function installBindings(callback) {
  const depKey = `${process.platform}-${process.arch}`;

  const queue = new Queue();
  Object.keys(optionalDependencies)
    .filter((key) => key.indexOf(depKey) >= 0)
    .filter((key) => !existsSync(path.join(installDir, key)))
    .map((name) => {
      queue.defer((callback) => {
        const install = { name, version: optionalDependencies[name] };
        const { NODE_OPTIONS, ...env } = process.env;
        const installString = `${install.name}${install.version ? `@${install.version}` : ''}`;
        const installParts = install.name.split('/');
        callback = once(callback);
        try {
          const tmp = path.join(os.tmpdir(), 'ts-swc-transform', tempSuffix());
          const source = path.join(tmp, 'node_modules', ...installParts);
          const dest = path.join(path.dirname(path.dirname(path.dirname(require.resolve('@swc/core/package.json')))), ...installParts);

          const queue = new Queue(1);
          queue.defer(mkdirp.bind(null, tmp));
          queue.defer(fs.writeFile.bind(null, path.join(tmp, 'package.json'), '{}', 'utf8'));
          queue.defer(spawn.bind(null, 'npm', ['install', installString], { cwd: tmp, env }));
          queue.defer(fs.rename.bind(null, source, dest));
          queue.await((err) => {
            rimraf2(tmp, { disableGlob: true }, () => callback(err));
          });
        } catch (err) {
          return callback(err);
        }
      });
    });
  queue.await(callback);
}
