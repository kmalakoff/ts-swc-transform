import assert from 'assert';
import exit from 'exit';

import requireFolder from './requireFolder.cjs';

assert.equal(requireFolder, 'folder', 'folder not equal to folder');

console.log('Success!');

exit(0); // ensure stdout is drained
