import module from 'module';
import path from 'path';
import url from 'url';

import assert from 'assert';

// @ts-ignore
import { resolveFileSync } from 'ts-swc-transform';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, '..', 'data', 'src');
const NODE_MODULES = path.join(__dirname, '..', '..', 'node_modules');
const useCJS = !module.createRequire;

describe('toPath', () => {
  const context = { parentPath: `${SRC_DIR}/index.ts` };

  it('@swc/core', () => {
    const file = resolveFileSync('@swc/core', context);
    assert.equal(file, path.join(NODE_MODULES, '@swc', 'core', 'index.js'));
  });
  it('fs-iterator', () => {
    const file = resolveFileSync('fs-iterator', context);
    if (useCJS) {
      assert.equal(file, path.join(NODE_MODULES, 'fs-iterator', 'dist', 'cjs', 'index.js'));
    } else {
      assert.equal(file, path.join(NODE_MODULES, 'fs-iterator', 'dist', 'esm', 'index.js'));
    }
  });
});
