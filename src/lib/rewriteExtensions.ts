import path from 'path';
import { moduleRegEx } from '../constants.ts';
import parseSpecifiers from './parseSpecifiers.ts';

export const extensions = {
  '.ts': '.js',
  '.tsx': '.js',
  '.mts': '.mjs',
  '.cts': '.cjs',
};

export function replaceExtension(ext: string): string {
  const replace = extensions[ext];
  return replace === undefined ? ext : replace;
}

export function makeReplacements(code: string, regex: RegExp): string {
  const parsed = parseSpecifiers(code, regex);

  return parsed
    .map((parsed) => {
      if (!parsed.isSpecifier) return parsed.content;
      const specifier = parsed.content;
      if (moduleRegEx.test(specifier)) return specifier;
      if (specifier[0] !== '.') return specifier;
      const ext = path.extname(specifier);
      const replace = replaceExtension(ext);
      if (ext === replace) return specifier;
      return `${specifier.slice(0, -ext.length)}${replace}`;
    })
    .join('');
}
