import assert from 'assert';
import path from 'path';
import url from 'url';
import { stringEndsWith, stringStartsWith } from '../../src/compat.ts';
import patchCJS, { interop } from '../../src/lib/patchCJS.ts';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, '..', 'data', 'src');

describe('patchCJS', () => {
  describe('interop code injection', () => {
    it('appends CJS interop code to output', () => {
      const entry = { basename: 'test.ts', path: 'test.ts', fullPath: path.join(SRC_DIR, 'test.ts') };
      const output = { code: 'var x = 1;', map: undefined };
      const options = {
        tsconfig: {
          config: { compilerOptions: {} },
          path: path.join(SRC_DIR, 'tsconfig.json'),
        },
      };

      patchCJS(entry, output, options);

      assert.ok(output.code.indexOf('CJS INTEROP') !== -1, 'should contain CJS INTEROP comment');
      assert.ok(output.code.indexOf('module.exports = exports.default') !== -1, 'should reassign module.exports');
      assert.ok(output.code.indexOf('exports.__esModule') !== -1, 'should check __esModule');
    });

    it('preserves original code before interop', () => {
      const entry = { basename: 'test.ts', path: 'test.ts', fullPath: path.join(SRC_DIR, 'test.ts') };
      const originalCode = 'var x = 1;\nexports.x = x;';
      const output = { code: originalCode, map: undefined };
      const options = {
        tsconfig: {
          config: { compilerOptions: {} },
          path: path.join(SRC_DIR, 'tsconfig.json'),
        },
      };

      patchCJS(entry, output, options);

      assert.ok(stringStartsWith(output.code, originalCode), 'should preserve original code');
      assert.ok(stringEndsWith(output.code, interop), 'should end with interop code');
    });
  });

  describe('extension rewriting', () => {
    it('rewrites require paths when rewriteRelativeImportExtensions is true', () => {
      const entry = { basename: 'test.ts', path: 'test.ts', fullPath: path.join(SRC_DIR, 'test.ts') };
      const output = { code: `const foo = require('./foo.ts');`, map: undefined };
      const options = {
        tsconfig: {
          config: { compilerOptions: { rewriteRelativeImportExtensions: true } },
          path: path.join(SRC_DIR, 'tsconfig.json'),
        },
      };

      patchCJS(entry, output, options);

      assert.ok(output.code.indexOf(`require('./foo.js')`) !== -1, 'should rewrite .ts to .js in require');
      assert.ok(output.code.indexOf(`require('./foo.ts')`) === -1, 'should not contain original .ts extension');
    });

    it('rewrites import paths when rewriteRelativeImportExtensions is true', () => {
      const entry = { basename: 'test.ts', path: 'test.ts', fullPath: path.join(SRC_DIR, 'test.ts') };
      const output = { code: `import { bar } from './bar.ts';`, map: undefined };
      const options = {
        tsconfig: {
          config: { compilerOptions: { rewriteRelativeImportExtensions: true } },
          path: path.join(SRC_DIR, 'tsconfig.json'),
        },
      };

      patchCJS(entry, output, options);

      assert.ok(output.code.indexOf(`'./bar.js'`) !== -1, 'should rewrite .ts to .js in import');
    });

    it('does NOT rewrite paths when rewriteRelativeImportExtensions is false', () => {
      const entry = { basename: 'test.ts', path: 'test.ts', fullPath: path.join(SRC_DIR, 'test.ts') };
      const output = { code: `const foo = require('./foo.ts');`, map: undefined };
      const options = {
        tsconfig: {
          config: { compilerOptions: { rewriteRelativeImportExtensions: false } },
          path: path.join(SRC_DIR, 'tsconfig.json'),
        },
      };

      patchCJS(entry, output, options);

      assert.ok(output.code.indexOf(`require('./foo.ts')`) !== -1, 'should NOT rewrite when option is false');
    });

    it('does NOT rewrite paths when rewriteRelativeImportExtensions is undefined', () => {
      const entry = { basename: 'test.ts', path: 'test.ts', fullPath: path.join(SRC_DIR, 'test.ts') };
      const output = { code: `const foo = require('./foo.ts');`, map: undefined };
      const options = {
        tsconfig: {
          config: { compilerOptions: {} },
          path: path.join(SRC_DIR, 'tsconfig.json'),
        },
      };

      patchCJS(entry, output, options);

      assert.ok(output.code.indexOf(`require('./foo.ts')`) !== -1, 'should NOT rewrite when option is undefined');
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

      const ext = patchCJS(entry, output, options);
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

      const ext = patchCJS(entry, output, options);
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

      const ext = patchCJS(entry, output, options);
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

      const ext = patchCJS(entry, output, options);
      assert.equal(ext, '.cjs');
    });
  });
});
