# Changelog

All notable changes to ts-swc-transform are documented here.

## [2.12.3] - 2026-11-22

### Fixed

- `transformSync`, `transformTypes`, `transformDirectory`, `toPath` and `resolveFileSync` work when the ESM build is imported from `node -e`, `node -p` or a script piped to `node -`. Node defines `require` and `__filename` as globals there, and the ESM build mistook them for its own, failing with `Cannot find module '../cjs/workers/transformSync.js'` (or the `transformTypes` / `transformDirectory` worker), and `toPath` / `resolveFileSync` failed to resolve bare specifiers when run from a directory outside the project. On Node below 20, run from a directory outside your project, `transformSync`, `transformTypes` and `transformDirectory` still fail with `Cannot find module 'function-exec-sync'` until `node-version-call` gets the same fix.

## [2.12.2] - 2026-11-17

### Fixed

- `transformSync` and `transformDirectory` no longer add a `compileOnSave` field to the tsconfig object you pass.

## [2.12.0] - 2026-09-15

### Changed

- `transformTypes` honors `compilerOptions.rootDir` from the tsconfig (resolved relative to the tsconfig file) when laying out the declaration files. It used the source folder before.

## [2.11.14] - 2026-09-12

### Changed

- The `resolve` dependency is pinned to exactly `1.22.12` (it was `^1.3.1`) and `typescript` to `6.0.3`.

## [2.11.13] - 2026-08-23

### Changed

- Installs TypeScript 6 again (back from 7).

## [2.11.12] - 2026-08-23

### Added

- Installs TypeScript 7.
- `transformSync` and `transformDirectory` work when the installed `typescript` is version 7, where `parseJsonConfigFileContent` is not available: the tsconfig `target`, `module` and `jsx` names are converted to their enum values by the package itself.
- `transformTypes` works with TypeScript 7: it drops `downlevelIteration`, maps `moduleResolution` `node`/`node10` to `bundler` and `es3`/`es5` targets to `es2015` before calling the compiler.

## [2.11.11] - 2026-05-26

### Changed

- `transformSync` without a `tsconfig` argument throws `transformSync: failed to load tsconfig` when no tsconfig is found in the current folder. `transformDirectory` and `transformTypes` reject with `transformDirectory: failed to load tsconfig` and `transformTypes: failed to load tsconfig` in the same case.

## [2.11.6] - 2026-05-24

### Changed

- `transformTypes` works with TypeScript 6 (it sets `rootDir` to the source folder and `ignoreDeprecations: '6.0'`) and no longer uses `@typescript/native-preview` if it is installed.

## [2.11.5] - 2026-05-24

### Changed

- Installs TypeScript 6 instead of 5.

## [2.11.4] - 2026-01-08

### Changed

- `transformTypes` runs the TypeScript compiler as a separate process. It installs `@typescript/native-preview` and tries its `tsgo` first, falling back to `tsc`. Only `.ts`, `.tsx`, `.mts`, `.cts`, `.js`, `.jsx`, `.mjs`, `.cjs` and declaration files are passed to it.

## [2.11.3] - 2026-01-08

### Changed

- `transformTypes` no longer copies the source files' executable bits to the declaration files it writes (added in 2.7.7).

## [2.10.0] - 2025-12-18

### Changed

- On Node below 20, `transformSync`, `transformDirectory` and `transformTypes` run through a Node 20 or newer process (through `node-version-call`). Before, only Node below 14 did, and Node 14 to 19 ran the transform in the current process.

## [2.9.0] - 2025-12-18

### Fixed

- When `@swc/core` is installed on demand, the binary matching the platform's libc (glibc or musl) is chosen.

### Changed

- The type declarations of `transformDirectory` and `transformTypes` have separate overloads for the promise and callback forms.

## [2.8.2] - 2025-12-17

### Added

- `toPath` and `resolveFileSync` resolve `#` subpath imports (the `imports` field of the containing `package.json`) for ESM callers. For CommonJS callers they throw `Cannot find module` and say subpath imports are not supported.

### Fixed

- For ESM callers, `toPath` and `resolveFileSync` throw `Cannot find module '<specifier>' from '<dir>'` for a bare specifier that cannot be resolved, instead of falling back to the `resolve` package.

## [2.8.1] - 2025-12-16

### Fixed

- `toPath` and `resolveFileSync` resolve a package that has `exports` but no `main` field.

## [2.8.0] - 2025-12-16

### Changed

- `toPath` and `resolveFileSync` resolve bare specifiers through the package's `exports` field for ESM callers (using `resolve.exports`).

## [2.7.9] - 2025-12-12

### Fixed

- The CommonJS interop line appended to transformed output uses `var` again; 2.7.8 had changed it to `let`, which older Node versions cannot parse.

## [2.7.7] - 2025-12-12

### Added

- `transformDirectory` and `transformTypes` keep the executable bits of source files on the files they write.

