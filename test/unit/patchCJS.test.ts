import assert from 'assert';
import path from 'path';
import url from 'url';
import { stringEndsWith, stringStartsWith } from '../../src/compat.ts';
import patchCJS, { interop } from '../../src/lib/patchCJS.ts';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, '..', 'data', 'src');

function entry(basename: string) {
  return { basename, path: basename, fullPath: path.join(SRC_DIR, basename) };
}

describe('patchCJS', () => {
  describe('interop code injection', () => {
    it('appends CJS interop code to output', () => {
      const output = { code: 'let x = 1;', map: undefined };

      patchCJS(entry('test.ts'), output);

      assert.ok(output.code.indexOf('CJS INTEROP') !== -1, 'should contain CJS INTEROP comment');
      assert.ok(output.code.indexOf('module.exports = exports.default') !== -1, 'should reassign module.exports');
      assert.ok(output.code.indexOf('exports.__esModule') !== -1, 'should check __esModule');
    });

    it('preserves original code before interop', () => {
      const originalCode = `let x = require('./x.ts');\nexports.x = x;`;
      const output = { code: originalCode, map: undefined };

      patchCJS(entry('test.ts'), output);

      assert.ok(stringStartsWith(output.code, originalCode), 'should preserve original code');
      assert.ok(stringEndsWith(output.code, interop), 'should end with interop code');
    });
  });

  describe('extension mapping', () => {
    it('returns .js for .ts files', () => {
      assert.equal(patchCJS(entry('test.ts'), { code: '', map: undefined }), '.js');
    });

    it('returns .js for .tsx files', () => {
      assert.equal(patchCJS(entry('Component.tsx'), { code: '', map: undefined }), '.js');
    });

    it('returns .mjs for .mts files', () => {
      assert.equal(patchCJS(entry('module.mts'), { code: '', map: undefined }), '.mjs');
    });

    it('returns .cjs for .cts files', () => {
      assert.equal(patchCJS(entry('config.cts'), { code: '', map: undefined }), '.cjs');
    });
  });
});
