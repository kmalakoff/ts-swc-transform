const assert = require('assert');
const Iterator = require('fs-iterator');

module.exports = function filePaths(dir, files, expectedCount, options, callback) {
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
      assert.equal(files.length, expectedCount, files);
      assert.equal(found.length, options.sourceMaps ? 2 * expectedCount : expectedCount, found);
      callback();
    }
  );
};
