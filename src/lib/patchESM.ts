import path from 'path';

const EXTENSIONS = ['.ts', '.tsx'];

export default function patchESM(entry, _output, _options) {
  const ext = path.extname(entry.basename);
  return EXTENSIONS.indexOf(ext) >= 0 ? '.js' : ext;
}
