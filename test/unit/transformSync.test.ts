import assert from 'assert';
import fs from 'fs';
import path from 'path';
import loadConfigSync from 'read-tsconfig-sync';
import { transformSync } from 'ts-swc-transform';
import url from 'url';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, '..', 'data', 'src');
const tsconfig = loadConfigSync(SRC_DIR);

describe('transformSync', () => {
  it('test.ts', () => {
    const filePath = path.join(SRC_DIR, 'test.ts');
    const contents = fs.readFileSync(filePath, 'utf8');
    const res = transformSync(contents, filePath, tsconfig);
    assert.ok(!!res.code);
    assert.equal(typeof res.code, 'string');
  });
  it('test.ts x 2', () => {
    const filePath = path.join(SRC_DIR, 'test.ts');
    const contents = fs.readFileSync(filePath, 'utf8');
    const res = transformSync(contents, filePath, tsconfig);
    assert.ok(!!res.code);
    assert.equal(typeof res.code, 'string');
  });

  describe('validation errors', () => {
    it('throws when contents is null', () => {
      assert.throws(() => {
        transformSync(null as unknown as string, 'test.ts', tsconfig);
      }, /transformSync: unexpected contents/);
    });

    it('throws when contents is undefined', () => {
      assert.throws(() => {
        transformSync(undefined as unknown as string, 'test.ts', tsconfig);
      }, /transformSync: unexpected contents/);
    });

    it('throws when contents is a number', () => {
      assert.throws(() => {
        transformSync(123 as unknown as string, 'test.ts', tsconfig);
      }, /transformSync: unexpected contents/);
    });

    it('throws when contents is an object', () => {
      assert.throws(() => {
        transformSync({} as unknown as string, 'test.ts', tsconfig);
      }, /transformSync: unexpected contents/);
    });

    it('throws when fileName is null', () => {
      assert.throws(() => {
        transformSync('const x = 1;', null as unknown as string, tsconfig);
      }, /transformSync: unexpected fileName/);
    });

    it('throws when fileName is undefined', () => {
      assert.throws(() => {
        transformSync('const x = 1;', undefined as unknown as string, tsconfig);
      }, /transformSync: unexpected fileName/);
    });

    it('throws when fileName is a number', () => {
      assert.throws(() => {
        transformSync('const x = 1;', 123 as unknown as string, tsconfig);
      }, /transformSync: unexpected fileName/);
    });

    it('error message says transformSync (not transformTypes)', () => {
      try {
        transformSync(null as unknown as string, 'test.ts', tsconfig);
        assert.fail('should have thrown');
      } catch (err) {
        assert.ok((err as Error).message.indexOf('transformSync') !== -1, 'error should mention transformSync');
        assert.ok((err as Error).message.indexOf('transformTypes') === -1, 'error should NOT mention transformTypes');
      }
    });
  });
});
