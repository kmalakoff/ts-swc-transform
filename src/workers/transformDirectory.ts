import path from 'path';
import Iterator from 'fs-iterator';
import Queue from 'queue-cb';

import { extensions, typeFileRegEx } from '../constants.js';
import createMatcher from '../createMatcher.js';
import transformFile from '../lib/transformFile.js';

export default function transformDirectoryWorker(src, dest, type, options, callback) {
  const tsconfig = options.tsconfig;
  const matcher = createMatcher(tsconfig);

  const entries = [];
  const iterator = new Iterator(src);
  iterator.forEach(
    (entry) => {
      if (!entry.stats.isFile()) return;
      if (entry.basename[0] === '.') return;
      if (typeFileRegEx.test(entry.basename)) return;
      if (!matcher(entry.fullPath)) return;
      const ext = path.extname(entry.basename);
      if (ext && extensions.indexOf(ext) < 0) return;
      entries.push(entry);
    },
    (err) => {
      if (err) return callback(err);
      const results = [];
      options = { ...options, tsconfig, src, dest };

      const queue = new Queue();
      entries.forEach((entry) => {
        queue.defer((cb) =>
          transformFile(entry, dest, type, options, (err, outPath) => {
            if (err) return cb(err);
            results.push(path.normalize(outPath));
            if (options.sourceMaps) results.push(`${path.normalize(outPath)}.map`);
            cb();
          })
        );
      });
      queue.await((err) => (err ? callback(err) : callback(null, results)));
    }
  );
}
