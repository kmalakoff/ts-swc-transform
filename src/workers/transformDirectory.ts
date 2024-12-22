import path from 'path';
import Iterator from 'fs-iterator';
import getTS from 'get-tsconfig-compat';

import createMatcher from '../createMatcher.js';
import transformFile from '../transformFile.js';

export default function transformDirectoryWorker(src, dest, type, options, callback) {
  const tsconfig = options.tsconfig ? options.tsconfig : getTS.getTsconfig(src);
  const matcher = createMatcher(tsconfig);

  options = { ...options, tsconfig };
  const iterator = new Iterator(src);
  iterator.forEach(
    (entry, cb) => {
      if (!entry.stats.isFile()) return cb();
      if (!matcher(entry.fullPath)) return cb();
      transformFile(entry.fullPath, path.dirname(path.join(dest, entry.path)), type, options, cb);
    },
    { callbacks: true, concurrency: options.concurrency || 1024 },
    callback
  );
}
