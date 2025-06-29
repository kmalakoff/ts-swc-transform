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
      const extTarget = type === 'esm' ? patchESM(entry, output, options) : patchCJS(entry, output, options);
      const ext = path.extname(entry.path);
      const outPath = path.join(dest, (ext ? entry.path.slice(0, -ext.length) : entry.path) + extTarget);

      mkdirp(path.dirname(outPath), () => {
        const queue = new Queue();
        queue.defer(fs.writeFile.bind(null, outPath, output.code, 'utf8'));
        !options.sourceMaps || queue.defer(fs.writeFile.bind(null, `${outPath}.map`, output.map, 'utf8'));
        queue.await((err) => (err ? callback(err) : callback(null, outPath)));
      });
    })
    .catch(callback);
}
