import assert from 'assert';
import cr from 'cr';
import spawn from 'cross-spawn-cb';
import fs from 'fs';
import { safeRm, safeRmSync } from 'fs-remove-compat';
import path from 'path';
import Pinkie from 'pinkie-promise';
import Queue from 'queue-cb';
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
            done(err);
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
    beforeEach(() => safeRmSync(TMP_DIR, { recursive: true, force: true }));
    after(() => safeRmSync(TMP_DIR, { recursive: true, force: true }));

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
    beforeEach((cb) => safeRm(TMP_DIR, cb));
    afterEach((cb) => safeRm(TMP_DIR, cb));

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

  describe('source map validation', () => {
    beforeEach((cb) => safeRm(TMP_DIR, cb));
    afterEach((cb) => safeRm(TMP_DIR, cb));

    it('source map has valid structure', async () => {
      await transformDirectory(SRC_DIR, TMP_DIR, 'cjs', { sourceMaps: true });
      const mapPath = path.join(TMP_DIR, 'test.js.map');
      const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

      assert.equal(map.version, 3, 'should be source map v3');
      assert.ok(Array.isArray(map.sources), 'should have sources array');
      assert.ok(typeof map.mappings === 'string', 'should have mappings string');
      assert.ok(map.sources.length > 0, 'should have at least one source');
    });

    it('source map references correct source file', async () => {
      await transformDirectory(SRC_DIR, TMP_DIR, 'cjs', { sourceMaps: true });
      const mapPath = path.join(TMP_DIR, 'test.js.map');
      const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

      // Source should reference the original .ts file
      assert.ok(
        map.sources.some((s) => s.indexOf('test.ts') !== -1),
        'should reference original source'
      );
    });

    it('source map has non-empty mappings', async () => {
      await transformDirectory(SRC_DIR, TMP_DIR, 'cjs', { sourceMaps: true });
      const mapPath = path.join(TMP_DIR, 'test.js.map');
      const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

      assert.ok(map.mappings.length > 0, 'mappings should not be empty');
    });

    it('generates separate source map file alongside JS file', async () => {
      await transformDirectory(SRC_DIR, TMP_DIR, 'cjs', { sourceMaps: true });
      const jsPath = path.join(TMP_DIR, 'test.js');
      const mapPath = path.join(TMP_DIR, 'test.js.map');

      // Both files should exist
      assert.ok(fs.existsSync(jsPath), 'JS file should exist');
      assert.ok(fs.existsSync(mapPath), 'source map file should exist');

      // Map file should be valid JSON
      const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
      assert.ok(map.version, 'map should have version');
    });

    it('ESM source maps have valid structure', async () => {
      await transformDirectory(SRC_DIR, TMP_DIR, 'esm', { sourceMaps: true });
      const mapPath = path.join(TMP_DIR, 'test.js.map');
      const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

      assert.equal(map.version, 3, 'should be source map v3');
      assert.ok(Array.isArray(map.sources), 'should have sources array');
      assert.ok(
        map.sources.some((s) => s.indexOf('test.ts') !== -1),
        'should reference original source'
      );
    });
  });

  // Windows doesn't support Unix executable bits - git doesn't preserve them on checkout
  (process.platform === 'win32' ? describe.skip : describe)('executable permission preservation', () => {
    const EXEC_FIXTURE = path.join(__dirname, '..', 'data', 'exec-fixture');

    beforeEach((cb) => safeRm(TMP_DIR, cb));
    afterEach((cb) => safeRm(TMP_DIR, cb));

    it('preserves executable permission on output file when source is executable', async () => {
      // Verify fixture has executable bit (will fail on Windows if git doesn't preserve it)
      const srcFile = path.join(EXEC_FIXTURE, 'cli.ts');
      const srcStats = fs.statSync(srcFile);
      const srcExecutable = (srcStats.mode & 0o111) !== 0;
      assert.ok(srcExecutable, 'source fixture should be executable (git should preserve this)');

      await transformDirectory(EXEC_FIXTURE, TMP_DIR, 'esm');

      const outFile = path.join(TMP_DIR, 'cli.js');
      const stats = fs.statSync(outFile);
      const isExecutable = (stats.mode & 0o111) !== 0;
      assert.ok(isExecutable, 'output file should be executable');
    });

    it('does not add executable permission when source is not executable', async () => {
      // Transform standard test data (non-executable)
      await transformDirectory(SRC_DIR, TMP_DIR, 'esm');

      const outFile = path.join(TMP_DIR, 'test.js');
      const stats = fs.statSync(outFile);
      const isExecutable = (stats.mode & 0o111) !== 0;
      assert.ok(!isExecutable, 'output file should NOT be executable');
    });

    it('source maps do not get executable permission when source is executable', async () => {
      const results = await transformDirectory(EXEC_FIXTURE, TMP_DIR, 'esm', { sourceMaps: true });

      // Check if source map was created
      const mapFile = path.join(TMP_DIR, 'cli.js.map');
      // Use indexOf for Node 0.8 compatibility (no String.prototype.endsWith)
      assert.ok(
        results.some((r) => r.indexOf('.map') === r.length - 4),
        'source map should be in results'
      );
      assert.ok(fs.existsSync(mapFile), 'source map file should exist');

      // Source map should NOT be executable
      const stats = fs.statSync(mapFile);
      const isExecutable = (stats.mode & 0o111) !== 0;
      assert.ok(!isExecutable, 'source map should NOT be executable');
    });
  });
});
