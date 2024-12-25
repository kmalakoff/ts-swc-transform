import path from 'path';
import spawn from 'cross-spawn-cb';
import Iterator from 'fs-iterator';
import * as getTS from 'get-tsconfig-compat';
import rimraf2 from 'rimraf2';

import { SKIPS, typeFileRegEx } from '../constants.js';
import createMatcher from '../createMatcher.js';

export default function transformTypesWorker(src, dest, options, callback) {
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
        const args = ['tsc', ...results.map((x) => path.resolve(src, x.from)), '--declaration', '--emitDeclarationOnly', '--outDir', dest, ...tsArgs];
        spawn(args[0], args.slice(1), { stdio: 'inherit' }, (err) => (err ? callback(err) : callback(null, results)));
      }
    );
  });
}
