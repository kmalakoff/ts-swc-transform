const assert = require('assert');
const path = require('path');
const fs = require('fs');
const Queue = require('queue-cb');
const spawn = require('cross-spawn-cb');
const cr = require('cr');

const fileCount = require('./fileCount.cjs');

const TMP_DIR = path.resolve(__dirname, '..', '..', '.tmp');
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const SRC_DIR = path.resolve(__dirname, '..', 'data', 'src');

module.exports = function tests({ transformDirectory, type, ext, packageType, expectedCount, options, promise }) {
  it(`transformDirectory (${type} options: ${JSON.stringify(options)}) promise: ${!!promise}`, (done) => {
    const queue = new Queue(1);
    queue.defer((cb) => {
      if (!promise) return transformDirectory(SRC_DIR, TMP_DIR, type, { cwd: DATA_DIR, ...(options || {}) }, cb);
      transformDirectory(SRC_DIR, TMP_DIR, type, { cwd: DATA_DIR, ...(options || {}) })
        .then(() => cb())
        .catch((err) => cb(err));
    });
    queue.defer(fs.writeFile.bind(null, path.join(TMP_DIR, 'package.json'), `{"type":"${packageType}"}`, 'utf8'));
    queue.defer((cb) => {
      fileCount(TMP_DIR, (err, count) => {
        assert.ok(!err, err ? err.message : '');
        assert.equal(count, expectedCount);
        cb();
      });
    });
    queue.defer((cb) => {
      spawn(process.execPath, [`./test${ext}`, 'arg'], { cwd: TMP_DIR, encoding: 'utf8' }, (err, res) => {
        assert.ok(!err, err ? err.message : '');
        assert.equal(cr(res.stdout).split('\n').slice(-2)[0], 'Success!');
        cb();
      });
    });
    queue.await((err) => {
      assert.ok(!err, err ? err.message : '');
      done();
    });
  });
};

module.exports.TMP_DIR = TMP_DIR;
module.exports.process = process;
