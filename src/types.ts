export interface Context {
  parentURL?: string;
  parentPath?: string;
}

import type { TsConfigResult } from 'get-tsconfig-compat';

export interface ConfigOptions {
  tsconfig?: TsConfigResult;
  cwd?: string;
  sourceMaps?: boolean;
}

export type TransformDirectoryCallback = (err?: Error, filePaths?: string[]) => void;
export type TransformFileCallback = (err?: Error, destFilePath?: string) => void;
export type TransformTypesCallback = (err?: Error, filePaths?: string[]) => void;

export type Matcher = (filePath: string) => boolean;

export type TargetType = 'cjs' | 'esm';
