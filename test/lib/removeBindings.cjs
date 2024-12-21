const path = require('path');
const fs = require('fs');
const rimraf2Sync = require('rimraf2').sync;

function rimrafSync(filePath) {
  if (rimraf2Sync) rimraf2Sync(filePath, { disableGlob: true });
  else fs.rmSync(filePath, { recursive: true, force: true });
}

// Delete all @swc/core-* bindings so the tests try loading them
const swcDir = path.dirname(require.resolve('@swc/core/package.json'));
const swcParentDir = path.dirname(swcDir);
const entries = fs.readdirSync(swcParentDir).filter((entry) => entry.indexOf('core-') >= 0);
entries.map((entry) => {
  console.log(`Deleting binding: ${path.join(swcParentDir, entry)}`);
  rimrafSync(path.join(swcParentDir, entry));
});
