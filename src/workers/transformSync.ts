import path from 'path';
// @ts-ignore
import lazy from '../lib/lazy.cjs';
// @ts-ignore
import loadSWC from '../lib/loadSWC.js';
const lazyTS = lazy('typescript');
const lazyTranspiler = lazy('ts-node/transpilers/swc');

import type { TsConfigResult } from 'get-tsconfig-compat';
export default function transformSyncWorker(contents: string, fileName: string, tsconfig: TsConfigResult, callback) {
  loadSWC((err, swc) => {
    if (err) return callback(err);
    const ts = lazyTS();
    const transpiler = lazyTranspiler();

    const parsed = ts.parseJsonConfigFileContent(tsconfig.config, ts.sys, path.dirname(tsconfig.path));
    const transpile = transpiler.create({ swc: swc, service: { config: { options: parsed.options } } });
    const res = transpile.transpile(contents, { fileName });
    callback(null, { code: res.outputText, map: res.sourceMapText });
  });
}
