import assert from 'assert';
import path from 'path';
import url from 'url';
import patchESM from '../../src/lib/patchESM.ts';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, '..', 'data', 'src');

describe('patchESM', () => {
  describe('extension rewriting', () => {
    it('rewrites import paths when rewriteRelativeImportExtensions is true', () => {
      const entry = { basename: 'test.ts', path: 'test.ts', fullPath: path.join(SRC_DIR, 'test.ts') };
      const output = { code: `import { foo } from './foo.ts';`, map: undefined };
      const options = {
        tsconfig: {
          config: { compilerOptions: { rewriteRelativeImportExtensions: true } },
          path: path.join(SRC_DIR, 'tsconfig.json'),
        },
      };

      patchESM(entry, output, options);

      assert.ok(output.code.indexOf(`'./foo.js'`) !== -1, 'should rewrite .ts to .js');
      assert.ok(output.code.indexOf(`'./foo.ts'`) === -1, 'should not contain original .ts extension');
    });

    it('rewrites export paths when rewriteRelativeImportExtensions is true', () => {
      const entry = { basename: 'test.ts', path: 'test.ts', fullPath: path.join(SRC_DIR, 'test.ts') };
      const output = { code: `export * from './module.ts';`, map: undefined };
      const options = {
        tsconfig: {
          config: { compilerOptions: { rewriteRelativeImportExtensions: true } },
          path: path.join(SRC_DIR, 'tsconfig.json'),
        },
      };

      patchESM(entry, output, options);

      assert.ok(output.code.indexOf(`'./module.js'`) !== -1, 'should rewrite .ts to .js in export');
    });

    it('rewrites .mts to .mjs when rewriteRelativeImportExtensions is true', () => {
      const entry = { basename: 'test.ts', path: 'test.ts', fullPath: path.join(SRC_DIR, 'test.ts') };
      const output = { code: `import { foo } from './module.mts';`, map: undefined };
      const options = {
        tsconfig: {
          config: { compilerOptions: { rewriteRelativeImportExtensions: true } },
          path: path.join(SRC_DIR, 'tsconfig.json'),
        },
      };

      patchESM(entry, output, options);

      assert.ok(output.code.indexOf(`'./module.mjs'`) !== -1, 'should rewrite .mts to .mjs');
    });

    it('rewrites .cts to .cjs when rewriteRelativeImportExtensions is true', () => {
      const entry = { basename: 'test.ts', path: 'test.ts', fullPath: path.join(SRC_DIR, 'test.ts') };
      const output = { code: `import { foo } from './config.cts';`, map: undefined };
      const options = {
        tsconfig: {
          config: { compilerOptions: { rewriteRelativeImportExtensions: true } },
          path: path.join(SRC_DIR, 'tsconfig.json'),
        },
      };

      patchESM(entry, output, options);

      assert.ok(output.code.indexOf(`'./config.cjs'`) !== -1, 'should rewrite .cts to .cjs');
    });

    it('does NOT rewrite paths when rewriteRelativeImportExtensions is false', () => {
      const entry = { basename: 'test.ts', path: 'test.ts', fullPath: path.join(SRC_DIR, 'test.ts') };
      const output = { code: `import { foo } from './foo.ts';`, map: undefined };
      const options = {
        tsconfig: {
          config: { compilerOptions: { rewriteRelativeImportExtensions: false } },
          path: path.join(SRC_DIR, 'tsconfig.json'),
        },
      };

      patchESM(entry, output, options);

      assert.ok(output.code.indexOf(`'./foo.ts'`) !== -1, 'should NOT rewrite when option is false');
    });

    it('does NOT rewrite paths when rewriteRelativeImportExtensions is undefined', () => {
      const entry = { basename: 'test.ts', path: 'test.ts', fullPath: path.join(SRC_DIR, 'test.ts') };
      const output = { code: `import { foo } from './foo.ts';`, map: undefined };
      const options = {
        tsconfig: {
          config: { compilerOptions: {} },
          path: path.join(SRC_DIR, 'tsconfig.json'),
        },
      };

      patchESM(entry, output, options);

      assert.ok(output.code.indexOf(`'./foo.ts'`) !== -1, 'should NOT rewrite when option is undefined');
    });

    it('does NOT rewrite module imports', () => {
      const entry = { basename: 'test.ts', path: 'test.ts', fullPath: path.join(SRC_DIR, 'test.ts') };
      const output = { code: `import { foo } from 'some-package';`, map: undefined };
      const options = {
        tsconfig: {
          config: { compilerOptions: { rewriteRelativeImportExtensions: true } },
          path: path.join(SRC_DIR, 'tsconfig.json'),
        },
      };

      patchESM(entry, output, options);

      assert.ok(output.code.indexOf(`'some-package'`) !== -1, 'should NOT modify module imports');
    });
  });

  describe('extension mapping', () => {
    it('returns .js for .ts files', () => {
      const entry = { basename: 'test.ts', path: 'test.ts', fullPath: path.join(SRC_DIR, 'test.ts') };
      const output = { code: '', map: undefined };
      const options = {
        tsconfig: {
          config: { compilerOptions: {} },
          path: path.join(SRC_DIR, 'tsconfig.json'),
        },
      };

      const ext = patchESM(entry, output, options);
      assert.equal(ext, '.js');
    });

    it('returns .js for .tsx files', () => {
      const entry = { basename: 'Component.tsx', path: 'Component.tsx', fullPath: path.join(SRC_DIR, 'Component.tsx') };
      const output = { code: '', map: undefined };
      const options = {
        tsconfig: {
          config: { compilerOptions: {} },
          path: path.join(SRC_DIR, 'tsconfig.json'),
        },
      };

      const ext = patchESM(entry, output, options);
      assert.equal(ext, '.js');
    });

    it('returns .mjs for .mts files', () => {
      const entry = { basename: 'module.mts', path: 'module.mts', fullPath: path.join(SRC_DIR, 'module.mts') };
      const output = { code: '', map: undefined };
      const options = {
        tsconfig: {
          config: { compilerOptions: {} },
          path: path.join(SRC_DIR, 'tsconfig.json'),
        },
      };

      const ext = patchESM(entry, output, options);
      assert.equal(ext, '.mjs');
    });

    it('returns .cjs for .cts files', () => {
      const entry = { basename: 'config.cts', path: 'config.cts', fullPath: path.join(SRC_DIR, 'config.cts') };
      const output = { code: '', map: undefined };
      const options = {
        tsconfig: {
          config: { compilerOptions: {} },
          path: path.join(SRC_DIR, 'tsconfig.json'),
        },
      };

      const ext = patchESM(entry, output, options);
      assert.equal(ext, '.cjs');
    });

    it('returns .jsx unchanged for .jsx files (not in extension map)', () => {
      const entry = { basename: 'Component.jsx', path: 'Component.jsx', fullPath: path.join(SRC_DIR, 'Component.jsx') };
      const output = { code: '', map: undefined };
      const options = {
        tsconfig: {
          config: { compilerOptions: {} },
          path: path.join(SRC_DIR, 'tsconfig.json'),
        },
      };

      const ext = patchESM(entry, output, options);
      assert.equal(ext, '.jsx');
    });
  });

  describe('does NOT add interop code', () => {
    it('ESM output does not contain CJS interop', () => {
      const entry = { basename: 'test.ts', path: 'test.ts', fullPath: path.join(SRC_DIR, 'test.ts') };
      const originalCode = 'export const x = 1;';
      const output = { code: originalCode, map: undefined };
      const options = {
        tsconfig: {
          config: { compilerOptions: {} },
          path: path.join(SRC_DIR, 'tsconfig.json'),
        },
      };

      patchESM(entry, output, options);

      assert.ok(output.code.indexOf('CJS INTEROP') === -1, 'should NOT contain CJS interop code');
      assert.ok(output.code.indexOf('module.exports') === -1, 'should NOT contain module.exports');
    });
  });
});
