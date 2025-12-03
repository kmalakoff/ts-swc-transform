import assert from 'assert';
import cr from 'cr';
import spawn from 'cross-spawn-cb';
import fs from 'fs';
import { removeSync } from 'install-optional';
import path from 'path';
import Pinkie from 'pinkie-promise';
import Queue from 'queue-cb';
import rimraf2 from 'rimraf2';
import { transformDirectory } from 'ts-swc-transform';
import url from 'url';
import checkFiles from '../lib/checkFiles.ts';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const TMP_DIR = path.join(__dirname, '..', '..', '.tmp');
const SRC_DIR = path.join(__dirname, '..', 'data', 'src');
const FILE_COUNT = 7;
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
          if (err) {
            done(err.message);
            return;
          }
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
    if (typeof global === 'undefined') return;
    const globalPromise = global.Promise;
    before(() => {
      global.Promise = Pinkie;
    });
    after(() => {
      global.Promise = globalPromise;
    });
  })();

  describe('clean directory', () => {
    before(() => removeSync('@swc/core', '@swc/core-'));
    beforeEach(rimraf2.bind(null, TMP_DIR, { disableGlob: true }));
    after(rimraf2.bind(null, TMP_DIR, { disableGlob: true }));

    tests({ type: 'cjs', testFile: './testFolder.js', expectedCount: FILE_COUNT, options: {}, promise: false });
    tests({ type: 'cjs', testFile: './test.js', expectedCount: FILE_COUNT, options: {}, promise: false });
    tests({ type: 'esm', testFile: './test.js', expectedCount: FILE_COUNT, options: {}, promise: false });
  });

  describe('validation errors (promise)', () => {
    it('rejects when src is null', async () => {
      try {
        await transformDirectory(null, TMP_DIR, 'cjs');
        assert.fail('should have rejected');
      } catch (err) {
        assert.ok(err.message.indexOf('unexpected source') !== -1, 'should mention unexpected source');
      }
    });

    it('rejects when src is undefined', async () => {
      try {
        await transformDirectory(undefined, TMP_DIR, 'cjs');
        assert.fail('should have rejected');
      } catch (err) {
        assert.ok(err.message.indexOf('unexpected source') !== -1, 'should mention unexpected source');
      }
    });

    it('rejects when src is a number', async () => {
      try {
        // biome-ignore lint/suspicious/noExplicitAny: testing invalid input
        await transformDirectory(123 as any, TMP_DIR, 'cjs');
        assert.fail('should have rejected');
      } catch (err) {
        assert.ok(err.message.indexOf('unexpected source') !== -1, 'should mention unexpected source');
      }
    });

    it('rejects when dest is null', async () => {
      try {
        await transformDirectory(SRC_DIR, null, 'cjs');
        assert.fail('should have rejected');
      } catch (err) {
        assert.ok(err.message.indexOf('unexpected destination') !== -1, 'should mention unexpected destination');
      }
    });

    it('rejects when dest is undefined', async () => {
      try {
        await transformDirectory(SRC_DIR, undefined, 'cjs');
        assert.fail('should have rejected');
      } catch (err) {
        assert.ok(err.message.indexOf('unexpected destination') !== -1, 'should mention unexpected destination');
      }
    });

    it('rejects when type is null', async () => {
      try {
        await transformDirectory(SRC_DIR, TMP_DIR, null);
        assert.fail('should have rejected');
      } catch (err) {
        assert.ok(err.message.indexOf('unexpected type') !== -1, 'should mention unexpected type');
      }
    });

    it('rejects when type is undefined', async () => {
      try {
        await transformDirectory(SRC_DIR, TMP_DIR, undefined);
        assert.fail('should have rejected');
      } catch (err) {
        assert.ok(err.message.indexOf('unexpected type') !== -1, 'should mention unexpected type');
      }
    });

    it('rejects when type is a number', async () => {
      try {
        // biome-ignore lint/suspicious/noExplicitAny: testing invalid input
        await transformDirectory(SRC_DIR, TMP_DIR, 123 as any);
        assert.fail('should have rejected');
      } catch (err) {
        assert.ok(err.message.indexOf('unexpected type') !== -1, 'should mention unexpected type');
      }
    });
  });

  describe('validation errors (callback)', () => {
    it('calls callback with error when src is invalid', (done) => {
      transformDirectory(null, TMP_DIR, 'cjs', {}, (err) => {
        assert.ok(err, 'should have error');
        assert.ok(err.message.indexOf('unexpected source') !== -1, 'should mention unexpected source');
        done();
      });
    });

    it('calls callback with error when dest is invalid', (done) => {
      transformDirectory(SRC_DIR, null, 'cjs', {}, (err) => {
        assert.ok(err, 'should have error');
        assert.ok(err.message.indexOf('unexpected destination') !== -1, 'should mention unexpected destination');
        done();
      });
    });

    it('calls callback with error when type is invalid', (done) => {
      transformDirectory(SRC_DIR, TMP_DIR, null, {}, (err) => {
        assert.ok(err, 'should have error');
        assert.ok(err.message.indexOf('unexpected type') !== -1, 'should mention unexpected type');
        done();
      });
    });
  });

  describe('output format verification', () => {
    beforeEach(rimraf2.bind(null, TMP_DIR, { disableGlob: true }));
    afterEach(rimraf2.bind(null, TMP_DIR, { disableGlob: true }));

    it('CJS output contains CommonJS exports syntax', async () => {
      await transformDirectory(SRC_DIR, TMP_DIR, 'cjs');
      const outputPath = path.join(TMP_DIR, 'test.js');
      const content = fs.readFileSync(outputPath, 'utf8');

      // CJS should use exports or module.exports, not ES export
      assert.ok(content.indexOf('exports.') !== -1 || content.indexOf('module.exports') !== -1 || content.indexOf('Object.defineProperty(exports') !== -1, 'CJS output should use CommonJS exports syntax');
    });

    it('CJS output contains CJS interop code', async () => {
      await transformDirectory(SRC_DIR, TMP_DIR, 'cjs');
      const outputPath = path.join(TMP_DIR, 'test.js');
      const content = fs.readFileSync(outputPath, 'utf8');

      assert.ok(content.indexOf('CJS INTEROP') !== -1, 'CJS output should contain interop code');
    });

    it('ESM output uses ES module export syntax', async () => {
      await transformDirectory(SRC_DIR, TMP_DIR, 'esm');
      // Check a file that actually has exports (lib/string.js)
      const outputPath = path.join(TMP_DIR, 'lib', 'string.js');
      const content = fs.readFileSync(outputPath, 'utf8');

      // ESM should use export keyword
      assert.ok(content.indexOf('export ') !== -1, 'ESM output should use ES export syntax');
    });

    it('ESM output does NOT contain CJS interop code', async () => {
      await transformDirectory(SRC_DIR, TMP_DIR, 'esm');
      const outputPath = path.join(TMP_DIR, 'test.js');
      const content = fs.readFileSync(outputPath, 'utf8');

      assert.ok(content.indexOf('CJS INTEROP') === -1, 'ESM output should NOT contain CJS interop code');
      assert.ok(content.indexOf('module.exports') === -1, 'ESM output should NOT contain module.exports');
    });
  });
});
