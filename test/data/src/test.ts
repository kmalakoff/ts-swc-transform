import './polyfills.cjs';
import exit from 'exit';
import assert from 'assert';

// @ts-ignore
import App from './lib/App.tsx';
import string from './lib/string.mjs';
import stringNoExtension from './lib/string.mjs';

assert.ok(App, 'App not loaded');
assert.equal(string, 'string', 'String not equal to string');
assert.equal(stringNoExtension, 'string', 'stringNoExtension not equal to string');

console.log('Success!');

exit(0); // ensure stdout is drained
