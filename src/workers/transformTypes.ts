import Iterator, { type Entry } from 'fs-iterator';

import Module from 'module';
const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;

import { typeFileRegEx } from '../constants.js';
import createMatcher from '../createMatcher.js';

export default function transformTypesWorker(src, dest, options, callback) {
  const tsconfig = options.tsconfig;
  const matcher = createMatcher(tsconfig);
  const ts = _require('typescript');

  const entries = [];
  const iterator = new Iterator(src);
  iterator.forEach(
    (entry: Entry): undefined => {
      if (!entry.stats.isFile()) return;
      if (entry.basename[0] === '.') return;
      if (typeFileRegEx.test(entry.basename)) return;
      if (!matcher(entry.fullPath)) return;
      entries.push(entry);
    },
    { concurrency: Infinity },
    (err) => {
      if (err) return callback(err);

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
}
