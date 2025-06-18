import assert from 'assert';
import path from 'path';
// @ts-ignore
import { resolveFileSync } from 'ts-swc-transform';
import url from 'url';

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

    it('test.ts', () => {
      const file = resolveFileSync('./test.ts', context);
      assert.equal(file, path.join(SRC_DIR, 'test.ts'));
    });

    it('test', () => {
      const file = resolveFileSync('./test', context);
      assert.equal(file, path.join(SRC_DIR, 'test.ts'));
    });

    it('test', () => {
      const file = resolveFileSync('./test', context);
      assert.equal(file, path.join(SRC_DIR, 'test.ts'));
    });
  });
});
