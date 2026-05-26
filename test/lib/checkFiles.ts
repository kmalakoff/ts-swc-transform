import assert from 'assert';
import type { Stats } from 'fs';
import Iterator from 'fs-iterator';
import os from 'os';
import path from 'path';

const concurrency = Math.min(64, Math.max(8, (os.cpus()?.length ?? 4) * 8));

function worker(dir: string, results: string[], expectedCount: number, options: { sourceMaps?: boolean }, callback: (err?: Error | null) => void) {
  let found: string[] = [];
  const iterator = new Iterator(dir);
  iterator.forEach(
    (entry, cb) => {
      const stats = entry.stats as Stats | undefined;
      if (stats && stats.isFile()) found.push(entry.fullPath as string);
      cb();
    },
    { callbacks: true, concurrency },
    (err) => {
      if (err) return callback(err);
      const fullyExpected = options.sourceMaps ? 2 * expectedCount : expectedCount;
      results = results.map((x) => path.normalize(x));
      found = found.map((x) => path.normalize(x));
      assert.equal(results.length, fullyExpected);
      assert.equal(found.length, fullyExpected);
      // https://stackoverflow.com/questions/1187518/how-to-get-the-difference-between-two-arrays-in-javascript
      const difference = results.filter((x) => found.indexOf(x) < 0).concat(found.filter((x) => results.indexOf(x) < 0));
      assert.deepEqual(difference, []);
      callback();
    }
  );
}

export default function checkFiles(dir: string, results: string[], expectedCount: number, options: { sourceMaps?: boolean }, callback?: (err?: Error | null) => void) {
  if (typeof callback === 'function') return worker(dir, results, expectedCount, options, callback);
  return new Promise((resolve, reject) => worker(dir, results, expectedCount, options, (err) => (err ? reject(err) : resolve(undefined))));
}
