import fs from 'fs';
import os from 'os';
import path from 'path';
import access from 'fs-access-compat';
import ensureCached from './lib/ensureCached.js';

const isWindows = process.platform === 'win32' || /^(msys|cygwin)$/.test(process.env.OSTYPE);
const symlinkType = isWindows ? 'junction' : 'dir';
const cache = path.join(os.tmpdir(), 'ts-swc-transform', 'cache');

export default function installModule(installString, installedAt, callback) {
  access(installedAt, (err) => {
    if (!err) return callback(); // already installed
    const cachedAt = path.join(cache, installString);

    ensureCached(installString, cachedAt, (err) => {
      if (err) {
        console.log(`Unsupported version: ${installString}`);
        return callback();
      }

      fs.symlink(cachedAt, installedAt, symlinkType, (err) => {
        if (err) return callback(err);
        access(installedAt, callback);
      });
    });
  });
}
