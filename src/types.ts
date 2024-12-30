export interface Context {
  parentURL?: string;
  parentPath?: string;
}

export interface TransformResult {
  from: string;
  to: string;
}
import type { TsConfigResult } from 'get-tsconfig-compat';
export interface ConfigOptions {
  tsconfig?: TsConfigResult;
  cwd?: string;
}

export type TransformDirectoryCallback = (err?: Error, filePaths?: TransformResult[]) => void;
export type TransformFileCallback = (err?: Error, destFilePath?: string) => void;
export type TransformTypesCallback = (err?: Error, filePaths?: TransformResult[]) => void;
