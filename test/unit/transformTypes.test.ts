// remove NODE_OPTIONS from ts-dev-stack
delete process.env.NODE_OPTIONS;

import '../lib/removeBindings.cjs';
import path from 'path';
import url from 'url';
import rimraf2 from 'rimraf2';

import Queue from 'queue-cb';

// @ts-ignore
import { transformTypes } from 'ts-swc-transform';
import checkFiles from '../lib/checkFiles.cjs';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const TMP_DIR = path.resolve(__dirname, '..', '..', '.tmp');
const SRC_DIR = path.resolve(__dirname, '..', 'data', 'src');
const FILE_COUNT = 6;

function tests({ expectedCount, options, promise }) {
  it(`transformTypes (options: ${JSON.stringify(options)}) promise: ${!!promise}`, (done) => {
    const queue = new Queue(1);
    queue.defer((cb) => {
      if (!promise) return transformTypes(SRC_DIR, TMP_DIR, options, (err, files) => (err ? cb(err) : checkFiles(TMP_DIR, files, expectedCount, options, cb)));
      transformTypes(SRC_DIR, TMP_DIR, options)
        .then((files) => checkFiles(TMP_DIR, files, expectedCount, options, cb))
        .catch(cb);
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

  tests({ expectedCount: FILE_COUNT, options: {}, promise: false });
  tests({ expectedCount: FILE_COUNT, options: {}, promise: true });
});
