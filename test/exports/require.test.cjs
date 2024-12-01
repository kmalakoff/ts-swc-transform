const assert = require('assert');

const { createMatcher, transformFile, transformDirectory, transformSync } = require('ts-swc-transform');
const swc = require('ts-swc-transform');

describe('exports .cjs', () => {
  it('named exports', () => {
    assert.ok(!!createMatcher, 'createMatcher exists');
    assert.equal(typeof createMatcher, 'function', 'createMatcher is a function');
    assert.ok(!!transformFile, 'transformFile exists');
    assert.equal(typeof transformFile, 'function', 'transformFile is a function');
    assert.ok(!!transformDirectory, 'transformDirectory exists');
    assert.equal(typeof transformDirectory, 'function', 'transformDirectory is a function');
    assert.ok(!!transformSync, 'transformSync exists');
    assert.equal(typeof transformSync, 'function', 'transformSync is a function');
  });

  it('default exports', () => {
    assert.ok(!!swc.createMatcher, 'createMatcher exists');
    assert.equal(typeof swc.createMatcher, 'function', 'createMatcher is a function');
    assert.ok(!!swc.transformFile, 'transformFile exists');
    assert.equal(typeof swc.transformFile, 'function', 'transformFile is a function');
    assert.ok(!!swc.transformDirectory, 'transformDirectory exists');
    assert.equal(typeof swc.transformDirectory, 'function', 'transformDirectory is a function');
    assert.ok(!!swc.transformSync, 'transformSync exists');
    assert.equal(typeof swc.transformSync, 'function', 'transformSync is a function');
  });
});
