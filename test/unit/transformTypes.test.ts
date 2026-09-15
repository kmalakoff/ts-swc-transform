import assert from 'assert';
import fs from 'fs';
import { safeRm } from 'fs-remove-compat';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import Pinkie from 'pinkie-promise';
import Queue from 'queue-cb';
import loadConfigSync from 'read-tsconfig-sync';
import type { ConfigOptions } from 'ts-swc-transform';
import { transformTypes } from 'ts-swc-transform';
import url from 'url';
import checkFiles from '../lib/checkFiles.ts';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const TMP_DIR = path.join(__dirname, '..', '..', '.tmp');
const SRC_DIR = path.join(__dirname, '..', 'data', 'src');
const FILE_COUNT = 7;

function tests({ expectedCount, options, promise }: { expectedCount: number; options: ConfigOptions; promise: boolean }) {
  it(`transformTypes (options: ${JSON.stringify(options)}) promise: ${!!promise}`, (done) => {
    const queue = new Queue(1);
    queue.defer(async (cb) => {
      if (!promise) return transformTypes(SRC_DIR, TMP_DIR, options, (err, results) => (err ? cb(err) : checkFiles(TMP_DIR, results ?? [], expectedCount, options, cb)));
      try {
        const results = await transformTypes(SRC_DIR, TMP_DIR, options);
        await checkFiles(TMP_DIR, results, expectedCount, options);
        cb();
      } catch (err) {
        done(err);
      }
    });
    queue.await((err) => {
      !err || console.error(err);
      done(err);
    });
  });
}

describe('transformTypes', () => {
  (() => {
    // patch and restore promise
    if (typeof global === 'undefined') return;
    const globalPromise = global.Promise;
    before(() => {
      global.Promise = Pinkie;
    });
    after(() => {
      global.Promise = globalPromise;
    });
  })();

  describe('clean directory', () => {
    beforeEach((cb) => safeRm(TMP_DIR, cb));
    after((cb) => safeRm(TMP_DIR, cb));

    tests({ expectedCount: FILE_COUNT, options: {}, promise: false });
    tests({ expectedCount: FILE_COUNT, options: {}, promise: true });
  });

  // A skills tree: pkg/src imports ../shared, above its own src. Built under .tmp so the
  // failing case, where tsc emits the out-of-root declaration beside its source, touches no fixture.
  describe('sources above src', () => {
    const TREE = path.join(TMP_DIR, 'siblings');
    const PKG = path.join(TREE, 'pkg');
    const PKG_SRC = path.join(PKG, 'src');
    const PKG_DEST = path.join(TREE, 'types');
    const BASE = path
      .relative(PKG, path.join(__dirname, '..', 'data', 'tsconfig.json'))
      .split(path.sep)
      .join('/');

    beforeEach((cb) => {
      const queue = new Queue(1);
      queue.defer((next) => safeRm(TREE, (err) => next(err)));
      queue.defer((next) => mkdirp(PKG_SRC, (err) => next(err)));
      queue.defer((next) => mkdirp(path.join(TREE, 'shared'), (err) => next(err)));
      queue.await((err) => {
        if (err) return cb(err);
        fs.writeFileSync(path.join(TREE, 'shared', 'table.ts'), 'export interface Row {\n  name: string;\n}\nexport const ROWS: Row[] = [{ name: "a" }];\n');
        fs.writeFileSync(path.join(PKG_SRC, 'index.ts'), 'import { ROWS, type Row } from "../../shared/table.ts";\n\nexport function first(): Row {\n  return ROWS[0];\n}\n');
        fs.writeFileSync(path.join(PKG, 'tsconfig.json'), JSON.stringify({ extends: BASE, compilerOptions: { rootDir: '..' }, include: ['src'] }));
        fs.writeFileSync(path.join(PKG, 'tsconfig.no-root.json'), JSON.stringify({ extends: BASE, include: ['src'] }));
        cb();
      });
    });
    after((cb) => safeRm(TREE, cb));

    it('emits under an explicit rootDir that contains the imported sibling', async () => {
      const results = await transformTypes(PKG_SRC, PKG_DEST);
      const names = results.map((x) => path.relative(PKG_DEST, x)).sort();
      assert.deepEqual(names, [path.join('pkg', 'src', 'index.d.ts'), path.join('shared', 'table.d.ts')]);
    });

    it('fails without one: the sibling is outside the src root', async () => {
      const tsconfig = loadConfigSync(PKG, 'tsconfig.no-root.json');
      assert.ok(tsconfig);
      try {
        await transformTypes(PKG_SRC, PKG_DEST, { tsconfig });
      } catch (err) {
        assert.ok(/TS6059/.test((err as Error).message), (err as Error).message);
        return;
      }
      assert.fail('expected TS6059');
    });
  });

  describe('validation errors (promise)', () => {
    it('rejects when src is null', async () => {
      try {
        await transformTypes(null as unknown as string, TMP_DIR);
        assert.fail('should have rejected');
      } catch (err) {
        assert.ok((err as Error).message.indexOf('unexpected source') !== -1, 'should mention unexpected source');
      }
    });

    it('rejects when src is undefined', async () => {
      try {
        await transformTypes(undefined as unknown as string, TMP_DIR);
        assert.fail('should have rejected');
      } catch (err) {
        assert.ok((err as Error).message.indexOf('unexpected source') !== -1, 'should mention unexpected source');
      }
    });

    it('rejects when src is a number', async () => {
      try {
        await transformTypes(123 as unknown as string, TMP_DIR);
        assert.fail('should have rejected');
      } catch (err) {
        assert.ok((err as Error).message.indexOf('unexpected source') !== -1, 'should mention unexpected source');
      }
    });

    it('rejects when dest is null', async () => {
      try {
        await transformTypes(SRC_DIR, null as unknown as string);
        assert.fail('should have rejected');
      } catch (err) {
        assert.ok((err as Error).message.indexOf('unexpected destination') !== -1, 'should mention unexpected destination');
      }
    });

    it('rejects when dest is undefined', async () => {
      try {
        await transformTypes(SRC_DIR, undefined as unknown as string);
        assert.fail('should have rejected');
      } catch (err) {
        assert.ok((err as Error).message.indexOf('unexpected destination') !== -1, 'should mention unexpected destination');
      }
    });

    it('rejects when dest is a number', async () => {
      try {
        await transformTypes(SRC_DIR, 123 as unknown as string);
        assert.fail('should have rejected');
      } catch (err) {
        assert.ok((err as Error).message.indexOf('unexpected destination') !== -1, 'should mention unexpected destination');
      }
    });
  });

  describe('validation errors (callback)', () => {
    it('calls callback with error when src is invalid', (done) => {
      transformTypes(null as unknown as string, TMP_DIR, {}, (err) => {
        assert.ok(err, 'should have error');
        assert.ok(err.message.indexOf('unexpected source') !== -1, 'should mention unexpected source');
        done();
      });
    });

    it('calls callback with error when dest is invalid', (done) => {
      transformTypes(SRC_DIR, null as unknown as string, {}, (err) => {
        assert.ok(err, 'should have error');
        assert.ok(err.message.indexOf('unexpected destination') !== -1, 'should mention unexpected destination');
        done();
      });
    });
  });
});
