import fs from 'fs';
import os from 'os';
import path from 'path';
import spawn from 'cross-spawn-cb';
import mkdirp from 'mkdirp-classic';
import Queue from 'queue-cb';
import resolve from 'resolve';
import rimraf2 from 'rimraf2';
import tempSuffix from 'temp-suffix';
import existsSync from './existsSync.js';
// @ts-ignore
import process from './process.cjs';

const isWindows = process.platform === 'win32' || /^(msys|cygwin)$/.test(process.env.OSTYPE);
const symlinkType = isWindows ? 'junction' : 'dir';
const cache = path.join(os.tmpdir(), 'ts-swc-transform', 'cache');

function ensureCached(name, installString, cachedAt, callback) {
  if (existsSync(cachedAt)) return callback();

  const tmp = `${cachedAt}.${tempSuffix()}`;
  const installedAt = path.join(tmp, 'node_modules', ...name.split('/'));
  const { NODE_OPTIONS, ...env } = process.env;

  const queue = new Queue(1);
  queue.defer(mkdirp.bind(null, tmp));
  queue.defer(fs.writeFile.bind(null, path.join(tmp, 'package.json'), '{}', 'utf8'));
  queue.defer(spawn.bind(null, 'npm', ['install', installString], { cwd: tmp, env }));
  queue.defer((cb) => fs.rename(installedAt, cachedAt, cb.bind(null, null)));
  queue.await(() => {
    // clean up whether installed or not
    rimraf2(tmp, { disableGlob: true }, callback);
  });
}

export default function installBindings(callback) {
  const swcPackagePath = resolve.sync('@swc/core/package.json');
  const swcDir = path.dirname(path.dirname(swcPackagePath));
  const { optionalDependencies } = JSON.parse(fs.readFileSync(swcPackagePath, 'utf8'));
  const installDir = path.dirname(swcDir);
  const depKey = `${process.platform}-${process.arch}`;

  const queue = new Queue();
  Object.keys(optionalDependencies)
    .filter((name) => name.indexOf(depKey) >= 0)
    .filter((name) => !existsSync(path.join(installDir, name)))
    .map((name) => {
      queue.defer((callback) => {
        const version = optionalDependencies[name];
        const installString = `${name}${version ? `@${version}` : ''}`;
        const installedAt = path.join(path.dirname(swcDir), ...name.split('/'));
        const cachedAt = path.join(cache, installString);

        ensureCached(name, installString, cachedAt, () => {
          if (!existsSync(cachedAt)) {
            console.log(`Unsupported version: ${installString}`);
            return callback();
          }

          fs.symlink(cachedAt, installedAt, symlinkType, (err) => {
            err && !existsSync(installedAt) ? callback(err) : callback();
          });
        });
      });
    });
  queue.await(callback);
}
