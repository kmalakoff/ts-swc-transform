import type fs from 'fs';
import Iterator, { type Entry } from 'fs-iterator';
import path from 'path';
import Queue from 'queue-cb';

import { extensions, typeFileRegEx } from '../constants.ts';
import createMatcher from '../createMatcher.ts';
import transformFile from '../lib/transformFile.ts';

import type { InternalConfigOptions, TargetType, TransformDirectoryCallback } from '../types.ts';

export default function transformDirectoryWorker(src: string, dest: string, type: TargetType, options: InternalConfigOptions, callback: TransformDirectoryCallback) {
  const tsconfig = options.tsconfig;
  const matcher = createMatcher(tsconfig);

  const entries: Entry[] = [];
  const modeByPath = new Map<string, number>();
  const iterator = new Iterator(src, { alwaysStat: true });
  iterator.forEach(
    (entry: Entry): void => {
      const stats = entry.stats as fs.Stats | undefined;
      if (!stats || !stats.isFile()) return;
      const basename = entry.basename as string;
      if (basename[0] === '.') return;
      if (typeFileRegEx.test(basename)) return;
      if (!matcher(entry.fullPath)) return;
      const ext = path.extname(basename);
      if (ext && extensions.indexOf(ext) < 0) return;
      entries.push(entry);

      if (stats.mode) {
        modeByPath.set(entry.fullPath, stats.mode);
      }
    },
    (err) => {
      if (err) return callback(err);
      const results: string[] = [];
      const opts: InternalConfigOptions = { ...options, tsconfig };

      const queue = new Queue();
      entries.forEach((entry: Entry) => {
        const mode = modeByPath.get(entry.fullPath);
        queue.defer((cb) =>
          transformFile(entry, dest, type, opts, mode, (err, outPath) => {
            if (err) return cb(err);
            if (outPath) {
              results.push(path.normalize(outPath));
              if (opts.sourceMaps) results.push(`${path.normalize(outPath)}.map`);
            }
            cb();
          })
        );
      });
      queue.await((err) => (err ? callback(err) : callback(null, results)));
    }
  );
}
