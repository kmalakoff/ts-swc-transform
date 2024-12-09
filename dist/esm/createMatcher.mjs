import minimatch from 'minimatch';
import path from 'path-posix';
import unixify from 'unixify';
/**
 * @param {{path: string, config: Object}} config The path to the loaded TS config and typescript config.
 * @returns {(filePath:string) => boolean} The function to test for typescript files being included or excluded
 */ export default function createMatcher(config) {
    const configPath = path.dirname(unixify(config.path));
    function matchFn(condition) {
        let pattern = unixify(condition);
        if (!path.isAbsolute(pattern) && !pattern.startsWith('*')) pattern = path.join(configPath, pattern);
        return function match(filePath) {
            return filePath.startsWith(pattern) || minimatch(filePath, pattern);
        };
    }
    const includes = (config.config.include || []).map(matchFn);
    const excludes = (config.config.exclude || []).map(matchFn);
    return function matcher(filePath) {
        if (filePath.endsWith('.json')) return false;
        filePath = unixify(filePath);
        for(let i = 0; i < excludes.length; ++i){
            if (excludes[i](filePath)) return false;
        }
        for(let j = 0; j < includes.length; ++j){
            if (includes[j](filePath)) return true;
        }
        return !includes.length;
    };
}
