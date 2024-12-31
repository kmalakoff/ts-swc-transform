import path from 'path';
import { importRegEx } from '../constants';
import makeReplacements from './makeReplacements';

const cjsExtensions = ['.cjs', '.cts'];
const esmExtensions = ['.js', '.ts', '.tsx', '.mts', '.mjs'];

export default function patchESM(output, options, basename) {
  const cjsExtension = options.extensions?.cjs || '.cjs';
  const esmExtension = options.extensions?.esm || '.mjs';

  output.code = makeReplacements(output.code, importRegEx, esmExtensions, esmExtension);
  output.code = makeReplacements(output.code, importRegEx, cjsExtensions, cjsExtension);

  let ext = path.extname(basename);
  if (cjsExtensions.indexOf(ext) >= 0) ext = cjsExtension;
  else if (esmExtensions.indexOf(ext) >= 0) ext = esmExtension;
  return ext;
}
