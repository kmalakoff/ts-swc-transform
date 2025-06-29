import type { TSConfig } from 'read-tsconfig-sync';

export interface Context {
  parentURL?: string;
  parentPath?: string;
}

export type { TSConfig, TSConfigSchema } from 'read-tsconfig-sync';
export interface ConfigOptions {
  tsconfig?: TSConfig;
  cwd?: string;
  sourceMaps?: boolean;
}

export type TransformDirectoryCallback = (err?: Error, filePaths?: string[]) => void;
export type TransformFileCallback = (err?: Error, destFilePath?: string) => void;
export type TransformTypesCallback = (err?: Error, filePaths?: string[]) => void;

export type Matcher = (filePath: string) => boolean;

export type TargetType = 'cjs' | 'esm';
