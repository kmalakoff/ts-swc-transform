import fs from 'fs';
import path from 'path';
import { moduleRegEx } from '../constants';
import parseSpecifiers from './parseSpecifiers';

export default function makeReplacements(entry, code, regex, extensions, extension, options) {
  const { src } = options;
  const parsed = parseSpecifiers(code, regex);

  return parsed
    .map((parsed) => {
      if (!parsed.isSpecifier) return parsed.content;
      const specifier = parsed.content;
      if (moduleRegEx.test(specifier)) return specifier;

      const ext = path.extname(specifier);
      if (ext && extensions.indexOf(ext) < 0) return specifier;
      if (!ext) {
        try {
          const basename = path.basename(specifier);
          const fullPath = path.join(src, path.dirname(entry.path), specifier);
          const files = fs.readdirSync(path.dirname(fullPath), { withFileTypes: true });
          const found = files.find((x) => x.name === basename);
          if (found && found.isDirectory()) return specifier;
        } catch (_err) {}
      }
      const stripped = ext ? specifier.slice(0, -ext.length) : specifier;
      return `${stripped}${extension}`;
    })
    .join('');
}
