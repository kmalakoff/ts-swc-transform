import assert from 'assert';
import spawn from 'cross-spawn-cb';
import fs from 'fs';
import { safeRmSync } from 'fs-remove-compat';
import mkdirp from 'mkdirp-classic';
import Module from 'module';
import path from 'path';
import Pinkie from 'pinkie-promise';
import Queue from 'queue-cb';
import loadConfigSync from 'read-tsconfig-sync';
import resolveBin from 'resolve-bin-sync';
import { transformDirectory, transformTypes } from 'ts-swc-transform';
import url from 'url';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const FIXTURE_DIR = path.join(__dirname, '..', 'data', 'rewrite-extensions');
const SRC_DIR = path.join(FIXTURE_DIR, 'src');
const TMP_DIR = path.join(__dirname, '..', '..', '.tmp', `rewrite-extensions-${process.pid}`);
const OUT = {
  esm: path.join(TMP_DIR, 'esm'),
  cjs: path.join(TMP_DIR, 'cjs'),
  types: path.join(TMP_DIR, 'types'),
  flagOff: path.join(TMP_DIR, 'flag-off'),
  tscEsm: path.join(TMP_DIR, 'tsc-esm'),
  tscCjs: path.join(TMP_DIR, 'tsc-cjs'),
  tscTypes: path.join(TMP_DIR, 'tsc-types'),
};
const SHIM = '_ts_rewrite_relative_import_extension(';
const [major, minor] = process.versions.node.split('.').map(Number);
// the test file runs as ESM where tsds-mocha uses the ESM loader, and as CJS (with require) below that
const isESMTest = typeof require === 'undefined';
// typescript's engines field: >=14.17
const canRunTypeScript = major > 14 || (major === 14 && minor >= 17);

function read(file: string): string {
  return fs.readFileSync(file, 'utf8');
}

function writeJSON(file: string, value: unknown): void {
  fs.writeFileSync(file, JSON.stringify(value), 'utf8');
}

// TypeScript's own scan of import, export, import(), import types and require() specifiers
function specifiers(file: string): string[] {
  const ts = _require('typescript');
  const found: string[] = ts.preProcessFile(read(file), true, true).importedFiles.map((f: { fileName: string }) => f.fileName);
  return found.filter((s, i) => found.indexOf(s) === i).sort();
}

