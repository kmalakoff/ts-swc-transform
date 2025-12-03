import assert from 'assert';
import exit from 'exit';

import App from './lib/App.tsx';
import string from './lib/string.ts';

assert.ok(App, 'App not loaded');
assert.equal(string, 'string', 'String not equal to string');

console.log('Success!');

exit(0); // ensure stdout is drained
