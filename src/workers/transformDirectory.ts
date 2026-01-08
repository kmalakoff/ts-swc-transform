import type fs from 'fs';
import Iterator, { type Entry } from 'fs-iterator';
import path from 'path';
import Queue from 'queue-cb';

import { extensions, typeFileRegEx } from '../constants.ts';
import createMatcher from '../createMatcher.ts';
import transformFile from '../lib/transformFile.ts';

import type { ConfigOptions, TargetType, TransformDirectoryCallback } from '../types.ts';

export default function transformDirectoryWorker(src: string, dest: string, type: TargetType, options: ConfigOptions, callback: TransformDirectoryCallback) {
  const tsconfig = options.tsconfig;
  const matcher = createMatcher(tsconfig);

  const entries: Entry[] = [];
  const modeByPath = new Map<string, number>();
  const iterator = new Iterator(src, { alwaysStat: true });
  iterator.forEach(
    (entry: Entry): void => {
      if (!entry.stats.isFile()) return;
      if (entry.basename[0] === '.') return;
      if (typeFileRegEx.test(entry.basename)) return;
      if (!matcher(entry.fullPath)) return;
      const ext = path.extname(entry.basename);
      if (ext && extensions.indexOf(ext) < 0) return;
      entries.push(entry);

      const stats = entry.stats as fs.Stats;
      if (stats.mode) {
        modeByPath.set(entry.fullPath, stats.mode);
      }
    },
    (err) => {
      if (err) return callback(err);
      const results = [];
      options = { ...options, tsconfig };

      const queue = new Queue();
      entries.forEach((entry: Entry) => {
        const mode = modeByPath.get(entry.fullPath);
        queue.defer((cb) =>
          transformFile(entry, dest, type, options, mode, (err, outPath) => {
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
