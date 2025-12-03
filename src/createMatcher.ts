import path from 'path';
import match from 'test-match';
import type { Matcher, TSConfig } from './types.ts';

export default function createMatcher(tsconfig: TSConfig): Matcher {
  const include = (tsconfig.config.include || []) as string[];
  const exclude = (tsconfig.config.exclude || []) as string[];
  return match({ cwd: path.dirname(tsconfig.path), include, exclude });
}
