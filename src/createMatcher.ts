import minimatch from 'minimatch';
import path from 'path-posix';
import unixify from 'unixify';
import type { Matcher, TSConfig } from './types.ts';

export default function createMatcher(tsconfig: TSConfig): Matcher {
  const tsconfigPath = path.dirname(unixify(tsconfig.path));

  function matchFn(condition) {
    let pattern = unixify(condition);
    if (!path.isAbsolute(pattern) && !pattern.startsWith('*')) pattern = path.join(tsconfigPath, pattern);

    return function match(filePath) {
      return filePath.startsWith(pattern) || minimatch(filePath, pattern);
    };
  }

  const includes = ((tsconfig.config.include as string[]) || []).map(matchFn);
  const excludes = ((tsconfig.config.exclude as string[]) || []).map(matchFn);

  return function matcher(filePath) {
    if (filePath.endsWith('.json')) return false;

    filePath = unixify(filePath);
    for (let i = 0; i < excludes.length; ++i) {
      if (excludes[i](filePath)) return false;
    }
    for (let j = 0; j < includes.length; ++j) {
      if (includes[j](filePath)) return true;
    }
    return !includes.length;
  };
}
