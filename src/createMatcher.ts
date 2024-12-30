import minimatch from 'minimatch';
import path from 'path-posix';
import unixify from 'unixify';
import loadTsConfig from './loadTsConfig.js';

/**
 * @param {{path: string, tsconfig: Object}} tsconfig The path to the loaded TS tsconfig and typescript tsconfig.
 * @returns {(filePath:string) => boolean} The function to test for typescript files being included or excluded
 */
export default function createMatcher(tsconfig_) {
  const tsconfig = loadTsConfig({ tsconfig: tsconfig_ }, 'transformTypes');
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
