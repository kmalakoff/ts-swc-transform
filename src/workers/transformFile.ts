import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp-classic';
import Queue from 'queue-cb';

import patchCJS from '../lib/patchCJS.js';
import patchESM from '../lib/patchESM.js';
import swcPrepareOptions from '../lib/swcPrepareOptions.js';

import Module from 'module';
import lazy from 'lazy-cache';
const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const swcLazy = lazy(_require)('@swc/core');

export default function transformFileWorker(src, dest, type, options, callback) {
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
  const swc = swcLazy();

  const basename = path.basename(src);
  swc
    .transformFile(src, {
      ...(basename.endsWith('.tsx') || basename.endsWith('.jsx') ? swcOptions.tsxOptions : swcOptions.nonTsxOptions),
      filename: basename,
    })
    .then((output) => {
      const ext = type === 'esm' ? patchESM(output, options, basename) : patchCJS(output, options, basename);
      const outPath = path.join(dest, basename.replace(/\.[^/.]+$/, '') + ext);

      mkdirp(path.dirname(outPath), () => {
        const queue = new Queue();
        queue.defer(fs.writeFile.bind(null, outPath, output.code, 'utf8'));
        !options.sourceMaps || queue.defer(fs.writeFile.bind(null, `${outPath}.map`, output.map, 'utf8'));
        queue.await((err) => (err ? callback(err) : callback(null, outPath)));
      });
    })
    .catch(callback);
}
