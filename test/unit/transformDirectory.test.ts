// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
import Promise from 'pinkie-promise';

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
import checkFiles from '../lib/checkFiles.cjs';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const TMP_DIR = path.resolve(__dirname, '..', '..', '.tmp');
const SRC_DIR = path.resolve(__dirname, '..', 'data', 'src');
const FILE_COUNT = 5;
const hasRequire = typeof require !== 'undefined';

function tests({ type, ext, packageType, expectedCount, options, promise }) {
  it(`transformDirectory (${type} options: ${JSON.stringify(options)}) promise: ${!!promise}`, (done) => {
    const queue = new Queue(1);
    queue.defer(async (cb) => {
      if (!promise) return transformDirectory(SRC_DIR, TMP_DIR, type, options, (err, results) => (err ? cb(err) : checkFiles(TMP_DIR, results, expectedCount, options, cb)));
      const results = await transformDirectory(SRC_DIR, TMP_DIR, type, options);
      await checkFiles(TMP_DIR, results, expectedCount, options);
      cb();
    });
    queue.defer(fs.writeFile.bind(null, path.join(TMP_DIR, 'package.json'), `{"type":"${packageType}"}`, 'utf8'));
    hasRequire ||
      queue.defer((cb) => {
        spawn(process.execPath, [`./test${ext}`, 'arg'], { cwd: TMP_DIR, encoding: 'utf8' }, (err, res) => {
          if (err) console.log(err, res);
          assert.ok(!err, err ? err.message : '');
          assert.equal(cr(res.stdout).split('\n').slice(-2)[0], 'Success!');
          cb();
        });
      });
    queue.await((err) => {
      !err || console.error(err);
      done(err);
    });
  });
}

describe(`transformDirectory (${hasRequire ? 'cjs' : 'esm'})`, () => {
  (() => {
    // patch and restore promise
    let rootPromise: Promise;
    before(() => {
      rootPromise = global.Promise;
      global.Promise = Promise;
    });
    after(() => {
      global.Promise = rootPromise;
    });
  })();

  describe('clean directory', () => {
    beforeEach(rimraf2.bind(null, TMP_DIR, { disableGlob: true }));
    after(rimraf2.bind(null, TMP_DIR, { disableGlob: true }));

    tests({ type: 'cjs', ext: '.js', packageType: 'commonjs', expectedCount: FILE_COUNT, options: {}, promise: false });
    tests({ type: 'esm', ext: '.mjs', packageType: 'module', expectedCount: FILE_COUNT, options: {}, promise: false });
    tests({ type: 'cjs', ext: '.js', packageType: 'commonjs', expectedCount: FILE_COUNT, options: { sourceMaps: true }, promise: false });
    tests({ type: 'esm', ext: '.mjs', packageType: 'module', expectedCount: FILE_COUNT, options: { sourceMaps: true }, promise: false });
    tests({ type: 'cjs', ext: '.js', packageType: 'commonjs', expectedCount: FILE_COUNT, options: {}, promise: true });
  });
});
