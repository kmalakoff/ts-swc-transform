import path from 'path';
import url from 'url';

import assert from 'assert';

// @ts-ignore
import { resolveFileSync } from 'ts-swc-transform';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(url.fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(dirname, '..', 'data', 'src');

describe('resolveFileSync', () => {
  describe('parentPath', () => {
    const context = { parentPath: `${SRC_DIR}/index.ts` };

    it('test.ts', () => {
      const file = resolveFileSync('./test.ts', context);
      assert.equal(file, path.join(SRC_DIR, 'test.ts'));
    });

    it('test.js parentPath', () => {
      const file = resolveFileSync('./test.js', context);
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

    it('test.js', () => {
      const file = resolveFileSync('./test.js', context);
      assert.equal(file, path.join(SRC_DIR, 'test.ts'));
    });

    it('test', () => {
      const file = resolveFileSync('./test', context);
      assert.equal(file, path.join(SRC_DIR, 'test.ts'));
    });
  });
});
