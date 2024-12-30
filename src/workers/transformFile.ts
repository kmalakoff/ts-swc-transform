import fs from 'fs';
import path from 'path';
import * as getTS from 'get-tsconfig-compat';
import mkdirp from 'mkdirp-classic';
import Queue from 'queue-cb';

import swcPrepareOptions from '../lib/swcPrepareOptions.js';

import Module from 'module';
import lazy from 'lazy-cache';
const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const swcLazy = lazy(_require)('@swc/core');

const matchingDeps = '\\s*[\'"`]([^\'"`]+)[\'"`]\\s*';
const matchingName = '\\s*(?:[\\w${},\\s*]+)\\s*';
const regexCJS = new RegExp(`(?:(?:var|const|let)${matchingName}=\\s*)?require\\(${matchingDeps}\\);?`, 'g');
const regexESM = new RegExp(`${regexCJS}|import(?:${matchingName}from\\s*)?${matchingDeps};?|export(?:${matchingName}from\\s*)?${matchingDeps};?`, 'g');

const importReplaceMJS = ['.js', '.ts', '.tsx', '.mts', '.mjs'];
const importReplaceCJS = ['.cts'];
const requireReplaceJS = ['.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts'];

function makeReplacements(code, regex, extensions, extension) {
  let matches = [];
  let match = regex.exec(code);
  while (match) {
    const dependency = match[1] || match[2] || match[3] || match[4];
    const ext = extensions.find((x) => dependency.slice(-x.length) === x);
    if (ext) matches.push({ ext, match, dependency });
    match = regex.exec(code);
  }

  matches = matches.reverse();
  for (const index in matches) {
    const match = matches[index];
    const start = match.match.index + match.match[0].indexOf(match.dependency) + match.dependency.indexOf(match.ext);
    code = code.substring(0, start) + extension + code.substring(start + match.ext.length);
  }
  return code;
}

// https://github.com/vercel/next.js/blob/20b63e13ab2631d6043277895d373aa31a1b327c/packages/next/taskfile-swc.js#L118-L125
const interopClientDefaultExport = "/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) {}; module.exports = exports.default; }";

export default function transformFileWorker(src, dest, type, options, callback) {
  let tsconfig = options.tsconfig ? options.tsconfig : getTS.getTsconfig(src);

  // overrides for cjs
  if (type === 'cjs') {
    tsconfig = { ...tsconfig };
    tsconfig.tsconfig = { ...(tsconfig.config || {}) };
    tsconfig.config.compilerOptions = { ...(tsconfig.config.compilerOptions || {}) };
    tsconfig.config.compilerOptions.module = 'CommonJS';
    tsconfig.config.compilerOptions.target = 'ES5';
  }

  swcPrepareOptions(tsconfig, (err, swcOptions) => {
    if (err) return callback(err);
    const swc = swcLazy();

    const basename = path.basename(src);
    swc
      .transformFile(src, {
        ...(basename.endsWith('.tsx') || basename.endsWith('.jsx') ? swcOptions.tsxOptions : swcOptions.nonTsxOptions),
        filename: basename,
      })
      .then((output) => {
        // infer extension and patch .mjs imports
        let ext = path.extname(basename);
        if (type === 'esm') {
          ext = importReplaceMJS.indexOf(ext) >= 0 ? '.mjs' : ext;
          output.code = makeReplacements(output.code, regexESM, importReplaceMJS, '.mjs');
          ext = importReplaceCJS.indexOf(ext) >= 0 ? '.cjs' : ext;
          output.code = makeReplacements(output.code, regexESM, importReplaceCJS, '.cjs');
        } else {
          ext = requireReplaceJS.indexOf(ext) >= 0 ? '.js' : ext;
          output.code = makeReplacements(output.code, regexCJS, requireReplaceJS, '.js');
          output.code += interopClientDefaultExport;
        }
        const destFilePath = path.join(dest, basename.replace(/\.[^/.]+$/, '') + ext);

        mkdirp(path.dirname(destFilePath), () => {
          const queue = new Queue();
          queue.defer(fs.writeFile.bind(null, destFilePath, output.code, 'utf8'));
          !options.sourceMaps || queue.defer(fs.writeFile.bind(null, `${destFilePath}.map`, output.map, 'utf8'));
          queue.await(() => (err ? callback(err) : callback(null, path.relative(dest, destFilePath))));
        });
      })
      .catch(callback);
  });
}
