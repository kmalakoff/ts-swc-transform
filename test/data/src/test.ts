import './polyfills.cjs';
import assert from 'assert';
import exit from 'exit';

import App from './lib/App.js';
import string from './lib/string.js';
import stringInfer from './lib/string.js';

assert.ok(App, 'App not loaded');
assert.equal(string, 'string', 'String not equal to string');
assert.equal(stringInfer, 'string', 'String not equal to string');

console.log('Success!');

exit(0); // ensure stdout is drained
