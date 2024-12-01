/**
 * @param {string} src The source directory to traverse.
 * @param {string} dest The output directory to write the file to.
 * @param {string} type The type of transform ('esm' or 'cjs').
 * @param {{sourceMaps: boolean}} options Options to pass to swc.
 * @param {(err?: Error, destFilePath: string) =>} [callback] Optional callback returing the path to the transformed file. Uses promise if callback not provided.
 * @returns {void | Promise<string>} Optional promise returing the path to the transformed file if callback not provided.
 */
export default function transformFile(src: string, dest: string, type: string, options: {
    sourceMaps: boolean;
}, callback?: (err?: Error, destFilePath: string) => any): void | Promise<string>;
