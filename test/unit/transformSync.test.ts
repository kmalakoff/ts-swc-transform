import fs from 'fs';
import path from 'path';
import url from 'url';
import * as getTS from 'get-tsconfig-compat';

import assert from 'assert';

// @ts-ignore
import { transformSync } from 'ts-swc-transform';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, '..', 'data', 'src');
const tsconfig = getTS.getTsconfig(SRC_DIR);

describe('transformSync', () => {
  it('test.ts', () => {
    const filePath = path.join(SRC_DIR, 'test.ts');
    const contents = fs.readFileSync(filePath, 'utf8');
    const res = transformSync(contents, filePath, tsconfig);
    assert.ok(!!res.code);
    assert.equal(typeof res.code, 'string');
  });
});
