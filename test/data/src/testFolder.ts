import assert from 'assert';
import exit from 'exit-compat';

import requireFolder from './requireFolder.cjs';
// @ts-ignore
import requireFolderCTS from './requireFolderCTS.cts';

assert.equal(requireFolder, 'folder', 'folder not equal to folder');
assert.equal(requireFolderCTS, 'folder', 'folder not equal to folder');

console.log('Success!');

exit(0); // ensure stdout is drained
