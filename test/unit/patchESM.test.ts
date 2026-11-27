import assert from 'assert';
import path from 'path';
import url from 'url';
import patchESM from '../../src/lib/patchESM.ts';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, '..', 'data', 'src');

function entry(basename: string) {
  return { basename, path: basename, fullPath: path.join(SRC_DIR, basename) };
}

describe('patchESM', () => {
  describe('extension mapping', () => {
    it('returns .js for .ts files', () => {
      assert.equal(patchESM(entry('test.ts')), '.js');
    });

    it('returns .js for .tsx files', () => {
      assert.equal(patchESM(entry('Component.tsx')), '.js');
    });

    it('returns .mjs for .mts files', () => {
      assert.equal(patchESM(entry('module.mts')), '.mjs');
    });

    it('returns .cjs for .cts files', () => {
      assert.equal(patchESM(entry('config.cts')), '.cjs');
    });

    it('returns .jsx unchanged for .jsx files (not in extension map)', () => {
      assert.equal(patchESM(entry('Component.jsx')), '.jsx');
    });
  });
});
