import assert from 'assert';
import { safeRm } from 'fs-remove-compat';
import path from 'path';
import Pinkie from 'pinkie-promise';
import Queue from 'queue-cb';
import { transformTypes } from 'ts-swc-transform';
import url from 'url';
import checkFiles from '../lib/checkFiles.ts';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const TMP_DIR = path.join(__dirname, '..', '..', '.tmp');
const SRC_DIR = path.join(__dirname, '..', 'data', 'src');
const FILE_COUNT = 7;

function tests({ expectedCount, options, promise }) {
  it(`transformTypes (options: ${JSON.stringify(options)}) promise: ${!!promise}`, (done) => {
    const queue = new Queue(1);
    queue.defer(async (cb) => {
      if (!promise) return transformTypes(SRC_DIR, TMP_DIR, options, (err, results) => (err ? cb(err) : checkFiles(TMP_DIR, results, expectedCount, options, cb)));
      try {
        const results = await transformTypes(SRC_DIR, TMP_DIR, options);
        await checkFiles(TMP_DIR, results, expectedCount, options);
        cb();
      } catch (err) {
        done(err);
      }
    });
    queue.await((err) => {
      !err || console.error(err);
      done(err);
    });
  });
}

describe('transformTypes', () => {
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
    beforeEach((cb) => safeRm(TMP_DIR, cb));
    after((cb) => safeRm(TMP_DIR, cb));

    tests({ expectedCount: FILE_COUNT, options: {}, promise: false });
    tests({ expectedCount: FILE_COUNT, options: {}, promise: true });
  });

  describe('validation errors (promise)', () => {
    it('rejects when src is null', async () => {
      try {
        await transformTypes(null, TMP_DIR);
        assert.fail('should have rejected');
      } catch (err) {
        assert.ok(err.message.indexOf('unexpected source') !== -1, 'should mention unexpected source');
      }
    });

    it('rejects when src is undefined', async () => {
      try {
        await transformTypes(undefined, TMP_DIR);
        assert.fail('should have rejected');
      } catch (err) {
        assert.ok(err.message.indexOf('unexpected source') !== -1, 'should mention unexpected source');
      }
    });

    it('rejects when src is a number', async () => {
      try {
        // biome-ignore lint/suspicious/noExplicitAny: testing invalid input
        await transformTypes(123 as any, TMP_DIR);
        assert.fail('should have rejected');
      } catch (err) {
        assert.ok(err.message.indexOf('unexpected source') !== -1, 'should mention unexpected source');
      }
    });

    it('rejects when dest is null', async () => {
      try {
        await transformTypes(SRC_DIR, null);
        assert.fail('should have rejected');
      } catch (err) {
        assert.ok(err.message.indexOf('unexpected destination') !== -1, 'should mention unexpected destination');
      }
    });

    it('rejects when dest is undefined', async () => {
      try {
        await transformTypes(SRC_DIR, undefined);
        assert.fail('should have rejected');
      } catch (err) {
        assert.ok(err.message.indexOf('unexpected destination') !== -1, 'should mention unexpected destination');
      }
    });

    it('rejects when dest is a number', async () => {
      try {
        // biome-ignore lint/suspicious/noExplicitAny: testing invalid input
        await transformTypes(SRC_DIR, 123 as any);
        assert.fail('should have rejected');
      } catch (err) {
        assert.ok(err.message.indexOf('unexpected destination') !== -1, 'should mention unexpected destination');
      }
    });
  });

  describe('validation errors (callback)', () => {
    it('calls callback with error when src is invalid', (done) => {
      transformTypes(null, TMP_DIR, {}, (err) => {
        assert.ok(err, 'should have error');
        assert.ok(err.message.indexOf('unexpected source') !== -1, 'should mention unexpected source');
        done();
      });
    });

    it('calls callback with error when dest is invalid', (done) => {
      transformTypes(SRC_DIR, null, {}, (err) => {
        assert.ok(err, 'should have error');
        assert.ok(err.message.indexOf('unexpected destination') !== -1, 'should mention unexpected destination');
        done();
      });
    });
  });
});
