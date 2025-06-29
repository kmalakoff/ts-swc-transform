import assert from 'assert';
import fs from 'fs';
import { removeSync } from 'install-optional';
import path from 'path';
import loadConfigSync from 'read-tsconfig-sync';
// @ts-ignore
import { transformSync } from 'ts-swc-transform';
import url from 'url';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, '..', 'data', 'src');
const tsconfig = loadConfigSync(SRC_DIR);

describe('transformSync', () => {
  before(() => removeSync('@swc/core', '@swc/core-'));

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
});
