import path from 'path';
import spawn from 'cross-spawn-cb';
import Iterator from 'fs-iterator';
import * as getTS from 'get-tsconfig-compat';
import which from 'module-which';
import rimraf2 from 'rimraf2';

import { SKIPS, typeFileRegEx } from '../constants.js';
import createMatcher from '../createMatcher.js';

export default function transformTypesWorker(src, dest, options, callback) {
  which('tsc', options, (_err, tsc) => {
    const tsconfig = options.tsconfig ? options.tsconfig : getTS.getTsconfig(src);
    const matcher = createMatcher(tsconfig);

    const tsArgs = [];
    for (const key in tsconfig.config.compilerOptions) {
      const value = tsconfig.config.compilerOptions[key];
      tsArgs.push(`--${key}`);
      tsArgs.push(Array.isArray(value) ? value.join(',') : value);
    }

    rimraf2(dest, { disableGlob: true }, () => {
      const entries = [];
      const iterator = new Iterator(src);
      iterator.forEach(
        (entry) => {
          if (!entry.stats.isFile()) return;
          if (!matcher(entry.fullPath)) return;
          if (typeFileRegEx.test(entry.basename)) return;
          if (SKIPS.indexOf(entry.basename) >= 0) return;
          entries.push(entry);
        },
        (err) => {
          if (err) return callback(err);
          if (entries.length === 0) return callback();
          const results = entries.map((entry) => {
            const result = { from: path.relative(src, entry.fullPath), to: '' };
            const dirname = path.dirname(result.from);
            const basename = path.basename(result.from);
            let ext = path.extname(basename);
            ext = ext.replace('sx', 's');
            ext = ext.replace('js', 'ts');
            result.to = path.join(dirname === '.' ? '' : dirname, `${basename.replace(/\.[^/.]+$/, '')}.d${ext}`);
            return result;
          });
          const args = [tsc, ...results.map((x) => path.resolve(src, x.from)), '--declaration', '--emitDeclarationOnly', '--outDir', dest, ...tsArgs];
          spawn(args[0], args.slice(1), { stdio: 'inherit' }, (err) => (err ? callback(err) : callback(null, results)));
        }
      );
    });
  });
}

// import fs from 'fs';
// import path from 'path';
// import Iterator from 'fs-iterator';
// import * as getTS from 'get-tsconfig-compat';
// import mkdirp from 'mkdirp-classic';
// import Queue from 'queue-cb';
// import rimraf2 from 'rimraf2';
// import { type SourceFile, WriteFileCallbackData } from 'typescript';

// // @ts-ignore
// import lazy from '../lib/lazy.cjs';
// const lazyTS = lazy('typescript');

// import { SKIPS, typeFileRegEx } from '../constants.js';
// import createMatcher from '../createMatcher.js';

// export default function transformTypesWorker(src, dest, options, callback) {
//   const tsconfig = options.tsconfig ? options.tsconfig : getTS.getTsconfig(src);
//   const matcher = createMatcher(tsconfig);

//   rimraf2(dest, { disableGlob: true }, () => {
//     const entries = [];
//     const copies = [];
//     const iterator = new Iterator(src);
//     iterator.forEach(
//       (entry) => {
//         if (!entry.stats.isFile()) return;
//         if (!matcher(entry.fullPath)) return;
//         if (typeFileRegEx.test(entry.basename)) return copies.push(entry);
//         if (SKIPS.indexOf(entry.basename) >= 0) return;
//         entries.push(entry);
//       },
//       (err) => {
//         if (err) return callback(err);
//         if (entries.length === 0) return callback();

//         const ts = lazyTS();
//         const options = {
//           ...(tsconfig.compilerOptions || {}),
//           allowJs: true,
//           declaration: true,
//           emitDeclarationOnly: true,
//         };
//         const generated = {};
//         const host = ts.createCompilerHost(options);
//         host.writeFile = (filePath: string, contents: string, writeByteOrderMark: boolean, onError?: (message: string) => void, sourceFiles?: readonly SourceFile[], data?: WriteFileCallbackData) => {
//           // const destPath = path.resolve(dest, path.relative(src, filePath));
//           // mkdirp.sync(path.dirname(destPath))
//           // fs.writeFileSync(destPath, contents, 'utf8');
//           generated[sourceFiles[0].fileName] = { filePath, contents };
//         };

//         // Prepare and emit the d.ts files
//         const program = ts.createProgram(
//           entries.map((entry) => entry.fullPath),
//           options,
//           host
//         );
//         program.emit();

//         const results = entries
//           .filter((entry) => generated[entry.fullPath] !== undefined)
//           .map((entry) => {
//             return { from: entry.path, to: path.relative(src, generated[entry.fullPath].filePath) };
//           });
//         copies.forEach((entry) => results.push({ from: entry.path, to: entry.path }));

//         callback(null, results)

//         // function createFolders(cb) {
//         //   // return cb();
//         //   const queue = new Queue();
//         //   entries.concat(copies)
//         //     .map((x) => path.resolve(dest, path.dirname(x.path)))
//         //     .sort((a, b) => b.localeCompare(a))
//         //     .reduce((m, x) => (m.some((y) => y.startsWith(x)) ? m : m.concat(x)), [])
//         //     .forEach((x) => {
//         //       queue.defer(mkdirp.bind(null, x));
//         //     });
//         //   queue.await(cb);
//         // }
//         // function writeGenerated(cb) {
//         //   const queue = new Queue();
//         //   entries
//         //     .filter((entry) => generated[entry.fullPath] !== undefined)
//         //     .forEach((entry) => {
//         //       const record = generated[entry.fullPath];
//         //       const destPath = path.resolve(dest, path.relative(src, record.filePath));
//         //       queue.defer(fs.writeFile.bind(null, destPath, record.contents, 'utf8'));
//         //     });
//         //   queue.await(cb);
//         // }

//         // function copyTypes(cb) {
//         //   const queue = new Queue();
//         //   copies.forEach((entry) => {
//         //     const destPath = path.resolve(dest, entry.path);
//         //     queue.defer((cb) => {
//         //       fs.readFile(entry.fullPath, (err, contents) => {
//         //         err ? callback(err) : fs.writeFile(destPath, contents, cb);
//         //       });
//         //     });
//         //   });
//         //   queue.await(cb);
//         // }

//         // createFolders((err) => {
//         //   if (err) return callback(err);
//         //   const queue = new Queue();
//         //   queue.defer(writeGenerated.bind(null));
//         //   queue.defer(copyTypes.bind(null));
//         //   queue.await((err) => {
//         //     err ? callback(err) : callback(null, results);
//         //   });
//         // });
//       }
//     );
//   });
// }
