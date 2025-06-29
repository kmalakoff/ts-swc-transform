import type { Output } from '@swc/core';
import Module from 'module';
import path from 'path';
import prepareSWCOptions from '../lib/prepareSWCOptions.ts';
import type { TSConfig } from '../types.ts';

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;

export default function transformSyncWorker(contents: string, fileName: string, tsconfig: TSConfig): Output {
  const swcOptions = prepareSWCOptions(tsconfig);
  const swc = _require('@swc/core');
  const ext = path.extname(fileName);

  return swc.transformSync(contents, {
    ...(ext === '.tsx' || ext === '.jsx' ? swcOptions.tsxOptions : swcOptions.nonTsxOptions),
    filename: fileName,
  });
}
