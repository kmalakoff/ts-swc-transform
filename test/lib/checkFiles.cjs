const assert = require('assert');
const difference = require('lodash.difference');
const Iterator = require('fs-iterator');

module.exports = function checkFiles(dir, results, expectedCount, options, callback) {
  const found = [];
  const iterator = new Iterator(dir);
  iterator.forEach(
    (entry, cb) => {
      if (entry.stats.isFile()) found.push(entry.path);
      cb();
    },
    { callbacks: true, concurrency: Infinity },
    (err) => {
      if (err) return callback(err);
      const fullyExpected = options.sourceMaps ? 2 * expectedCount : expectedCount;

      assert.equal(results.length, fullyExpected);
      assert.equal(found.length, fullyExpected);
      assert.deepEqual(
        difference(
          results.map((x) => x.to),
          found
        ),
        []
      );
      callback();
    }
  );
};
