import './polyfills.cjs';
import exit from 'exit';
import assert from 'assert';

// @ts-ignore
import App from './lib/App.js';
import stringCTS from './lib/stringCTS.cjs';
import stringMJS from './lib/stringMJS.mjs';
import stringMTS from './lib/stringMJS.mjs';

assert.ok(App, 'App not loaded');
assert.equal(stringCTS, 'string', 'String not equal to string');
assert.equal(stringMJS, 'string', 'String not equal to string');
assert.equal(stringMTS, 'string', 'String not equal to string');

console.log('Success!');

exit(0); // ensure stdout is drained
