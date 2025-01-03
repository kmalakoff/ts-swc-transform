import assert from 'assert';
import path from 'path';
import Iterator from 'fs-iterator';
import difference from 'lodash.difference';

function worker(dir, results, expectedCount, options, callback) {
  let found = [];
  const iterator = new Iterator(dir);
  iterator.forEach(
    (entry, cb) => {
      if (entry.stats.isFile()) found.push(entry.fullPath);
      cb();
    },
    { callbacks: true, concurrency: Infinity },
    (err) => {
      if (err) return callback(err);
      const fullyExpected = options.sourceMaps ? 2 * expectedCount : expectedCount;
      results = results.map((x) => path.normalize(x));
      found = found.map((x) => path.normalize(x));
      assert.equal(results.length, fullyExpected);
      assert.equal(found.length, fullyExpected);
      assert.deepEqual(difference(results, found), []);
      callback();
    }
  );
}

export default function checkFiles(dir, results, expectedCount, options, callback?) {
  if (typeof callback === 'function') return worker(dir, results, expectedCount, options, callback);
  return new Promise((resolve, reject) => worker(dir, results, expectedCount, options, (err) => (err ? reject(err) : resolve(undefined))));
}
