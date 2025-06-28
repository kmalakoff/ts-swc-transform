import type * as TSConfigSchema from './TSConfigSchema.ts';

export interface Context {
  parentURL?: string;
  parentPath?: string;
}

export * as TSConfigSchema from './TSConfigSchema.ts';
export interface TSConfig {
  path: string;
  config: TSConfigSchema.TSConfigData;
}

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
