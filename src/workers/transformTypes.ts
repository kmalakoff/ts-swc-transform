import Iterator from 'fs-iterator';
import rimraf2 from 'rimraf2';

import Module from 'module';
import lazy from 'lazy-cache';
const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const tsLazy = lazy(_require)('typescript');

import { SKIPS, typeFileRegEx } from '../constants';
import createMatcher from '../createMatcher';

export default function transformTypesWorker(src, dest, options, callback) {
  const tsconfig = options.tsconfig;
  const matcher = createMatcher(tsconfig);

  rimraf2(dest, { disableGlob: true }, () => {
    const entries = [];
    const iterator = new Iterator(src);
    iterator.forEach(
      (entry) => {
        if (!entry.stats.isFile()) return;
        if (!matcher(entry.fullPath)) return;
        if (SKIPS.indexOf(entry.basename) >= 0) return;
        if (typeFileRegEx.test(entry.basename)) return; // return existingTypes.push(entry.fullPath);
        entries.push(entry);
      },
      { concurrency: Infinity },
      (err) => {
        if (err) return callback(err);

        const ts = tsLazy();
        const config = {
          fileNames: entries.map((entry) => entry.fullPath),
          options: {
            ...(tsconfig.compilerOptions || {}),
            outDir: dest,
            allowJs: true,
            declaration: true,
            emitDeclarationOnly: true,
            listEmittedFiles: true,
          },
          projectReferences: tsconfig.config.references,
        };
        const { fileNames, options, projectReferences } = config;
        const host = ts.createCompilerHostWorker(options, /*setParentNodes*/ undefined, ts.sys);
        const programOptions = {
          rootNames: fileNames,
          options,
          projectReferences,
          host,
          configFileParsingDiagnostics: ts.getConfigFileParsingDiagnostics({ fileNames, options }),
        };
        const program = ts.createProgram(programOptions);
        const res = program.emit();
        callback(null, res.emittedFiles);
      }
    );
  });
}
