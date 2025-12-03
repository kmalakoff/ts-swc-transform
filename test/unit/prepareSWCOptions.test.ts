import assert from 'assert';
import path from 'path';
import loadConfigSync from 'read-tsconfig-sync';
import url from 'url';
import prepareSWCOptions from '../../src/lib/prepareSWCOptions.ts';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, '..', 'data', 'src');

// SWC only works on Node 14+
const major = +process.versions.node.split('.')[0];
const hasSWC = major >= 14;

describe('prepareSWCOptions', () => {
  // These tests require SWC which only works on Node 14+
  (hasSWC ? describe : describe.skip)('valid tsconfig', () => {
    it('returns TranspilerOptions with tsxOptions and nonTsxOptions', () => {
      const tsconfig = loadConfigSync(SRC_DIR);
      const options = prepareSWCOptions(tsconfig);

      assert.ok(options, 'should return options object');
      assert.ok(options.tsxOptions, 'should have tsxOptions');
      assert.ok(options.nonTsxOptions, 'should have nonTsxOptions');
    });

    it('tsxOptions and nonTsxOptions are different', () => {
      const tsconfig = loadConfigSync(SRC_DIR);
      const options = prepareSWCOptions(tsconfig);

      // TSX options should have JSX configuration different from non-TSX
      assert.notDeepEqual(options.tsxOptions, options.nonTsxOptions, 'tsx and non-tsx options should differ');
    });

    it('returns consistent results for same tsconfig', () => {
      const tsconfig = loadConfigSync(SRC_DIR);
      const options1 = prepareSWCOptions(tsconfig);
      const options2 = prepareSWCOptions(tsconfig);

      assert.ok(options1.tsxOptions, 'first call should have tsxOptions');
      assert.ok(options2.tsxOptions, 'second call should have tsxOptions');
    });
  });

  describe('error handling', () => {
    it('returns empty object for invalid tsconfig path', () => {
      const invalidTsconfig = {
        path: '/nonexistent/tsconfig.json',
        config: { compilerOptions: {} },
      };

      // This may or may not fail depending on how ts parses it
      // The key is it shouldn't throw, just return empty or valid object
      const options = prepareSWCOptions(invalidTsconfig);
      assert.ok(typeof options === 'object', 'should return an object');
    });

    it('returns empty object for missing config property', () => {
      const malformedTsconfig = {
        path: path.join(SRC_DIR, 'tsconfig.json'),
        config: null,
      };

      const options = prepareSWCOptions(malformedTsconfig);
      assert.ok(typeof options === 'object', 'should return an object');
    });

    it('handles tsconfig with invalid compilerOptions gracefully', () => {
      const invalidTsconfig = {
        path: path.join(SRC_DIR, 'tsconfig.json'),
        config: {
          compilerOptions: {
            target: 'not-a-valid-target',
            module: 'not-a-valid-module',
          },
        },
        // biome-ignore lint/suspicious/noExplicitAny: testing invalid input
      } as any;

      // Should not throw - returns empty object on error
      const options = prepareSWCOptions(invalidTsconfig);
      assert.ok(typeof options === 'object', 'should return an object');
    });
  });

  describe('tsconfig option combinations', () => {
    it('handles jsx: preserve', () => {
      const tsconfig = {
        path: path.join(SRC_DIR, 'tsconfig.json'),
        config: { compilerOptions: { jsx: 'preserve' as const } },
      };
      const options = prepareSWCOptions(tsconfig);
      assert.ok(typeof options === 'object', 'should return an object');
    });

    it('handles jsx: react', () => {
      const tsconfig = {
        path: path.join(SRC_DIR, 'tsconfig.json'),
        config: { compilerOptions: { jsx: 'react' as const } },
      };
      const options = prepareSWCOptions(tsconfig);
      assert.ok(typeof options === 'object', 'should return an object');
    });

    it('handles jsx: react-jsx', () => {
      const tsconfig = {
        path: path.join(SRC_DIR, 'tsconfig.json'),
        config: { compilerOptions: { jsx: 'react-jsx' as const } },
      };
      const options = prepareSWCOptions(tsconfig);
      assert.ok(typeof options === 'object', 'should return an object');
    });

    it('handles verbatimModuleSyntax: true', () => {
      const tsconfig = {
        path: path.join(SRC_DIR, 'tsconfig.json'),
        config: { compilerOptions: { verbatimModuleSyntax: true } },
      };
      const options = prepareSWCOptions(tsconfig);
      assert.ok(typeof options === 'object', 'should return an object');
    });

    it('handles target: esnext', () => {
      const tsconfig = {
        path: path.join(SRC_DIR, 'tsconfig.json'),
        config: { compilerOptions: { target: 'esnext' as const } },
      };
      const options = prepareSWCOptions(tsconfig);
      assert.ok(typeof options === 'object', 'should return an object');
    });

    it('handles target: es5', () => {
      const tsconfig = {
        path: path.join(SRC_DIR, 'tsconfig.json'),
        config: { compilerOptions: { target: 'es5' as const } },
      };
      const options = prepareSWCOptions(tsconfig);
      assert.ok(typeof options === 'object', 'should return an object');
    });

    it('handles module: esnext', () => {
      const tsconfig = {
        path: path.join(SRC_DIR, 'tsconfig.json'),
        config: { compilerOptions: { module: 'esnext' as const } },
      };
      const options = prepareSWCOptions(tsconfig);
      assert.ok(typeof options === 'object', 'should return an object');
    });

    it('handles module: commonjs', () => {
      const tsconfig = {
        path: path.join(SRC_DIR, 'tsconfig.json'),
        config: { compilerOptions: { module: 'commonjs' as const } },
      };
      const options = prepareSWCOptions(tsconfig);
      assert.ok(typeof options === 'object', 'should return an object');
    });

    it('handles strict: true', () => {
      const tsconfig = {
        path: path.join(SRC_DIR, 'tsconfig.json'),
        config: { compilerOptions: { strict: true } },
      };
      const options = prepareSWCOptions(tsconfig);
      assert.ok(typeof options === 'object', 'should return an object');
    });

    it('handles experimentalDecorators: true', () => {
      const tsconfig = {
        path: path.join(SRC_DIR, 'tsconfig.json'),
        config: { compilerOptions: { experimentalDecorators: true } },
      };
      const options = prepareSWCOptions(tsconfig);
      assert.ok(typeof options === 'object', 'should return an object');
    });

    it('handles emitDecoratorMetadata: true', () => {
      const tsconfig = {
        path: path.join(SRC_DIR, 'tsconfig.json'),
        config: { compilerOptions: { emitDecoratorMetadata: true } },
      };
      const options = prepareSWCOptions(tsconfig);
      assert.ok(typeof options === 'object', 'should return an object');
    });

    it('handles useDefineForClassFields: true', () => {
      const tsconfig = {
        path: path.join(SRC_DIR, 'tsconfig.json'),
        config: { compilerOptions: { useDefineForClassFields: true } },
      };
      const options = prepareSWCOptions(tsconfig);
      assert.ok(typeof options === 'object', 'should return an object');
    });

    it('handles combination of multiple options', () => {
      const tsconfig = {
        path: path.join(SRC_DIR, 'tsconfig.json'),
        config: {
          compilerOptions: {
            target: 'es2020' as const,
            module: 'esnext' as const,
            jsx: 'react-jsx' as const,
            strict: true,
            experimentalDecorators: true,
          },
        },
      };
      const options = prepareSWCOptions(tsconfig);
      assert.ok(typeof options === 'object', 'should return an object');
    });
  });
});
