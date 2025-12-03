import assert from 'assert';
import module from 'module';
import path from 'path';
import { resolveFileSync } from 'ts-swc-transform';
import url from 'url';

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

  describe('module resolution', () => {
    it('resolves scoped packages', () => {
      const file = resolveFileSync('@swc/core', context);
      assert.ok(file, 'should resolve @swc/core');
      assert.ok(file.indexOf('@swc') !== -1, 'path should include @swc');
      assert.ok(file.indexOf('core') !== -1, 'path should include core');
    });

    it('resolves packages with exports field', () => {
      // fs-iterator has exports field for ESM/CJS
      const file = resolveFileSync('fs-iterator', context);
      assert.ok(file, 'should resolve fs-iterator');
      assert.ok(file.indexOf('fs-iterator') !== -1, 'path should include fs-iterator');
    });

    it('resolves typescript package', () => {
      const file = resolveFileSync('typescript', context);
      assert.ok(file, 'should resolve typescript');
      assert.ok(file.indexOf('typescript') !== -1, 'path should include typescript');
    });

    it('resolves read-tsconfig-sync package', () => {
      const file = resolveFileSync('read-tsconfig-sync', context);
      assert.ok(file, 'should resolve read-tsconfig-sync');
      assert.ok(file.indexOf('read-tsconfig-sync') !== -1, 'path should include read-tsconfig-sync');
    });
  });

  describe('non-existent modules', () => {
    it('throws for non-existent package', () => {
      const specifier = 'this-package-definitely-does-not-exist-12345';
      assert.throws(() => resolveFileSync(specifier, context), /Cannot find module/);
    });

    it('throws for non-existent scoped package', () => {
      const specifier = '@nonexistent/package-12345';
      assert.throws(() => resolveFileSync(specifier, context), /Cannot find module/);
    });
  });

  describe('relative paths', () => {
    it('resolves relative path with ./', () => {
      const file = resolveFileSync('./test', context);
      assert.ok(file, 'should resolve relative ./test');
      assert.ok(file.indexOf('test') !== -1, 'path should include test');
    });

    it('resolves relative path with ../', () => {
      const nestedContext = { parentPath: `${SRC_DIR}/folder/nested.ts` };
      const file = resolveFileSync('../test', nestedContext);
      assert.ok(file, 'should resolve relative ../test');
      assert.ok(file.indexOf('test') !== -1, 'path should include test');
    });
  });

  describe('absolute paths', () => {
    it('resolves absolute path as-is', () => {
      const absPath = path.join(SRC_DIR, 'test.ts');
      const file = resolveFileSync(absPath, context);
      assert.equal(file, absPath, 'should return absolute path as-is');
    });
  });
});
