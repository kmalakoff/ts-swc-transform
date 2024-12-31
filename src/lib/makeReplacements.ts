import path from 'path';
import { moduleRegEx } from '../constants.js';

export default function makeReplacements(code, regex, extensions, extension) {
  let matches = [];
  let match = regex.exec(code);
  while (match) {
    const dependency = match[1] || match[2] || match[3] || match[4];
    if (!moduleRegEx.test(dependency)) {
      const ext = path.extname(dependency);
      if (ext.length === 0) matches.push({ match, dependency });
      else if (extensions.indexOf(ext) >= 0) matches.push({ ext, match, dependency });
    }
    match = regex.exec(code);
  }

  matches = matches.reverse();
  for (const index in matches) {
    const match = matches[index];

    const start = match.match.index + match.match[0].lastIndexOf(match.dependency);
    const dependencyNoExt = match.ext ? match.dependency.substring(0, match.dependency.length - match.ext.length) : match.dependency;
    code = code.substring(0, start) + dependencyNoExt + extension + code.substring(start + match.dependency.length);
  }
  return code;
}
