import type { Entry } from 'fs-iterator';
import path from 'path';
import { replaceExtension } from './rewriteExtensions.ts';

export default function patchESM(entry: Entry): string {
  return replaceExtension(path.extname(entry.basename));
}
