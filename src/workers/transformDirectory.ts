import path from 'path';
import Iterator from 'fs-iterator';
import * as getTS from 'get-tsconfig-compat';
import Queue from 'queue-cb';
import rimraf2 from 'rimraf2';

import { SKIPS, typeFileRegEx } from '../constants.js';
import createMatcher from '../createMatcher.js';
import transformFile from './transformFile.js';

export default function transformDirectoryWorker(src, dest, type, options, callback) {
  const tsconfig = options.tsconfig ? options.tsconfig : getTS.getTsconfig(src);
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

        options = { ...options, tsconfig };
        const queue = new Queue();
        entries.forEach((entry) => queue.defer(transformFile.bind(null, entry.fullPath, path.dirname(path.join(dest, entry.path)), type, options)));
        queue.await((err) =>
          err
            ? callback(err)
            : callback(
                null,
                entries.map((entry) => entry.path)
              )
        );
      }
    );
  });
}
