const path = require('path');
const major = +process.versions.node.split('.')[0];
const version = major >= 14 ? 'local' : 'lts';
const worker = path.resolve(__dirname, 'workers', `transformSync${path.extname(__filename)}`);
let call = null; // break dependencies
/**
 * @param {string} contents The file contents.
 * @param {string} fileName The filename.
 * @returns {{ code: string, map?: string }} Returns object with the transformed code and source map if option sourceMaps was provided.
 */ module.exports = function transformSync(contents, fileName, config) {
    if (!call) call = require('node-version-call'); // break dependencies
    return call(version, worker, contents, fileName, config);
};
