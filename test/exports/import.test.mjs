import assert from 'assert';
import * as swc from 'ts-swc-transform';
import { constants, resolveFileSync, toPath, transformDirectory, transformSync } from 'ts-swc-transform';

describe('exports .mjs', () => {
  it('named exports', () => {
    assert.ok(!!constants, 'constants exists');
    assert.equal(typeof constants, 'object', 'constants is an array');
    assert.ok(!!resolveFileSync, 'resolveFileSync exists');
    assert.equal(typeof resolveFileSync, 'function', 'resolveFileSync is a function');
    assert.ok(!!toPath, 'toPath exists');
    assert.equal(typeof toPath, 'function', 'toPath is a function');
    assert.ok(!!transformDirectory, 'transformDirectory exists');
    assert.equal(typeof transformDirectory, 'function', 'transformDirectory is a function');
    assert.ok(!!transformSync, 'transformSync exists');
    assert.equal(typeof transformSync, 'function', 'transformSync is a function');
  });

  it('default exports', () => {
    assert.ok(!!swc.constants, 'constants exists');
    assert.equal(typeof swc.constants, 'object', 'constants is an array');
    assert.ok(!!swc.resolveFileSync, 'resolveFileSync exists');
    assert.equal(typeof swc.resolveFileSync, 'function', 'resolveFileSync is a function');
    assert.ok(!!swc.toPath, 'toPath exists');
    assert.equal(typeof swc.toPath, 'function', 'toPath is a function');
    assert.ok(!!swc.transformDirectory, 'transformDirectory exists');
    assert.equal(typeof swc.transformDirectory, 'function', 'transformDirectory is a function');
    assert.ok(!!swc.transformSync, 'transformSync exists');
    assert.equal(typeof swc.transformSync, 'function', 'transformSync is a function');
  });
});
