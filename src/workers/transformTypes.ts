import fs from 'fs';
import path from 'path';
import Iterator from 'fs-iterator';
import * as getTS from 'get-tsconfig-compat';
import mkdirp from 'mkdirp-classic';
import Queue from 'queue-cb';
import resolveOnceMap from 'resolve-once-map-cb';
import rimraf2 from 'rimraf2';
import type { SourceFile, WriteFileCallbackData } from 'typescript';

import Module from 'module';
import lazy from 'lazy-cache';
const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const tsLazy = lazy(_require)('typescript');

import { SKIPS, typeFileRegEx } from '../constants.js';
import createMatcher from '../createMatcher.js';

export default function transformTypesWorker(src, dest, options, callback) {
  const tsconfig = options.tsconfig ? options.tsconfig : getTS.getTsconfig(src);
  const matcher = createMatcher(tsconfig);
  const existingTypes = [];

  rimraf2(dest, { disableGlob: true }, () => {
    const entries = [];
    const iterator = new Iterator(src);
    iterator.forEach(
      (entry) => {
        if (!entry.stats.isFile()) return;
        if (!matcher(entry.fullPath)) return;
        if (SKIPS.indexOf(entry.basename) >= 0) return;
        if (typeFileRegEx.test(entry.basename)) return existingTypes.push(entry.fullPath);
        entries.push(entry);
      },
      { concurrency: Infinity },
      (err) => {
        if (err) return callback(err);

        const results = [];
        const pathMap = resolveOnceMap((destPath, cb) => mkdirp(destPath, cb)); // mkdirs only once

        function writeFile(sourceFile, destFile, contents, cb) {
          results.push({ from: path.relative(src, sourceFile), to: path.relative(src, destFile) });
          const destPath = path.join(dest, results[results.length - 1].to);

          const q = new Queue(1);
          q.defer(pathMap.bind(null, path.dirname(destPath)));
          q.defer(fs.writeFile.bind(null, destPath, contents, 'utf8'));
          q.await(cb);
        }

        function writeType(filePath, cb) {
          results.push({ from: path.relative(src, filePath), to: path.relative(src, filePath) });
          const destPath = path.join(dest, results[results.length - 1].to);

          const q = new Queue(1);
          q.defer(pathMap.bind(null, path.dirname(destPath)));
          q.defer((cb) =>
            fs.readFile(filePath, (err, contents) => {
              err ? callback(err) : fs.writeFile(destPath, contents, cb);
            })
          );
          q.await(cb);
        }

        const queue = new Queue();
        existingTypes.map((filePath) => queue.defer(writeType.bind(null, filePath)));

        const ts = tsLazy();
        const options = {
          ...(tsconfig.compilerOptions || {}),
          allowJs: true,
          declaration: true,
          emitDeclarationOnly: true,
        };
        const host = ts.createCompilerHost(options);
        host.writeFile = (filePath: string, contents: string, _writeByteOrderMark: boolean, _onError?: (message: string) => void, sourceFiles?: readonly SourceFile[], _data?: WriteFileCallbackData) => {
          queue.defer(writeFile.bind(null, sourceFiles[0].fileName, filePath, contents));
        };

        // Prepare and emit the d.ts files
        const program = ts.createProgram(
          entries.map((entry) => entry.fullPath),
          options,
          host
        );
        program.emit();
        queue.await((err) => (err ? callback(err) : callback(null, results)));
      }
    );
  });
}

// import path from 'path';
// import spawn from 'cross-spawn-cb';
// import Iterator from 'fs-iterator';
// import * as getTS from 'get-tsconfig-compat';
// import rimraf2 from 'rimraf2';

// import { SKIPS, typeFileRegEx } from '../constants.js';
// import createMatcher from '../createMatcher.js';

// export default function transformTypesWorker(src, dest, options, callback) {
//   const tsconfig = options.tsconfig ? options.tsconfig : getTS.getTsconfig(src);
//   const matcher = createMatcher(tsconfig);

//   const tsArgs = [];
//   for (const key in tsconfig.config.compilerOptions) {
//     const value = tsconfig.config.compilerOptions[key];
//     tsArgs.push(`--${key}`);
//     tsArgs.push(Array.isArray(value) ? value.join(',') : value);
//   }

//   rimraf2(dest, { disableGlob: true }, () => {
//     const entries = [];
//     const iterator = new Iterator(src);
//     iterator.forEach(
//       (entry) => {
//         if (!entry.stats.isFile()) return;
//         if (!matcher(entry.fullPath)) return;
//         if (typeFileRegEx.test(entry.basename)) return;
//         if (SKIPS.indexOf(entry.basename) >= 0) return;
//         entries.push(entry);
//       },
//       (err) => {
//         if (err) return callback(err);
//         if (entries.length === 0) return callback();
//         const results = entries.map((entry) => {
//           const result = { from: path.relative(src, entry.fullPath), to: '' };
//           const dirname = path.dirname(result.from);
//           const basename = path.basename(result.from);
//           let ext = path.extname(basename);
//           ext = ext.replace('sx', 's');
//           ext = ext.replace('js', 'ts');
//           result.to = path.join(dirname === '.' ? '' : dirname, `${basename.replace(/\.[^/.]+$/, '')}.d${ext}`);
//           return result;
//         });
//         const args = ['tsc', ...results.map((x) => path.resolve(src, x.from)), '--declaration', '--emitDeclarationOnly', '--outDir', dest, ...tsArgs];
//         spawn(args[0], args.slice(1), { stdio: 'inherit' }, (err) => (err ? callback(err) : callback(null, results)));
//       }
//     );
//   });
// }
