import './polyfills.cjs';
import assert from 'assert';
import exit from 'exit';

import App from './lib/App.js';
// @ts-ignore
import stringCTS from './lib/stringCTS.cjs';
import stringMJS from './lib/stringMJS.mjs';
import stringMTS from './lib/stringMJS.mjs';

assert.ok(App, 'App not loaded');
assert.equal(stringCTS, 'string', 'String not equal to string');
assert.equal(stringMJS, 'string', 'String not equal to string');
assert.equal(stringMTS, 'string', 'String not equal to string');

console.log('Success!');

exit(0); // ensure stdout is drained
