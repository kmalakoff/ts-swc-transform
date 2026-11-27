# rewrite-extensions fixture

Sources for `test/integration/rewriteRelativeImportExtensions.test.ts`, which builds them with tsc and with ts-swc-transform and compares the emitted specifiers.

- `main.ts`, `mts.ts`, `cts.ts`: loaded at runtime from the built output (`mts.ts` from the ESM build, `cts.ts` from the CJS build).
- `untouched.ts`: non-relative specifiers that end in `.ts`; checked as text only, never loaded.
- `deviations.ts`: the two cases where swc's rewrite differs from tsc's; checked as text only.
