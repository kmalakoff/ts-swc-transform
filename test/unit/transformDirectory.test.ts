import path from 'path';
import url from 'url';
import rimraf2 from 'rimraf2';

import assert from 'assert';
import fs from 'fs';
import cr from 'cr';
import spawn from 'cross-spawn-cb';
import Queue from 'queue-cb';

// @ts-ignore
import { transformDirectory } from 'ts-swc-transform';

import fileCount from '../lib/fileCount.cjs';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(url.fileURLToPath(import.meta.url));
const TMP_DIR = path.resolve(dirname, '..', '..', '.tmp');
const SRC_DIR = path.resolve(dirname, '..', 'data', 'src');
const FILE_COUNT = 6;
const hasPromise = typeof Promise !== 'undefined';
const hasRequire = typeof require !== 'undefined';

function tests({ transformDirectory, type, ext, packageType, expectedCount, options, promise }) {
  it(`transformDirectory (${type} options: ${JSON.stringify(options)}) promise: ${!!promise}`, (done) => {
    const queue = new Queue(1);
    queue.defer((cb) => {
      if (!promise) return transformDirectory(SRC_DIR, TMP_DIR, type, options, cb);
      transformDirectory(SRC_DIR, TMP_DIR, type, options)
        .then(() => cb())
        .catch(cb);
    });
    queue.defer(fs.writeFile.bind(null, path.join(TMP_DIR, 'package.json'), `{"type":"${packageType}"}`, 'utf8'));
    queue.defer((cb) => {
      fileCount(TMP_DIR, (err, count) => {
        assert.ok(!err, err ? err.message : '');
        assert.equal(count, expectedCount);
        cb();
      });
    });
    hasRequire ||
      queue.defer((cb) => {
        spawn(process.execPath, [`./test${ext}`, 'arg'], { cwd: TMP_DIR, encoding: 'utf8' }, (err, res) => {
          assert.ok(!err, err ? err.message : '');
          assert.equal(cr(res.stdout).split('\n').slice(-2)[0], 'Success!');
          cb();
        });
      });
    queue.await((err) => {
      assert.ok(!err, err ? err.message : '');
      done();
    });
  });
}

describe(`transformDirectory (${hasRequire ? 'cjs' : 'esm'})`, () => {
  beforeEach((cb) => rimraf2(TMP_DIR, { disableGlob: true }, cb.bind(null, null)));
  after((cb) => rimraf2(TMP_DIR, { disableGlob: true }, cb.bind(null, null)));

  tests({ transformDirectory, type: 'cjs', ext: '.js', packageType: 'commonjs', expectedCount: FILE_COUNT + 1, options: {}, promise: false });
  tests({ transformDirectory, type: 'esm', ext: '.mjs', packageType: 'module', expectedCount: FILE_COUNT + 1, options: {}, promise: false });
  tests({ transformDirectory, type: 'cjs', ext: '.js', packageType: 'commonjs', expectedCount: 2 * FILE_COUNT + 1, options: { sourceMaps: true }, promise: false });
  tests({ transformDirectory, type: 'esm', ext: '.mjs', packageType: 'module', expectedCount: 2 * FILE_COUNT + 1, options: { sourceMaps: true }, promise: false });
  !hasPromise || tests({ transformDirectory, type: 'cjs', ext: '.js', packageType: 'commonjs', expectedCount: FILE_COUNT + 1, options: {}, promise: true });
});