## [2.7.3] - 2025-12-03

### Changed

- `constants.extensions` no longer lists `.es6` and `.es`, so `transformDirectory` does not transform those files, and the list is ordered `.ts`, `.tsx`, `.mts`, `.cts`, `.js`, `.mjs`, `.cjs`, `.jsx`.
- When `resolveFileSync` resolves a folder's index file, extensions are tried in that order rather than in directory-listing order.

## [2.7.2] - 2025-12-03

### Fixed

- `transformDirectory`, `transformTypes` and `resolveFileSync` skip declaration files whose names contain dots (for example `a.b.d.ts`); only dot-free names were skipped before.
- `createMatcher` accepts a tsconfig with no `include` or `exclude`.

## [2.7.1] - 2025-12-03

### Fixed

- The errors for a bad `contents` or `fileName` argument to `transformSync` say `transformSync`, not `transformTypes`.

## [2.6.19] - 2025-10-21

### Fixed

- The `types` entry in `package.json` points at `dist/cjs/index.d.ts`; it pointed at `dist/cjs/index.d.cts`.

## [2.6.18] - 2025-10-21

### Fixed

- With `rewriteRelativeImportExtensions`, only relative `import`/`export` specifiers, dynamic `import()` calls and `/// <reference path>` comments have `.ts`, `.tsx`, `.mts` and `.cts` rewritten. 2.6.15 to 2.6.17 rewrote any quoted relative path in the code.

## [2.6.14] - 2025-10-07

### Fixed

- `transformTypes` applies the tsconfig `compilerOptions` (they were ignored) and emits even when the tsconfig sets `noEmit`.

### Added

- With `rewriteRelativeImportExtensions`, `transformTypes` rewrites `.ts` import and `export * from` specifiers in the declaration files to `.js`.

## [2.6.11] - 2025-08-20

### Fixed

- `sourceMaps: true` no longer tries to write a `.map` file when no source map was produced for a file.

## [2.6.10] - 2025-07-08

### Fixed

- `toPath` and `resolveFileSync` work from the ESM build (the `resolve` package is loaded through its default export).

## [2.6.1] - 2025-07-02

### Fixed

- `createMatcher` is exported again; 2.6.0 removed it.

## [2.6.0] - 2025-07-02

### Changed

- Include and exclude patterns are matched with `test-match`.

### Removed

- The `createMatcher` export (restored in 2.6.1).

## [2.4.2] - 2025-06-29

### Fixed

- `createMatcher` and `resolveFileSync` work on Node below 4 (they used `endsWith`, which threw there).

## [2.4.1] - 2025-06-29

### Fixed

- `createMatcher` and `toPath` work on Node below 4 (they used `startsWith`, which threw there).

## [2.4.0] - 2025-06-29

### Removed

- The `loadConfigSync` export (load the tsconfig with `read-tsconfig-sync`).

### Changed

- The `TSConfig` and `TSConfigSchema` types come from `read-tsconfig-sync`.

## [2.3.0] - 2025-06-28

### Added

- `loadConfigSync` export.

### Changed

- The `tsconfig` option, `createMatcher` and `transformSync` take a `{ path, config }` object (the new exported `TSConfig` type) instead of a `get-tsconfig-compat` result. `transformSync` loads the tsconfig itself when it is omitted.

## [2.2.0] - 2025-06-21

### Removed

- The `extensions` option added in 2.0.19.

### Changed

- Output extensions are fixed: `.ts` and `.tsx` become `.js`, `.mts` becomes `.mjs` and `.cts` becomes `.cjs`. With `rewriteRelativeImportExtensions`, relative specifiers with those extensions are rewritten to match without looking at the file system.

## [2.0.20] - 2025-06-21

### Changed

- The default output extension for CommonJS and ESM is `.js` (2.0.19 used `.cjs` and `.mjs`).

## [2.0.19] - 2025-06-21

### Added

- `transformDirectory` writes `.cjs` for CommonJS and `.mjs` for ESM by default (2.0.0 wrote `.js`).
- `transformDirectory` supports `rewriteRelativeImportExtensions`, rewriting import and require specifiers to the output extensions, and an `extensions` option (`{ cjs, esm }`) that sets them. `.mts` and `.cts` files are written as `.mjs` and `.cjs`.

## [2.0.0] - 2025-05-18

### Changed

- 1.x inferred output extensions (`.cjs` and `.mjs`) and rewrote import specifiers to match. 2.0.0 removes that: `.ts` and `.tsx` files are written as `.js` and specifiers are left as they are. The `extensions` option is gone.
- `transformDirectory` no longer deletes the destination folder before writing.
- The package's own entry points are `dist/cjs/index.js` and `dist/esm/index.js` instead of `.cjs` and `.mjs`.

Releases not listed here changed only dependencies, tests, types or tooling.
