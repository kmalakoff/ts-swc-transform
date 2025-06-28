import { getTsconfig } from 'get-tsconfig-compat';
import type { TSConfig } from './types.ts';

export default function loadConfigSync(dir: string, name?: string): TSConfig {
  return getTsconfig(dir, name) as TSConfig;
}
