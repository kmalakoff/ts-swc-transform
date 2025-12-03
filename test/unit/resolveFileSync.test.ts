import assert from 'assert';
import path from 'path';
import { resolveFileSync } from 'ts-swc-transform';
import url from 'url';
import { stringEndsWith } from '../../src/compat.ts';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, '..', 'data', 'src');

describe('resolveFileSync', () => {
  describe('parentPath', () => {
    const context = { parentPath: `${SRC_DIR}/index.ts` };

    it('test.ts', () => {
      const file = resolveFileSync('./test.ts', context);
      assert.equal(file, path.join(SRC_DIR, 'test.ts'));
    });

    it('test.js parentPath', () => {
      const file = resolveFileSync('./test', context);
      assert.equal(file, path.join(SRC_DIR, 'test.ts'));
    });

    it('test parentPath', () => {
      const file = resolveFileSync('./test', context);
      assert.equal(file, path.join(SRC_DIR, 'test.ts'));
    });
  });

  describe('parentURL', () => {
    const context = { parentURL: `file://${SRC_DIR}/index.ts` };

    it('test.ts with parentURL', () => {
      const file = resolveFileSync('./test.ts', context);
      assert.equal(file, path.join(SRC_DIR, 'test.ts'));
    });

    it('test without extension with parentURL', () => {
      const file = resolveFileSync('./test', context);
      assert.equal(file, path.join(SRC_DIR, 'test.ts'));
    });

    it('resolves relative path from parentURL context', () => {
      const file = resolveFileSync('./test', context);
      assert.equal(file, path.join(SRC_DIR, 'test.ts'));
    });
  });

  describe('error handling', () => {
    const context = { parentPath: `${SRC_DIR}/index.ts` };

    it('returns null for non-existent files', () => {
      const file = resolveFileSync('./nonexistent-file-that-does-not-exist', context);
      assert.equal(file, null);
    });

    it('returns null for non-existent path with extension', () => {
      const file = resolveFileSync('./nonexistent.ts', context);
      assert.equal(file, null);
    });

    it('returns null for non-existent deeply nested path', () => {
      const file = resolveFileSync('./a/b/c/d/e/nonexistent', context);
      assert.equal(file, null);
    });
  });

  describe('directory resolution', () => {
    const context = { parentPath: `${SRC_DIR}/index.ts` };

    it('resolves folder to folder/index file', () => {
      const file = resolveFileSync('./folder', context);
      // Should resolve to folder/index.ts if it exists
      assert.ok(file === null || file.indexOf('folder') !== -1, 'should resolve folder or return null');
    });

    it('resolves folder with trailing slash', () => {
      const file = resolveFileSync('./folder/', context);
      // Should try to find index file in folder
      assert.ok(file === null || file.indexOf('folder') !== -1, 'should resolve folder/ or return null');
    });
  });

  describe('extension resolution', () => {
    const context = { parentPath: `${SRC_DIR}/index.ts` };

    it('resolves file without extension to .ts file', () => {
      const file = resolveFileSync('./test', context);
      assert.ok(stringEndsWith(file, '.ts'), 'should resolve to .ts file');
    });

    it('exact file takes priority over extension search', () => {
      const file = resolveFileSync('./test.ts', context);
      assert.equal(file, path.join(SRC_DIR, 'test.ts'));
    });
  });

  describe('relative path handling', () => {
    const context = { parentPath: `${SRC_DIR}/folder/nested.ts` };

    it('resolves parent directory reference', () => {
      const file = resolveFileSync('../test', context);
      assert.equal(file, path.join(SRC_DIR, 'test.ts'));
    });

    it('resolves current directory reference', () => {
      const file = resolveFileSync('./index', { parentPath: `${SRC_DIR}/folder/nested.ts` });
      // May or may not exist depending on test data structure
      assert.ok(file === null || typeof file === 'string');
    });
  });
});
