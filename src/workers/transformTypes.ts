import fs from 'fs';
import Iterator, { type Entry } from 'fs-iterator';
import Module from 'module';

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;

import { typeFileRegEx } from '../constants.ts';
import createMatcher from '../createMatcher.ts';
import { rewriteExtensions } from '../lib/rewriteExtensions.ts';

import type { ConfigOptions, TransformTypesCallback } from '../types.ts';

export default function transformTypesWorker(src: string, dest: string, options: ConfigOptions, callback: TransformTypesCallback): undefined {
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
    (err): undefined => {
      if (err) {
        callback(err);
        return;
      }

      const compilerOptions = ts.convertCompilerOptionsFromJson(tsconfig.config.compilerOptions, '');
      const config = {
        fileNames: entries.map((entry) => entry.fullPath),
        options: {
          ...compilerOptions.options,
          outDir: dest,
          noEmit: false,
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

      // TODO: remove patch for https://github.com/microsoft/TypeScript/issues/61037
      if (res.emittedFiles && compilerOptions.options.rewriteRelativeImportExtensions) {
        res.emittedFiles.forEach((file) => {
          if (file.endsWith('.d.ts') || file.endsWith('.d.cts') || file.endsWith('.d.mts')) {
            try {
              const content = fs.readFileSync(file, 'utf8');
              const updated = rewriteExtensions(content);
              if (updated !== content) {
                fs.writeFileSync(file, updated, 'utf8');
              }
            } catch (_err) {
              // Ignore errors
            }
          }
        });
      }
      callback(null, res.emittedFiles);
    }
  );
}
