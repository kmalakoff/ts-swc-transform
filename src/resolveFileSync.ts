import fs from 'fs';
import path from 'path';
import { moduleRegEx, typeFileRegEx } from './constants';
import extensions from './extensions';
import toPath from './toPath';
import type { Context } from './types';

const indexExtensions = extensions.map((x) => `index${x}`);

export default function resolveFileSync(specifier: string, context?: Context) {
  const filePath = toPath(specifier, context);
  let stat: fs.Stats;
  try {
    stat = fs.statSync(filePath);
  } catch (_err) {}

  try {
    if (stat?.isDirectory() || specifier.endsWith('/')) {
      const items = fs.readdirSync(filePath);
      const item = items.find((x) => indexExtensions.indexOf(x) >= 0);
      if (item) return path.join(filePath, item);
    } else if (!stat && !moduleRegEx.test(specifier)) {
      const fileName = path.basename(filePath).replace(/(\.[^/.]+)+$/, '');
      const items = fs.readdirSync(path.dirname(filePath));
      const item = items.find((x) => x.startsWith(fileName) && !typeFileRegEx.test(x) && extensions.indexOf(path.extname(x)) >= 0);
      if (item) return path.join(path.dirname(filePath), item);
    }
    // return what was found
    return stat ? filePath : null;
  } catch (_err) {
    return null;
  }
}
