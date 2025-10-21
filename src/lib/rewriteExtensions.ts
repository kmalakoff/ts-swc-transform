export const extensions = {
  '.ts': '.js',
  '.tsx': '.js',
  '.mts': '.mjs',
  '.cts': '.cjs',
};

export function replaceExtension(ext: string): string {
  const replace = extensions[ext];
  return replace === undefined ? ext : replace;
}

// Pure regex solution for rewriting TypeScript extensions to JavaScript
// Pattern: quote + relative path (starts with .) + TS extension + matching quote
const extensionPattern = /(['"`])(\.[-\w./]*?)\.(tsx?|mts|cts)\1/g;

export function rewriteExtensions(content: string): string {
  return content.replace(extensionPattern, (_match, quote, path, ext) => {
    const newExt = extensions[`.${ext}`];
    return `${quote}${path}${newExt}${quote}`;
  });
}
