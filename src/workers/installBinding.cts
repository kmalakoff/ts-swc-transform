const path = require('path');
const fs = require('fs');
const { tmpdir } = require('os');
const tempSuffix = require('temp-suffix');
const mkdirp = require('mkdirp');

const Queue = require('queue-cb');
const spawn = require('cross-spawn-cb');
const once = require('call-once-fn');

module.exports = function installBindings(name, version, callback) {
  callback = once(callback);
  try {
    const tmp = path.join(tmpdir(), 'ts-swc-transform', tempSuffix());
    const source = path.join.apply(null, [tmp, 'node_modules', ...name.split('/')]);
    const dest = path.join.apply(null, [path.dirname(path.dirname(path.dirname(require.resolve('@swc/core/package.json')))), ...name.split('/')]);

    const queue = new Queue(1);
    queue.defer(mkdirp.bind(null, tmp));
    queue.defer(fs.writeFile.bind(null, path.join(tmp, 'package.json'), '{}', 'utf8'));
    queue.defer((cb) => {
      // remove NODE_OPTIONS from ts-dev-stack
      // biome-ignore lint/performance/noDelete: <explanation>
      delete process.env.NODE_OPTIONS;
      spawn('npm', ['install', `${name}@${version}`], { cwd: tmp }, cb);
    });
    queue.defer(fs.rename.bind(null, source, dest));
    queue.await((err) => {
      fs.rm(tmp, { recursive: true, force: true }, () => callback(err));
    });
  } catch (err) {
    return callback(err);
  }
};
