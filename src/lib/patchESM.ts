import path from 'path';
import { importRegEx } from '../constants';
import makeReplacements from './makeReplacements';

const cjsExtensions = ['.cjs', '.cts'];
const esmExtensions = ['.js', '.ts', '.tsx', '.mts', '.mjs'];

const DEFAULT_EXTENSION_CJS = '.cjs';
const _DEFAULT_EXTENSION_EMS = '.mjs';

export default function patchESM(output, options, basename) {
  const cjsExtension = (options.extensions ? options.extensions.cjs : DEFAULT_EXTENSION_CJS) || DEFAULT_EXTENSION_CJS;
  const esmExtension = (options.extensions ? options.extensions.esm : DEFAULT_EXTENSION_CJS) || DEFAULT_EXTENSION_CJS;

  output.code = makeReplacements(output.code, importRegEx, esmExtensions, esmExtension);
  output.code = makeReplacements(output.code, importRegEx, cjsExtensions, cjsExtension);

  let ext = path.extname(basename);
  if (cjsExtensions.indexOf(ext) >= 0) ext = cjsExtension;
  else if (esmExtensions.indexOf(ext) >= 0) ext = esmExtension;
  return ext;
}
