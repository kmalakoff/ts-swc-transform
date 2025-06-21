import * as getTS from 'get-tsconfig-compat';
import type { ConfigOptions } from './types.ts';

export default function loadTsConfig(options: ConfigOptions, name: string): getTS.TsConfigResult {
  let tsconfig = options.tsconfig;
  if (!tsconfig) tsconfig = getTS.getTsconfig(options.cwd || process.cwd());

  if (typeof tsconfig !== 'object') throw new Error(`${name}: missing valid tsconfig`);
  if (tsconfig.path === undefined) throw new Error(`${name}: expecting tsconfig.path`);
  if (tsconfig.config === undefined) throw new Error(`${name}: expecting tsconfig.config`);
  return tsconfig;
}
