import type { transformDirectory } from '../../dist/types/index.mjs';

export type testOptions = {
  transformDirectory: typeof transformDirectory;
  type: 'cjs' | 'esm';
  ext: '.js' | '.mjs';
  packageType: 'commonjs' | 'module';
  expectedCount: number;
  options: unknown;
  promise?: boolean;
};
export default function tests(options: testOptions): null;
export const TMP_DIR: string;
export const process: NodeJS.Process;
