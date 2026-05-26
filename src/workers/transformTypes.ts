import spawn, { type SpawnCallback, type SpawnResult } from 'cross-spawn-cb';
import fs from 'fs';
import Iterator, { type Entry } from 'fs-iterator';
import { safeRm } from 'fs-remove-compat';
import os from 'os';
import path from 'path';
import Queue from 'queue-cb';
import resolveBin from 'resolve-bin-sync';

const concurrency = Math.min(64, Math.max(8, (os.cpus()?.length ?? 4) * 8));

const tscPath = resolveBin('typescript', 'tsc');

import createMatcher from '../createMatcher.ts';
import { rewriteExtensions } from '../lib/rewriteExtensions.ts';

import type { InternalConfigOptions, TransformTypesCallback } from '../types.ts';

/* ---------------- root file filtering ---------------- */

function isAllowedRootFile(basename: string): boolean {
  return (
    basename.endsWith('.d.ts') ||
    basename.endsWith('.d.mts') ||
    basename.endsWith('.d.cts') ||
    basename.endsWith('.ts') ||
    basename.endsWith('.tsx') ||
    basename.endsWith('.mts') ||
    basename.endsWith('.cts') ||
    basename.endsWith('.js') ||
    basename.endsWith('.jsx') ||
    basename.endsWith('.mjs') ||
    basename.endsWith('.cjs')
  );
}

/* ---------------- compiler execution ---------------- */

function runCompiler(cmdPath: string, args: string[], cb: SpawnCallback): void {
  spawn(process.execPath, [cmdPath, ...args], { encoding: 'utf8' }, cb);
}

/* ---------------- emitted file parsing ---------------- */

function parseEmittedFiles(res: SpawnResult, dest: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const lines = `${res.stdout}\n${res.stderr}`.split(/\r?\n/);

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (/^TSFILE:\s+/i.test(line)) line = line.replace(/^TSFILE:\s+/i, '').trim();

    if (!path.isAbsolute(line)) continue;
    if (!(line.endsWith('.d.ts') || line.endsWith('.d.mts') || line.endsWith('.d.cts'))) continue;

    // Optional safety: only accept outputs under dest
    const rel = path.relative(dest, line);
    if (rel.startsWith('..') || path.isAbsolute(rel)) continue;

    if (!seen.has(line)) {
      seen.add(line);
      out.push(line);
    }
  }

  return out;
}

export default function transformTypesWorker(src: string, dest: string, options: InternalConfigOptions, callback: TransformTypesCallback) {
  const tsconfig = options.tsconfig;
  const matcher = createMatcher(tsconfig);

  const rootFiles: string[] = [];
  const iterator = new Iterator(src);

  iterator.forEach(
    (entry: Entry): void => {
      const stats = entry.stats as fs.Stats | undefined;
      if (!stats || !stats.isFile()) return;
      const basename = entry.basename as string;
      if (basename[0] === '.') return;
      if (!isAllowedRootFile(basename)) return;
      if (!matcher(entry.fullPath)) return;

      rootFiles.push(entry.fullPath);
    },
    { concurrency },
    (err) => {
      if (err) return callback(err);
      if (rootFiles.length === 0) return callback(null, []);

      const compilerOptions = {
        ...tsconfig.config.compilerOptions,
        rootDir: src,
        outDir: dest,
        noEmit: false,
        allowJs: true,
        declaration: true,
        emitDeclarationOnly: true,
        // Suppress TS6 deprecation warnings (TS5101/TS5107) for consumers still on legacy Node-targeted options.
        ignoreDeprecations: '6.0',
      };

      const rewrite = (tsconfig.config.compilerOptions as { rewriteRelativeImportExtensions?: boolean } | undefined)?.rewriteRelativeImportExtensions === true;

      // Avoid collisions across concurrent runs.
      const tempDir = path.join(dest, '.ts-swc-transform-temp', String(process.pid), String(Date.now()));
      const tempConfigPath = path.join(tempDir, 'tsconfig.json');

      const tempConfig = {
        compilerOptions,
        files: rootFiles,
        include: [],
        exclude: [],
        ...(tsconfig.config.references && { references: tsconfig.config.references }),
      };

      fs.mkdir(tempDir, { recursive: true }, (mkdirErr) => {
        if (mkdirErr) return callback(mkdirErr);

        fs.writeFile(tempConfigPath, JSON.stringify(tempConfig, null, 2), 'utf8', (writeErr) => {
          if (writeErr) {
            safeRm(tempDir, { recursive: true, force: true }, () => callback(writeErr));
            return;
          }

          const args = ['--project', tempConfigPath, '--listEmittedFiles', '--pretty', 'false'];

          runCompiler(tscPath, args, (runErr, res) => {
            if (runErr || !res || res.status !== 0) {
              // cross-spawn-cb sets runErr (with stdout/stderr/status copied onto it) on non-zero exit
              // and does NOT pass res — read from runErr first, then fall back to res.
              const source = (runErr as unknown as SpawnResult | undefined) ?? res;
              const status = source?.status;
              const stdout = String(source?.stdout ?? '');
              const stderr = String(source?.stderr ?? '');
              const detail = `TypeScript compiler failed (status=${status}).\nstdout:\n${stdout.slice(0, 100_000)}\nstderr:\n${stderr.slice(0, 20_000)}`;
              safeRm(tempDir, { recursive: true, force: true }, () => callback(new Error(detail)));
              return;
            }

            const emittedFiles = parseEmittedFiles(res, dest);
            if (emittedFiles.length === 0) {
              safeRm(tempDir, { recursive: true, force: true }, () => callback(new Error('TypeScript compiler produced no emitted declaration files')));
              return;
            }

            const postQueue = new Queue();

            if (rewrite) {
              for (const file of emittedFiles) {
                postQueue.defer((cb) => {
                  fs.readFile(file, 'utf8', (readErr, content) => {
                    if (readErr) return cb();
                    const updated = rewriteExtensions(content);
                    if (updated === content) cb();
                    else fs.writeFile(file, updated, 'utf8', (err) => cb(err));
                  });
                });
              }
            }

            postQueue.await(() => {
              safeRm(tempDir, { recursive: true, force: true }, (rmErr) => callback(rmErr || null, emittedFiles));
            });
          });
        });
      });
    }
  );
}
