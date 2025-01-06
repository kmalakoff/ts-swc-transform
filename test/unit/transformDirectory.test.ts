import fs from 'fs';
import path from 'path';
import url from 'url';
import Pinkie from 'pinkie-promise';
import rimraf2 from 'rimraf2';

import assert from 'assert';
import cr from 'cr';
import spawn from 'cross-spawn-cb';
import Queue from 'queue-cb';

// @ts-ignore
import { transformDirectory } from 'ts-swc-transform';
import checkFiles from '../lib/checkFiles';
import removeBindings from '../lib/removeBindings.cjs';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const TMP_DIR = path.join(__dirname, '..', '..', '.tmp');
const SRC_DIR = path.join(__dirname, '..', 'data', 'src');
const FILE_COUNT = 9;
const hasRequire = typeof require !== 'undefined';

function tests({ type, testFile, expectedCount, options, promise }) {
  it(`transformDirectory (${type} options: ${JSON.stringify(options)}) promise: ${!!promise}`, (done) => {
    const queue = new Queue(1);
    queue.defer(async (cb) => {
      if (!promise) return transformDirectory(SRC_DIR, TMP_DIR, type, options, (err, results) => (err ? cb(err) : checkFiles(TMP_DIR, results, expectedCount, options, cb)));
      try {
        const results = await transformDirectory(SRC_DIR, TMP_DIR, type, options);
        await checkFiles(TMP_DIR, results, expectedCount, options);
        cb();
      } catch (err) {
        done(err);
      }
    });
    queue.defer(fs.writeFile.bind(null, path.join(TMP_DIR, 'package.json'), `{"type":"${type === 'cjs' ? 'commonjs' : 'module'}"}`, 'utf8'));
    hasRequire ||
      queue.defer((cb) => {
        spawn(process.execPath, [testFile], { cwd: TMP_DIR, encoding: 'utf8' }, (err, res) => {
          if (err) console.log(err, res);
          if (err) return done(err);
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
    // @ts-ignore
    let rootPromise: Promise;
    before(() => {
      rootPromise = global.Promise;
      // @ts-ignore
      global.Promise = Pinkie;
    });
    after(() => {
      global.Promise = rootPromise;
    });
  })();

  describe('clean directory', () => {
    before(removeBindings);
    beforeEach(rimraf2.bind(null, TMP_DIR, { disableGlob: true }));
    // after(rimraf2.bind(null, TMP_DIR, { disableGlob: true }));

    tests({ type: 'cjs', testFile: './testFolder.js', expectedCount: FILE_COUNT, options: { extensions: { cjs: '.js', esm: '.mjs' } }, promise: false });
    // tests({ type: 'cjs', testFile: './test.cjs', expectedCount: FILE_COUNT, options: { extensions: { cjs: '.cjs', esm: '.mjs' } }, promise: false });
    // tests({ type: 'esm', testFile: './test.js', expectedCount: FILE_COUNT, options: { extensions: { cjs: '.cjs', esm: '.js' } }, promise: false });
    // tests({ type: 'cjs', testFile: './test.cjs', expectedCount: FILE_COUNT, options: { extensions: { cjs: '.cjs', esm: '.mjs' }, sourceMaps: true }, promise: false });
    // tests({ type: 'esm', testFile: './test.mjs', expectedCount: FILE_COUNT, options: { extensions: { cjs: '.cjs', esm: '.mjs' }, sourceMaps: true }, promise: false });
    // tests({ type: 'cjs', testFile: './test.cjs', expectedCount: FILE_COUNT, options: { extensions: { cjs: '.cjs', esm: '.mjs' } }, promise: true });
  });
});