// TypeScript's rewrite rule, applied to tsc's declaration specifiers to get what ts-swc-transform emits
function rewriteLikeJS(specifier: string): string {
  if (!/^\.\.?\//.test(specifier) || /\.d\.([cm]?ts|[^./]+\.ts)$/.test(specifier)) return specifier;
  return specifier
    .replace(/\.tsx?$/, '.js')
    .replace(/\.mts$/, '.mjs')
    .replace(/\.cts$/, '.cjs');
}

function tsc(args: string[], callback: (err?: Error) => void): void {
  spawn(process.execPath, [resolveBin('typescript', 'tsc'), ...args], { encoding: 'utf8' }, (err, res) => {
    if (err) return callback(new Error(`tsc ${args.join(' ')} failed\n${(err as { stdout?: string }).stdout || ''}${(err as { stderr?: string }).stderr || ''}`));
    callback(res ? undefined : new Error('tsc produced no result'));
  });
}

function emittedFiles(dir: string, pattern: RegExp): string[] {
  return fs
    .readdirSync(dir)
    .filter((name) => pattern.test(name))
    .sort();
}

describe('rewriteRelativeImportExtensions', () => {
  const globalPromise = global.Promise;
  before((done) => {
    if (typeof global.Promise === 'undefined') global.Promise = Pinkie;
    safeRmSync(TMP_DIR, { recursive: true, force: true });

    const tsconfig = loadConfigSync(SRC_DIR);
    if (!tsconfig) return done(new Error('fixture tsconfig not found'));
    const flagOff = { ...tsconfig, config: { ...tsconfig.config, compilerOptions: { ...tsconfig.config.compilerOptions, rewriteRelativeImportExtensions: false } } };

    const queue = new Queue(1);
    queue.defer((cb) => transformDirectory(SRC_DIR, OUT.esm, 'esm', {}, (err) => cb(err)));
    queue.defer((cb) => transformDirectory(SRC_DIR, OUT.cjs, 'cjs', {}, (err) => cb(err)));
    queue.defer((cb) => transformDirectory(SRC_DIR, OUT.flagOff, 'esm', { tsconfig: flagOff }, (err) => cb(err)));
    queue.defer((cb) => transformTypes(SRC_DIR, OUT.types, {}, (err) => cb(err)));
    queue.defer((cb) => {
      writeJSON(path.join(OUT.esm, 'package.json'), { type: 'module' });
      writeJSON(path.join(OUT.cjs, 'package.json'), { type: 'commonjs' });
      // neither tool copies a hand-written declaration source into its output
      fs.writeFileSync(path.join(OUT.types, 'decl.d.ts'), read(path.join(SRC_DIR, 'decl.d.ts')), 'utf8');
      cb();
    });
    if (canRunTypeScript) {
      const project = path.join(FIXTURE_DIR, 'tsconfig.json');
      queue.defer((cb) => tsc(['-p', project, '--outDir', OUT.tscEsm], cb));
      queue.defer((cb) => tsc(['-p', project, '--outDir', OUT.tscCjs, '--module', 'commonjs', '--moduleResolution', 'node10', '--ignoreDeprecations', '6.0'], cb));
      queue.defer((cb) => tsc(['-p', project, '--outDir', OUT.tscTypes, '--declaration', '--emitDeclarationOnly'], cb));
    }
    queue.await(done);
  });
  after(() => {
    global.Promise = globalPromise;
    safeRmSync(TMP_DIR, { recursive: true, force: true });
  });

  describe('JS emit', () => {
    it('rewrites static, side-effect, re-export and literal import() specifiers by extension', () => {
      for (const dir of [OUT.esm, OUT.cjs]) {
        const main = read(path.join(dir, 'main.js'));
        for (const specifier of ['./a.js', './side.js', './comp.js', './dyn.js']) assert.ok(main.indexOf(`"${specifier}"`) !== -1, `${dir} main.js has ${specifier}`);
        assert.ok(read(path.join(dir, 'mts.js')).indexOf('"./b.mjs"') !== -1, `${dir} mts.js has ./b.mjs`);
        assert.ok(read(path.join(dir, 'cts.js')).indexOf('"./c.cjs"') !== -1, `${dir} cts.js has ./c.cjs`);
      }
    });

    it('wraps non-literal import() and require() in the runtime helper', () => {
      for (const dir of [OUT.esm, OUT.cjs]) {
        assert.ok(read(path.join(dir, 'main.js')).indexOf(`${SHIM}specifier)`) !== -1, `${dir} main.js shims import(specifier)`);
        assert.ok(read(path.join(dir, 'cts.js')).indexOf(`require(${SHIM}name))`) !== -1, `${dir} cts.js shims require(name)`);
      }
    });

    it('leaves strings, comments and non-relative specifiers unchanged', () => {
      for (const dir of [OUT.esm, OUT.cjs]) {
        const main = read(path.join(dir, 'main.js'));
        assert.ok(main.indexOf(`"import x from './a.ts'"`) !== -1, `${dir} keeps the string literal`);
        assert.ok(main.indexOf('./comment.js') === -1, `${dir} leaves the comment`);
        const untouched = read(path.join(dir, 'untouched.js'));
        for (const specifier of ['fake-pkg/file.ts', '/abs/file.ts', 'file:///abs/file.ts']) assert.ok(untouched.indexOf(`"${specifier}"`) !== -1 || untouched.indexOf(`'${specifier}'`) !== -1, `${dir} keeps ${specifier}`);
      }
    });

    it('does not rewrite when the tsconfig flag is off', () => {
      const main = read(path.join(OUT.flagOff, 'main.js'));
      assert.ok(main.indexOf("'./a.ts'") !== -1 || main.indexOf('"./a.ts"') !== -1, 'keeps ./a.ts');
      assert.ok(main.indexOf(SHIM) === -1, 'adds no helper');
    });

    // swc rewrites require('./x.ts') in a .ts file and shims a template-literal import(); tsc ESM emit leaves both
    // the cjs build's es5 target lowers the template to a plain string first, so swc rewrites it there
    it('documents the deviations from tsc', () => {
      const esm = read(path.join(OUT.esm, 'deviations.js'));
      assert.ok(esm.indexOf('require("./a.js")') !== -1, 'esm rewrites the literal require');
      assert.ok(esm.indexOf(`${SHIM}\`./a.ts\`)`) !== -1, 'esm shims the template literal');
      const cjs = read(path.join(OUT.cjs, 'deviations.js'));
      assert.ok(cjs.indexOf('return require("./a.js")') !== -1, 'cjs rewrites the literal require');
      assert.ok(cjs.indexOf('_interop_require_wildcard(require("./a.js"))') !== -1, 'cjs rewrites the lowered template literal');
    });

    it('matches tsc for every file outside the documented deviations', function () {
      if (!canRunTypeScript) return this.skip();
      const pairs: [string, string][] = [
        [OUT.esm, OUT.tscEsm],
        [OUT.cjs, OUT.tscCjs],
      ];
      for (const [ours, theirs] of pairs) {
        const files = emittedFiles(theirs, /\.[cm]?js$/);
        assert.deepEqual(emittedFiles(ours, /\.[cm]?js$/), files, `${ours} emits the same file names as tsc`);
        for (const name of files) {
          if (name === 'deviations.js') continue;
          assert.deepEqual(specifiers(path.join(ours, name)), specifiers(path.join(theirs, name)), `${path.basename(ours)}/${name}`);
        }
      }
      assert.ok(read(path.join(OUT.tscEsm, 'main.js')).indexOf('__rewriteRelativeImportExtension(specifier') !== -1, 'tsc shims the same call');
      assert.ok(read(path.join(OUT.tscEsm, 'deviations.js')).indexOf("require('./a.ts')") !== -1, 'tsc leaves the literal require');
    });
  });

  describe('runtime', () => {
    const dynFile = () => path.join(OUT.cjs, 'dyn.js');

    it('cjs output resolves every rewritten specifier', (done) => {
      const main = _require(path.join(OUT.cjs, 'main.js'));
      const cts = _require(path.join(OUT.cjs, 'cts.js'));
      assert.deepEqual(main.values, ['a', 'comp']);
      assert.equal(cts.c, 'c');
      assert.equal(cts.requireName('./dyn.ts').dyn, 'dyn');
      assert.equal(cts.requireName(dynFile()).dyn, 'dyn');
      assert.equal(typeof cts.requireName('is-absolute'), 'function');

      const loads = [main.loadDyn(), main.load('./dyn.ts'), main.load(dynFile())];
      Promise.all(loads)
        .then((modules: { dyn: string }[]) => {
          modules.forEach((m) => assert.equal(m.dyn, 'dyn'));
          return main.load('is-absolute');
        })
        .then((m: { default: unknown }) => {
          assert.equal(typeof m.default, 'function');
          done();
        })
        .catch(done);
    });

    it('esm output resolves every rewritten specifier', async function () {
      if (!isESMTest) return this.skip();
      const main = await import(url.pathToFileURL(path.join(OUT.esm, 'main.js')).href);
      const mts = await import(url.pathToFileURL(path.join(OUT.esm, 'mts.js')).href);
      assert.deepEqual(main.values, ['a', 'comp']);
      assert.equal(mts.b, 'b');
      const esmDyn = url.pathToFileURL(path.join(OUT.esm, 'dyn.js')).href;
      for (const m of [await main.loadDyn(), await main.load('./dyn.ts'), await main.load(esmDyn)]) assert.equal(m.dyn, 'dyn');
      assert.equal(typeof (await main.load('is-absolute')).default, 'function');
    });
  });

  describe('declarations', () => {
    it('rewrites relative TypeScript specifiers and leaves declaration-file and non-relative ones', () => {
      const main = read(path.join(OUT.types, 'main.d.ts'));
      for (const specifier of ['./side.js', './types.js', './decl.d.ts']) assert.ok(main.indexOf(`'${specifier}'`) !== -1, `main.d.ts has ${specifier}`);
      assert.ok(main.indexOf(`import("./dyn.js")`) !== -1 && main.indexOf(`import('./dyn.js')`) !== -1, 'main.d.ts rewrites import types');
      assert.ok(read(path.join(OUT.types, 'mts.d.ts')).indexOf("'./b.mjs'") !== -1, 'mts.d.ts has ./b.mjs');
      assert.ok(read(path.join(OUT.types, 'cts.d.ts')).indexOf("'./c.cjs'") !== -1, 'cts.d.ts has ./c.cjs');
      const untouched = read(path.join(OUT.types, 'untouched.d.ts'));
      for (const specifier of ['fake-pkg/file.ts', '/abs/file.ts', 'file:///abs/file.ts']) assert.ok(untouched.indexOf(`'${specifier}'`) !== -1, `untouched.d.ts keeps ${specifier}`);
    });

    // tsc keeps .ts specifiers in declarations (microsoft/TypeScript#61037); the text rewrite also reaches string literal types
    it('differs from tsc only by applying the JS rewrite rule', function () {
      if (!canRunTypeScript) return this.skip();
      const files = emittedFiles(OUT.tscTypes, /\.d\.[cm]?ts$/);
      for (const name of files) assert.deepEqual(specifiers(path.join(OUT.types, name)), specifiers(path.join(OUT.tscTypes, name)).map(rewriteLikeJS).sort(), name);
      assert.ok(read(path.join(OUT.types, 'main.d.ts')).indexOf(`"import x from './a.js'"`) !== -1, 'the string literal type is rewritten');
    });

    for (const resolution of ['bundler', 'nodenext', 'node10']) {
      it(`type-checks as a consumer with moduleResolution ${resolution}`, function (done) {
        if (!canRunTypeScript) return this.skip();
        const consumer = path.join(TMP_DIR, `consumer-${resolution}`);
        const moduleKind = resolution === 'bundler' ? 'esnext' : resolution === 'nodenext' ? 'nodenext' : 'commonjs';
        const types = (name: string) => JSON.stringify(path.relative(consumer, path.join(OUT.types, name)).split(path.sep).join('/'));
        mkdirp(consumer, (err) => {
          if (err) return done(err);
          writeJSON(path.join(consumer, 'tsconfig.json'), { compilerOptions: { module: moduleKind, moduleResolution: resolution, noEmit: true, strict: true, skipLibCheck: false, types: [], ignoreDeprecations: '6.0' }, files: ['use.ts'] });
          const use = [`import type * as M from ${types('main.js')};`, `import type * as E from ${types('mts.js')};`, `import type * as C from ${types('cts.js')};`, 'export type All = [M.Dyn, typeof M.typed, typeof E.b, typeof C.c];', ''];
          fs.writeFileSync(path.join(consumer, 'use.ts'), use.join('\n'), 'utf8');
          tsc(['-p', path.join(consumer, 'tsconfig.json')], done);
        });
      });
    }
  });
});
