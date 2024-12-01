import rimraf2 from 'rimraf2';

// @ts-ignore
import { transformDirectory } from 'ts-swc-transform';

import tests, { TMP_DIR, process } from '../lib/tests.cjs';

const FILE_COUNT = 5;
const hasPromise = typeof Promise !== 'undefined';

const major = +process.versions.node.split('.')[0];

describe(`transformDirectory (${major > 0 ? 'esm' : 'cjs'})`, () => {
  beforeEach((cb) => rimraf2(TMP_DIR, { disableGlob: true }, cb.bind(null, null)));
  after((cb) => rimraf2(TMP_DIR, { disableGlob: true }, cb.bind(null, null)));

  tests({ transformDirectory, type: 'cjs', ext: '.js', packageType: 'commonjs', expectedCount: FILE_COUNT + 1, options: {} });
  major <= 10 || tests({ transformDirectory, type: 'esm', ext: '.mjs', packageType: 'module', expectedCount: FILE_COUNT + 1, options: {} });
  tests({ transformDirectory, type: 'cjs', ext: '.js', packageType: 'commonjs', expectedCount: 2 * FILE_COUNT + 1, options: { sourceMaps: true } });
  major <= 10 || tests({ transformDirectory, type: 'esm', ext: '.mjs', packageType: 'module', expectedCount: 2 * FILE_COUNT + 1, options: { sourceMaps: true } });
  !hasPromise || tests({ transformDirectory, type: 'cjs', ext: '.js', packageType: 'commonjs', expectedCount: FILE_COUNT + 1, options: {}, promise: true });
});
