// remove NODE_OPTIONS from ts-dev-stack
// @ts-ignore
import process from '../lib/process.cjs';
// biome-ignore lint/performance/noDelete: <explanation>
delete process.env.NODE_OPTIONS;

import path from 'path';
import url from 'url';

import assert from 'assert';

// @ts-ignore
import { resolveFileSync } from 'ts-swc-transform';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, '..', 'data', 'src');

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
