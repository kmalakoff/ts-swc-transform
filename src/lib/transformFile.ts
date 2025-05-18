import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp-classic';
import Queue from 'queue-cb';

import patchCJS from '../lib/patchCJS.js';
import patchESM from '../lib/patchESM.js';
import swcPrepareOptions from '../lib/swcPrepareOptions.js';

import Module from 'module';
const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;

export default function transformFile(entry, dest, type, options, callback) {
  let tsconfig = options.tsconfig;

  // overrides for cjs
  if (type === 'cjs') {
    tsconfig = { ...tsconfig };
    tsconfig.config = { ...tsconfig.config };
    tsconfig.config.compilerOptions = { ...(tsconfig.config.compilerOptions || {}) };
    tsconfig.config.compilerOptions.module = 'CommonJS';
    tsconfig.config.compilerOptions.target = 'ES5';
  }

  const swcOptions = swcPrepareOptions(tsconfig);
  const swc = _require('@swc/core');

  swc
    .transformFile(entry.fullPath, {
      ...(entry.basename.endsWith('.tsx') || entry.basename.endsWith('.jsx') ? swcOptions.tsxOptions : swcOptions.nonTsxOptions),
      filename: entry.basename,
    })
    .then((output) => {
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
