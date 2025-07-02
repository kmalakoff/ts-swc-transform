import Iterator, { type Entry } from 'fs-iterator';
import Module from 'module';
import path from 'path';
import match from 'test-match';

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;

import { typeFileRegEx } from '../constants.ts';

import type { ConfigOptions, TransformTypesCallback } from '../types.ts';

export default function transformTypesWorker(src: string, dest: string, options: ConfigOptions, callback: TransformTypesCallback): undefined {
  const tsconfig = options.tsconfig;
  const matcher = match({ cwd: path.dirname(tsconfig.path), include: tsconfig.config.include as string[], exclude: tsconfig.config.exclude as string[] });
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
    (err): undefined => {
      if (err) {
        callback(err);
        return;
      }

      const compilerOptions = ts.convertCompilerOptionsFromJson(tsconfig.config.compilerOptions, '');
      const config = {
        fileNames: entries.map((entry) => entry.fullPath),
        options: {
          ...compilerOptions,
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
