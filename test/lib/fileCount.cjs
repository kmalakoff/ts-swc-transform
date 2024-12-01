const Iterator = require('fs-iterator');

module.exports = function fileCount(dir, callback) {
  let count = 0;

  const iterator = new Iterator(dir);
  iterator.forEach(
    (entry, cb) => {
      if (entry.stats.isFile()) count++;
      cb();
    },
    { callbacks: true, concurrency: Infinity },
    (err) => {
      callback(err, count);
    }
  );
};
