import assert from 'assert';
// @ts-ignore
import { createMatcher, extensions, resolveFileSync, transformDirectory, transformFile, transformSync } from 'ts-swc-transform';
// @ts-ignore
import * as swc from 'ts-swc-transform';

describe('exports .ts', () => {
  it('named exports', () => {
    assert.ok(!!createMatcher, 'createMatcher exists');
    assert.equal(typeof createMatcher, 'function', 'createMatcher is a function');
    assert.ok(!!extensions, 'extensions exists');
    assert.equal(typeof extensions, 'object', 'extensions is an array');
    assert.ok(!!resolveFileSync, 'resolveFileSync exists');
    assert.equal(typeof resolveFileSync, 'function', 'resolveFileSync is a function');
    assert.ok(!!transformFile, 'transformFile exists');
    assert.equal(typeof transformFile, 'function', 'transformFile is a function');
    assert.ok(!!transformDirectory, 'transformDirectory exists');
    assert.equal(typeof transformDirectory, 'function', 'transformDirectory is a function');
    assert.ok(!!transformSync, 'transformSync exists');
    assert.equal(typeof transformSync, 'function', 'transformSync is a function');
  });

  it('default exports', () => {
    assert.ok(!!swc.extensions, 'extensions exists');
    assert.equal(typeof swc.extensions, 'object', 'extensions is an array');
    assert.ok(!!swc.createMatcher, 'createMatcher exists');
    assert.equal(typeof swc.createMatcher, 'function', 'createMatcher is a function');
    assert.ok(!!swc.resolveFileSync, 'resolveFileSync exists');
    assert.equal(typeof swc.resolveFileSync, 'function', 'resolveFileSync is a function');
    assert.ok(!!swc.transformFile, 'transformFile exists');
    assert.equal(typeof swc.transformFile, 'function', 'transformFile is a function');
    assert.ok(!!swc.transformDirectory, 'transformDirectory exists');
    assert.equal(typeof swc.transformDirectory, 'function', 'transformDirectory is a function');
    assert.ok(!!swc.transformSync, 'transformSync exists');
    assert.equal(typeof swc.transformSync, 'function', 'transformSync is a function');
  });
});
