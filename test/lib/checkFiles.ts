import assert from 'assert';
import Iterator from 'fs-iterator';
import path from 'path';

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
      // https://stackoverflow.com/questions/1187518/how-to-get-the-difference-between-two-arrays-in-javascript
      const difference = results.filter((x) => found.indexOf(x) < 0).concat(found.filter((x) => results.indexOf(x) < 0));
      assert.deepEqual(difference, []);
      callback();
    }
  );
}

export default function checkFiles(dir, results, expectedCount, options, callback?) {
  if (typeof callback === 'function') return worker(dir, results, expectedCount, options, callback);
  return new Promise((resolve, reject) => worker(dir, results, expectedCount, options, (err) => (err ? reject(err) : resolve(undefined))));
}
