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

// Workers receive options after tsconfig has been resolved by the public entry points.
export interface InternalConfigOptions extends ConfigOptions {
  tsconfig: TSConfig;
}

export type TransformDirectoryCallback = (err?: Error | null, filePaths?: string[]) => void;
export type TransformFileCallback = (err?: Error | null, destFilePath?: string) => void;
export type TransformTypesCallback = (err?: Error | null, filePaths?: string[]) => void;

export type Matcher = (filePath: string) => boolean;

export type TargetType = 'cjs' | 'esm';
