import fs from 'fs';
import Iterator, { type Entry } from 'fs-iterator';
import Module from 'module';
import os from 'os';
import Queue from 'queue-cb';

const concurrency = Math.min(64, Math.max(8, (os.cpus()?.length ?? 4) * 8));

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;

import { stringEndsWith } from '../compat.ts';
import { typeFileRegEx } from '../constants.ts';
import createMatcher from '../createMatcher.ts';
import { rewriteExtensions } from '../lib/rewriteExtensions.ts';

import type { ConfigOptions, TransformTypesCallback } from '../types.ts';

export default function transformTypesWorker(src: string, dest: string, options: ConfigOptions, callback: TransformTypesCallback) {
  const tsconfig = options.tsconfig;
  const matcher = createMatcher(tsconfig);
  const ts = _require('typescript');

  const entries = [];
  const iterator = new Iterator(src);
  iterator.forEach(
    (entry: Entry): void => {
      if (!entry.stats.isFile()) return;
      if (entry.basename[0] === '.') return;
      if (typeFileRegEx.test(entry.basename)) return;
      if (!matcher(entry.fullPath)) return;
      entries.push(entry);
    },
    { concurrency },
    (err) => {
      if (err) return callback(err);

      // Step 2: TypeScript emit (inherently sync - cannot change)
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

      // Step 3: Post-process emitted files (async)
      const postQueue = new Queue();

      if (res.emittedFiles) {
        res.emittedFiles.forEach((file) => {
          if (compilerOptions.options.rewriteRelativeImportExtensions) {
            if (stringEndsWith(file, '.d.ts') || stringEndsWith(file, '.d.cts') || stringEndsWith(file, '.d.mts')) {
              postQueue.defer((cb) => {
                fs.readFile(file, 'utf8', (readErr, content) => {
                  if (readErr) return cb();
                  const updated = rewriteExtensions(content);
                  if (updated !== content) {
                    fs.writeFile(file, updated, 'utf8', () => cb());
                  } else {
                    cb();
                  }
                });
              });
            }
          }
        });
      }

      postQueue.await(() => callback(null, res.emittedFiles));
    }
  );
}
