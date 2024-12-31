import type { TsConfigResult } from 'get-tsconfig-compat';
import minimatch from 'minimatch';
import path from 'path-posix';
import unixify from 'unixify';
import loadTsConfig from './loadTsConfig';

/**
 * @param {TsConfigResult} tsconfig The configuration.
 * @returns {(filePath:string) => boolean} The function to test for typescript files being included or excluded
 */
export default function createMatcher(tsConfig: TsConfigResult) {
  const tsconfig = loadTsConfig({ tsconfig: tsConfig }, 'transformTypes');
  const tsconfigPath = path.dirname(unixify(tsconfig.path));

  function matchFn(condition) {
    let pattern = unixify(condition);
    if (!path.isAbsolute(pattern) && !pattern.startsWith('*')) pattern = path.join(tsconfigPath, pattern);

    return function match(filePath) {
      return filePath.startsWith(pattern) || minimatch(filePath, pattern);
    };
  }

  const includes = (tsconfig.config.include || []).map(matchFn);
  const excludes = (tsconfig.config.exclude || []).map(matchFn);

  return function matcher(filePath: string): boolean {
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
