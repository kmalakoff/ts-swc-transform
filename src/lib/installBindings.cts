const path = require('path');
const existsSync = require('./existsSync.cjs');
const lazy = require('../lazy.cjs');

const major = +process.versions.node.split('.')[0];
const version = major >= 14 ? 'local' : 'lts';
const worker = path.resolve(path.dirname(__dirname), 'workers', `installBinding${path.extname(__filename)}`);
const call = lazy('node-version-call');

const installDir = path.dirname(path.dirname(path.dirname(require.resolve('@swc/core/package.json'))));
const { optionalDependencies } = require('@swc/core/package.json');
const depKey = `${process.platform}-${process.arch}`;

for (const key in optionalDependencies) {
  const depPath = path.join(installDir, key);
  if (key.indexOf(depKey) < 0 || existsSync(depPath)) continue;

  try {
    call()({ version, callbacks: true }, worker, key, optionalDependencies[key]);
  } catch (err) {
    console.log(`Failed to install ${key}@${optionalDependencies[key]}. Error: ${err.message}`);
  }
}
