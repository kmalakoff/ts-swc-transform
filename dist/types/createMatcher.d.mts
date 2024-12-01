/**
 * @param {{path: string, config: Object}} config The path to the loaded TS config and typescript config.
 * @returns {(filePath:string) => boolean} The function to test for typescript files being included or excluded
 */
export default function createMatcher(config: {
    path: string;
    config: any;
}): (filePath: string) => boolean;
