import fs from 'fs';
import path from 'path';
import once from 'call-once-fn';
import getTS from 'get-tsconfig-compat';
import mkdirp from 'mkdirp';
import Queue from 'queue-cb';

import regexDependencies from './lib/regexDependencies.mjs';
import transformSync from './transformSync.cjs';

const regexESM = regexDependencies(true);
const regexCJS = regexDependencies();

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

function transformFileCallback(src, dest, type, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};

  if (typeof src !== 'string') throw new Error('transformFile: unexpected source');
  if (typeof dest !== 'string') throw new Error('transformFile: unexpected destination directory');
  if (typeof type !== 'string') throw new Error('transformFile: unexpected type');

  fs.readFile(src, 'utf8', (err, contents) => {
    if (err) return callback(err);
    callback = once(callback);

    try {
      let config = options.confg ? options.confg : getTS.getTsconfig(src);

      // overrides for cjs
      if (type === 'cjs') {
        config = { ...config };
        config.config = { ...(config.config || {}) };
        config.config.compilerOptions = { ...(config.config.compilerOptions || {}) };
        config.config.compilerOptions.module = 'CommonJS';
        config.config.compilerOptions.target = 'ES5';
      }

      const basename = path.basename(src);
      const output = transformSync(contents, basename, config);

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
        queue.await(() => (err ? callback(err) : callback(null, destFilePath)));
      });
    } catch (err) {
      callback(err);
    }
  });
}

/**
 * @param {string} src The source directory to traverse.
 * @param {string} dest The output directory to write the file to.
 * @param {string} type The type of transform ('esm' or 'cjs').
 * @param {{sourceMaps: boolean}} options Options to pass to swc.
 * @param {(err: Error | null, destFilePath: string) =>} [callback] Optional callback returing the path to the transformed file. Uses promise if callback not provided.
 * @returns {void | Promise<string>} Optional promise returing the path to the transformed file if callback not provided.
 */
export default function transformFile(src, dest, type, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  options = options || {};

  if (typeof callback === 'function') return transformFileCallback(src, dest, type, options, callback);
  return new Promise((resolve, reject) => {
    transformFileCallback(src, dest, type, options, function compileCallback(err, result) {
      err ? reject(err) : resolve(result);
    });
  });
}
