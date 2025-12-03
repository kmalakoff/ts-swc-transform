import path from 'path';
import Pinkie from 'pinkie-promise';
import Queue from 'queue-cb';
import rimraf2 from 'rimraf2';
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
    beforeEach(rimraf2.bind(null, TMP_DIR, { disableGlob: true }));
    after(rimraf2.bind(null, TMP_DIR, { disableGlob: true }));

    tests({ expectedCount: FILE_COUNT, options: {}, promise: false });
    tests({ expectedCount: FILE_COUNT, options: {}, promise: true });
  });
});
