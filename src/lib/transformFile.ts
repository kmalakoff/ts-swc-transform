import type { Output } from '@swc/core';
import fs from 'fs';
import type { Entry } from 'fs-iterator';
import mkdirp from 'mkdirp-classic';
import Module from 'module';
import path from 'path';
import Queue from 'queue-cb';
import patchCJS from '../lib/patchCJS.ts';
import patchESM from '../lib/patchESM.ts';
import prepareSWCOptions from '../lib/prepareSWCOptions.ts';

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;

import type { ConfigOptions, TargetType, TransformFileCallback } from '../types.ts';

export default function transformFile(entry: Entry, dest: string, type: TargetType, options: ConfigOptions, callback: TransformFileCallback): undefined {
  let tsconfig = options.tsconfig;

  // overrides for cjs
  if (type === 'cjs') {
    tsconfig = { ...tsconfig };
    tsconfig.config = { ...tsconfig.config };
    tsconfig.config.compilerOptions = { ...(tsconfig.config.compilerOptions || {}) };
    tsconfig.config.compilerOptions.module = 'commonjs';
    tsconfig.config.compilerOptions.target = 'es5';
  }

  const swcOptions = prepareSWCOptions(tsconfig);
  const swc = _require('@swc/core');
  const ext = path.extname(entry.basename);

  swc
    .transformFile(entry.fullPath, {
      ...(ext === '.tsx' || ext === '.jsx' ? swcOptions.tsxOptions : swcOptions.nonTsxOptions),
      filename: entry.basename,
    })
    .then((output: Output) => {
      // Get source file mode to preserve executable permissions
      fs.stat(entry.fullPath, (statErr, stats) => {
        if (statErr) return callback(statErr);

        const extTarget = type === 'esm' ? patchESM(entry, output, options) : patchCJS(entry, output, options);
        const ext = path.extname(entry.path);
        const outPath = path.join(dest, (ext ? entry.path.slice(0, -ext.length) : entry.path) + extTarget);

        mkdirp(path.dirname(outPath), () => {
          const queue = new Queue();
          queue.defer(fs.writeFile.bind(null, outPath, output.code, 'utf8'));
          if (output.map && options.sourceMaps) queue.defer(fs.writeFile.bind(null, `${outPath}.map`, output.map, 'utf8'));
          queue.await((err) => {
            if (err) return callback(err);

            // Preserve executable permissions from source (only +x bits, not full mode)
            const execBits = stats.mode & 0o111;
            if (execBits) {
              fs.chmod(outPath, 0o644 | execBits, (_chmodErr) => {
                // Ignore chmod errors (e.g., on Windows)
                callback(null, outPath);
              });
            } else {
              callback(null, outPath);
            }
          });
        });
      });
    })
    .catch(callback);
}
