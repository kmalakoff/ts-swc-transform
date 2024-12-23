// remove NODE_OPTIONS from ts-dev-stack
// biome-ignore lint/performance/noDelete: <explanation>
delete process.env.NODE_OPTIONS;

import '../lib/removeBindings.cjs';
import path from 'path';
import url from 'url';
import rimraf2 from 'rimraf2';

import assert from 'assert';
import Queue from 'queue-cb';

// @ts-ignore
import { transformTypes } from 'ts-swc-transform';
import fileCount from '../lib/fileCount.cjs';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const TMP_DIR = path.resolve(__dirname, '..', '..', '.tmp');
const SRC_DIR = path.resolve(__dirname, '..', 'data', 'src');
const FILE_COUNT = 6;
const hasPromise = typeof Promise !== 'undefined';

function tests({ transformTypes, expectedCount, options, promise }) {
  it(`transformTypes (options: ${JSON.stringify(options)}) promise: ${!!promise}`, (done) => {
    const queue = new Queue(1);
    queue.defer((cb) => {
      if (!promise) return transformTypes(SRC_DIR, TMP_DIR, options, cb);
      transformTypes(SRC_DIR, TMP_DIR, options)
        .then(() => cb())
        .catch(cb);
    });
    queue.defer((cb) => {
      fileCount(TMP_DIR, (err, count) => {
        assert.ok(!err, err ? err.message : '');
        assert.equal(count, expectedCount);
        cb();
      });
    });
    queue.await((err) => {
      !err || console.error(err);
      done(err);
    });
  });
}

describe('transformTypes', () => {
  beforeEach(rimraf2.bind(null, TMP_DIR, { disableGlob: true }));
  // after(rimraf2.bind(null, TMP_DIR, { disableGlob: true }));

  tests({ transformTypes, expectedCount: FILE_COUNT, options: {}, promise: false });
  !hasPromise || tests({ transformTypes, expectedCount: FILE_COUNT, options: {}, promise: true });
});
