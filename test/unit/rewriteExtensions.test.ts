import assert from 'assert';
import { rewriteExtensions } from '../../src/lib/rewriteExtensions.ts';

describe('rewriteExtensions', () => {
  describe('Import statements', () => {
    it('transforms standard import', () => {
      const input = `import { Foo } from './module.ts';`;
      const expected = `import { Foo } from './module.js';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('transforms import type', () => {
      const input = `import type { Foo } from './types.ts';`;
      const expected = `import type { Foo } from './types.js';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('transforms multiple imports', () => {
      const input = `import { A } from './a.ts';\nimport { B } from './b.ts';`;
      const expected = `import { A } from './a.js';\nimport { B } from './b.js';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('does NOT transform module imports', () => {
      const input = `import { foo } from 'some-package';`;
      assert.strictEqual(rewriteExtensions(input), input);
    });

    it('does NOT transform @scoped module imports', () => {
      const input = `import { foo } from '@types/node';`;
      assert.strictEqual(rewriteExtensions(input), input);
    });

    it('does NOT transform already .js imports', () => {
      const input = `import { foo } from './bar.js';`;
      assert.strictEqual(rewriteExtensions(input), input);
    });

    it('transforms import with parent directory', () => {
      const input = `import { Foo } from '../parent.ts';`;
      const expected = `import { Foo } from '../parent.js';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });
  });

  describe('Export statements', () => {
    it('transforms export from', () => {
      const input = `export * from './module.ts';`;
      const expected = `export * from './module.js';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('transforms export type from', () => {
      const input = `export type * from './types.ts';`;
      const expected = `export type * from './types.js';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('transforms export named', () => {
      const input = `export { Foo } from './foo.ts';`;
      const expected = `export { Foo } from './foo.js';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('transforms export type named', () => {
      const input = `export type { Foo } from './foo.ts';`;
      const expected = `export type { Foo } from './foo.js';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });
  });

  describe('Extension variants', () => {
    it('transforms .mts to .mjs', () => {
      const input = `import { Foo } from './module.mts';`;
      const expected = `import { Foo } from './module.mjs';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('transforms .cts to .cjs', () => {
      const input = `import { Foo } from './module.cts';`;
      const expected = `import { Foo } from './module.cjs';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('transforms .tsx to .js', () => {
      const input = `import { Foo } from './Component.tsx';`;
      const expected = `import { Foo } from './Component.js';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });
  });

  describe('Dynamic import types', () => {
    it('transforms typeof import with double quotes', () => {
      const input = `let worker: typeof import("./workers/sync.ts").default;`;
      const expected = `let worker: typeof import("./workers/sync.js").default;`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('transforms typeof import with single quotes', () => {
      const input = `type Module = typeof import('./module.ts');`;
      const expected = `type Module = typeof import('./module.js');`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('transforms Promise typeof import', () => {
      const input = `function load(): Promise<typeof import('./loader.ts')>;`;
      const expected = `function load(): Promise<typeof import('./loader.js')>;`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('does NOT transform typeof import with module name', () => {
      const input = `type Module = typeof import('external-package');`;
      assert.strictEqual(rewriteExtensions(input), input);
    });
  });

  describe('Declaration-file specifiers (TypeScript leaves them as written)', () => {
    it('does NOT transform .d.ts import type', () => {
      const input = `import type { D } from './decl.d.ts';`;
      assert.strictEqual(rewriteExtensions(input), input);
    });

    it('does NOT transform .d.mts and .d.cts exports', () => {
      const input = `export type * from './esm.d.mts';\nexport type * from './cjs.d.cts';`;
      assert.strictEqual(rewriteExtensions(input), input);
    });

    it('does NOT transform arbitrary-extension declaration files', () => {
      const input = `import type styles from './styles.d.css.ts';`;
      assert.strictEqual(rewriteExtensions(input), input);
    });

    it('does NOT transform typeof import of a declaration file', () => {
      const input = `export type Decl = typeof import('./decl.d.ts');`;
      assert.strictEqual(rewriteExtensions(input), input);
    });

    it('transforms a file whose name only contains .d.', () => {
      const input = `import { x } from './a.d.b.c.ts';\nimport { y } from './data.ts';`;
      const expected = `import { x } from './a.d.b.c.js';\nimport { y } from './data.js';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });
  });

  describe('Triple-slash references (left as tsc emits them)', () => {
    it('does NOT transform triple-slash path reference with .ts', () => {
      const input = `/// <reference path="./globals.ts" />`;
      assert.strictEqual(rewriteExtensions(input), input);
    });

    it('does NOT transform triple-slash path reference with .d.ts', () => {
      const input = `/// <reference path="../types/index.d.ts" preserve="true" />`;
      assert.strictEqual(rewriteExtensions(input), input);
    });

    it('does NOT transform triple-slash lib reference', () => {
      const input = `/// <reference lib="es2020" />`;
      assert.strictEqual(rewriteExtensions(input), input);
    });

    it('does NOT transform triple-slash types reference', () => {
      const input = `/// <reference types="node" />`;
      assert.strictEqual(rewriteExtensions(input), input);
    });
  });

  describe('Edge cases - MUST NOT transform', () => {
    it('does NOT transform .d.ts in string literal', () => {
      const input = `if (file.endsWith('.d.ts')) { }`;
      assert.strictEqual(rewriteExtensions(input), input);
    });

    it('does NOT transform .ts in string literal', () => {
      const input = `const ext = '.ts';`;
      assert.strictEqual(rewriteExtensions(input), input);
    });

    it('does NOT transform .ts in regex pattern', () => {
      const input = 'const pattern = /\\.d\\.ts$/;';
      assert.strictEqual(rewriteExtensions(input), input);
    });

    it('does NOT transform .ts in single-line comment', () => {
      const input = '// This file should be .ts not .js';
      assert.strictEqual(rewriteExtensions(input), input);
    });

    it('does NOT transform .ts in multi-line comment', () => {
      const input = '/* Convert .ts to .js */';
      assert.strictEqual(rewriteExtensions(input), input);
    });

    it('transforms import but NOT .d.ts in string literal', () => {
      const input = `import { X } from './foo.ts';\nif (file.endsWith('.d.ts')) { }`;
      const expected = `import { X } from './foo.js';\nif (file.endsWith('.d.ts')) { }`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });
  });

  describe('Complex real-world scenarios', () => {
    it('handles file with multiple import types', () => {
      const input = `import type { A } from './a.ts';\nexport * from './b.ts';\nvar w: typeof import('./c.ts').C;`;
      const expected = `import type { A } from './a.js';\nexport * from './b.js';\nvar w: typeof import('./c.js').C;`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('handles type file with triple-slash and imports', () => {
      const input = `/// <reference path="./globals.d.ts" />\nimport { X } from './types.ts';`;
      const expected = `/// <reference path="./globals.d.ts" />\nimport { X } from './types.js';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('handles mixed relative and module imports', () => {
      const input = `import { A } from './local.ts';\nimport { B } from 'external';\nimport { C } from '../parent.ts';`;
      const expected = `import { A } from './local.js';\nimport { B } from 'external';\nimport { C } from '../parent.js';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });
  });

  describe('Additional edge cases', () => {
    it('transforms side-effect only imports', () => {
      const input = `import './setup.ts';`;
      const expected = `import './setup.js';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('transforms default import', () => {
      const input = `import Default from './module.ts';`;
      const expected = `import Default from './module.js';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('transforms default + named imports', () => {
      const input = `import Default, { named } from './module.ts';`;
      const expected = `import Default, { named } from './module.js';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('transforms re-export with rename', () => {
      const input = `export { Foo as Bar } from './foo.ts';`;
      const expected = `export { Foo as Bar } from './foo.js';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('handles file.test.ts pattern correctly', () => {
      const input = `import { test } from './utils.test.ts';`;
      const expected = `import { test } from './utils.test.js';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('handles file.spec.ts pattern correctly', () => {
      const input = `import { spec } from './utils.spec.ts';`;
      const expected = `import { spec } from './utils.spec.js';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('transforms namespace import', () => {
      const input = `import * as Utils from './utils.ts';`;
      const expected = `import * as Utils from './utils.js';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('transforms multiple named exports', () => {
      const input = `export { A, B, C } from './abc.ts';`;
      const expected = `export { A, B, C } from './abc.js';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('handles deeply nested relative paths', () => {
      const input = `import { deep } from '../../../very/deep/path.ts';`;
      const expected = `import { deep } from '../../../very/deep/path.js';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('does NOT transform .ts in template literal string', () => {
      const input = 'const ext = `.ts`;';
      assert.strictEqual(rewriteExtensions(input), input);
    });
  });
});
