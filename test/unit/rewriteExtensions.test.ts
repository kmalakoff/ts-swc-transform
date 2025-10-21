import assert from 'assert';
import { rewriteExtensions, rewriteExtensionsCJS } from '../../src/lib/rewriteExtensions.ts';

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
      const input = `var worker: typeof import("./workers/sync.ts").default;`;
      const expected = `var worker: typeof import("./workers/sync.js").default;`;
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

  describe('Triple-slash references', () => {
    it('transforms triple-slash path reference with .ts', () => {
      const input = `/// <reference path="./globals.ts" />`;
      const expected = `/// <reference path="./globals.js" />`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('transforms triple-slash path reference with .d.ts', () => {
      const input = `/// <reference path="./types.d.ts" />`;
      const expected = `/// <reference path="./types.d.js" />`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('transforms triple-slash path reference with parent directory', () => {
      const input = `/// <reference path="../types/index.d.ts" />`;
      const expected = `/// <reference path="../types/index.d.js" />`;
      assert.strictEqual(rewriteExtensions(input), expected);
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
      const input = `const pattern = /\\.d\\.ts$/;`;
      assert.strictEqual(rewriteExtensions(input), input);
    });

    it('does NOT transform .ts in single-line comment', () => {
      const input = `// This file should be .ts not .js`;
      assert.strictEqual(rewriteExtensions(input), input);
    });

    it('does NOT transform .ts in multi-line comment', () => {
      const input = `/* Convert .ts to .js */`;
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
      const expected = `/// <reference path="./globals.d.js" />\nimport { X } from './types.js';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });

    it('handles mixed relative and module imports', () => {
      const input = `import { A } from './local.ts';\nimport { B } from 'external';\nimport { C } from '../parent.ts';`;
      const expected = `import { A } from './local.js';\nimport { B } from 'external';\nimport { C } from '../parent.js';`;
      assert.strictEqual(rewriteExtensions(input), expected);
    });
  });
});

describe('rewriteExtensionsCJS', () => {
  describe('CommonJS require statements', () => {
    it('transforms require with single quotes', () => {
      const input = `const foo = require('./module.ts');`;
      const expected = `const foo = require('./module.js');`;
      assert.strictEqual(rewriteExtensionsCJS(input), expected);
    });

    it('transforms require with double quotes', () => {
      const input = `require("./path.ts")`;
      const expected = `require("./path.js")`;
      assert.strictEqual(rewriteExtensionsCJS(input), expected);
    });

    it('does NOT transform require with module name', () => {
      const input = `const foo = require('external-package');`;
      assert.strictEqual(rewriteExtensionsCJS(input), input);
    });

    it('handles require + import together', () => {
      const input = `const a = require('./a.ts');\nimport { b } from './b.ts';`;
      const expected = `const a = require('./a.js');\nimport { b } from './b.js';`;
      assert.strictEqual(rewriteExtensionsCJS(input), expected);
    });
  });
});
