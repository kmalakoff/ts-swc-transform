import fs from 'fs';
import Iterator, { type Entry } from 'fs-iterator';
import Module from 'module';
import path from 'path';
import Queue from 'queue-cb';

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;

import { stringEndsWith } from '../compat.ts';
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

      // Step 1: Stat all source files to get their modes (async)
      const sourceModes = new Map<string, number>();
      const statQueue = new Queue();
      entries.forEach((entry) => {
        statQueue.defer((cb) => {
          fs.stat(entry.fullPath, (statErr, stats) => {
            if (!statErr) sourceModes.set(entry.fullPath, stats.mode);
            cb(); // Continue even on error
          });
        });
      });

      statQueue.await((statErr) => {
        if (statErr) {
          callback(statErr);
          return;
        }

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
            // 3a: Rewrite extensions (convert from sync to async)
            // TODO: remove patch for https://github.com/microsoft/TypeScript/issues/61037
            if (compilerOptions.options.rewriteRelativeImportExtensions) {
              if (stringEndsWith(file, '.d.ts') || stringEndsWith(file, '.d.cts') || stringEndsWith(file, '.d.mts')) {
                postQueue.defer((cb) => {
                  fs.readFile(file, 'utf8', (readErr, content) => {
                    if (readErr) return cb(); // Ignore errors, continue
                    const updated = rewriteExtensions(content);
                    if (updated !== content) {
                      fs.writeFile(file, updated, 'utf8', () => cb()); // Ignore write errors
                    } else {
                      cb();
                    }
                  });
                });
              }
            }

            // 3b: Apply executable permissions from source files
            if (stringEndsWith(file, '.d.ts') || stringEndsWith(file, '.d.cts') || stringEndsWith(file, '.d.mts')) {
              const relativePath = path.relative(dest, file);
              const baseName = relativePath.replace(/\.d\.(ts|mts|cts)$/, '');

              for (const [srcPath, mode] of sourceModes) {
                const srcRelative = path.relative(src, srcPath);
                const srcBase = srcRelative.replace(/\.(ts|tsx|mts|cts)$/, '');
                if (baseName === srcBase) {
                  const execBits = mode & 0o111;
                  if (execBits) {
                    postQueue.defer((cb) => {
                      fs.chmod(file, 0o644 | execBits, () => cb()); // Ignore chmod errors
                    });
                  }
                  break;
                }
              }
            }
          });
        }

        postQueue.await(() => callback(null, res.emittedFiles));
      });
    }
  );
}
