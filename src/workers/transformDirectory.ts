import path from 'path';
import Iterator from 'fs-iterator';
import Queue from 'queue-cb';
import rimraf2 from 'rimraf2';

import { SKIPS, typeFileRegEx } from '../constants.js';
import createMatcher from '../createMatcher.js';
import transformFile from './transformFile.js';

export default function transformDirectoryWorker(src, dest, type, options, callback) {
  const tsconfig = options.tsconfig;
  const matcher = createMatcher(tsconfig);

  rimraf2(dest, { disableGlob: true }, () => {
    const entries = [];
    const iterator = new Iterator(src);
    iterator.forEach(
      (entry) => {
        if (!entry.stats.isFile()) return;
        if (!matcher(entry.fullPath)) return;
        if (typeFileRegEx.test(entry.basename)) return;
        if (SKIPS.indexOf(entry.basename) >= 0) return;
        entries.push(entry);
      },
      (err) => {
        if (err) return callback(err);
        const results = [];
        options = { ...options, tsconfig };

        const queue = new Queue();
        entries.forEach((entry) =>
          queue.defer((cb) =>
            transformFile(entry.fullPath, path.dirname(path.join(dest, entry.path)), type, options, (err, to) => {
              if (err) return cb(err);
              results.push({ from: entry, to: path.join(path.relative(src, path.dirname(entry.fullPath)), to) });
              if (options.sourceMaps) results.push({ from: entry, to: `${path.join(path.relative(src, path.dirname(entry.fullPath)), to)}.map` });
              cb();
            })
          )
        );
        queue.await((err) => (err ? callback(err) : callback(null, results)));
      }
    );
  });
}
