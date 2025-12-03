import fs from 'fs';
import find from 'lodash.find';
import path from 'path';
import { extensions, moduleRegEx, typeFileRegEx } from './constants.ts';
import toPath from './toPath.ts';
import type { Context } from './types.ts';

const indexExtensions = extensions.map((x) => `index${x}`);

export default function resolveFileSync(specifier: string, context?: Context): string {
  const filePath = toPath(specifier, context);
  let stat: fs.Stats;
  try {
    stat = fs.statSync(filePath);
  } catch (_err) {}
  try {
    if ((stat && stat.isDirectory()) || specifier[specifier.length - 1] === '/') {
      const items = fs.readdirSync(filePath);
      const item = find(indexExtensions, (x) => items.indexOf(x) !== -1);
      if (item) return path.join(filePath, item);
    } else if (!stat && !moduleRegEx.test(specifier)) {
      const ext = path.extname(filePath);
      const basename = ext ? path.basename(filePath).slice(0, -ext.length) : path.basename(filePath);
      const items = fs.readdirSync(path.dirname(filePath));
      const item = find(items, (x) => {
        if (typeFileRegEx.test(x)) return false;
        const extTest = path.extname(x);
        const basenameTest = extTest ? path.basename(x).slice(0, -extTest.length) : path.basename(x);
        return basename === basenameTest;
      });
      if (item) return path.join(path.dirname(filePath), item);
    }
    // return what was found
    return stat ? filePath : null;
  } catch (_err) {
    return null;
  }
}
