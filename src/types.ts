export interface Context {
  parentURL?: string;
  parentPath?: string;
}

export interface TransformResult {
  from: string;
  to: string;
}

export interface TransformDirectoryOptions {
  cacheDirectory?: string;
}
export type TransformDirectoryCallback = (err?: Error, filePaths?: TransformResult[]) => void;

export interface TransformFileOptions {
  cacheDirectory?: string;
}
export type TransformFileCallback = (err?: Error, destFilePath?: string) => void;

export interface TransformTypesOptions {
  cacheDirectory?: string;
}
export type TransformTypesCallback = (err?: Error, filePaths?: TransformResult[]) => void;
