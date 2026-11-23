import assert from 'assert';
import spawn from 'cross-spawn-cb';
import fs from 'fs';
import { safeRm } from 'fs-remove-compat';
import os from 'os';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', '..');
const SRC_DIR = path.join(__dirname, '..', 'data', 'src');
const TMP_DIR = path.join(root, '.tmp', `nodeEval-${process.pid}`);
const [nodeMajor, nodeMinor] = process.versions.node.split('.').map(Number);
// unflagged ESM import: ^12.17.0 || >=13.2.0
const canImportESM = nodeMajor > 13 || (nodeMajor === 13 && nodeMinor >= 2) || (nodeMajor === 12 && nodeMinor >= 17);

// each call prints a value that proves the API ran
const CALLS: Record<string, string> = {
  transformSync: `m.transformSync('const x: number = 1;', 'a.ts', {}).code`,
  transformTypes: `m.transformTypes(${JSON.stringify(SRC_DIR)}, ${JSON.stringify(TMP_DIR)}, {}).then(function (r) { return r.length; })`,
  transformDirectory: `m.transformDirectory(${JSON.stringify(SRC_DIR)}, ${JSON.stringify(TMP_DIR)}, 'cjs', {}).then(function (r) { return r.length; })`,
};

function evalScript(script: string, cwd: string, callback: (err?: Error) => void) {
  spawn(process.execPath, ['-e', script], { cwd, encoding: 'utf8' }, (err, res) => {
    if (err) return callback(new Error(`${err.message}\n${(err as { stderr?: string }).stderr || ''}`));
    try {
      assert.ok(String(res?.stdout).trim().length > 0, 'expected output from the api');
    } catch (assertErr) {
      return callback(assertErr as Error);
    }
    callback();
  });
}

function esmScript(specifier: string, call: string) {
  return `import(${JSON.stringify(specifier)}).then(function (m) { return Promise.resolve(${call}); }).then(function (r) { console.log(r); })`;
}

// `node -e` defines require and __filename as globals, which a dual build must not mistake for its own CJS module scope
describe('node -e', () => {
  beforeEach((cb) => safeRm(TMP_DIR, cb));
  after((cb) => safeRm(TMP_DIR, cb));

  it('cjs build loaded by its dist path', (done) => {
    evalScript(`var m = require(${JSON.stringify(path.join(root, 'dist', 'cjs', 'index.js'))}); console.log(${CALLS.transformSync})`, root, done);
  });

  if (!canImportESM) return;

  it('esm build toPath of a bare specifier from a directory with no node_modules above it', (done) => {
    // the eval's global require resolves from the cwd, so the cwd must be outside this repository
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-swc-transform-'));
    const specifier = url.pathToFileURL(path.join(root, 'dist', 'esm', 'index.js')).href;
    const call = `m.toPath('is-absolute', { parentPath: ${JSON.stringify(path.join(root, 'index.js'))} })`;
    evalScript(esmScript(specifier, call), cwd, (err) => {
      try {
        fs.rmdirSync(cwd);
      } finally {
        done(err);
      }
    });
  });

  for (const api of Object.keys(CALLS)) {
    it(`esm build by name: ${api}`, (done) => {
      evalScript(esmScript('ts-swc-transform', CALLS[api]), root, done);
    });
  }
});
