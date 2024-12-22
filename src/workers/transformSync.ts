import path from 'path';
import type { TsConfigResult } from 'get-tsconfig-compat';
import * as transpiler from 'ts-node/transpilers/swc';
import * as ts from 'typescript';
// @ts-ignore
import loadSWC from '../lib/loadSWC.js';

export default function transformSyncWorker(contents: string, fileName: string, config: TsConfigResult, callback) {
  loadSWC((err, swc) => {
    if (err) return callback(err);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(config.path));
    const transpile = transpiler.create({ swc: swc, service: { config: { options: parsed.options } } });
    const res = transpile.transpile(contents, { fileName });
    callback(null, { code: res.outputText, map: res.sourceMapText });
  });
}
