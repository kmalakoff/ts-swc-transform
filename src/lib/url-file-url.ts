// Extracted from https://raw.githubusercontent.com/holepunchto/url-file-url/refs/heads/main/index.js
// Apache 2 License https://github.com/holepunchto/url-file-url/blob/main/LICENSE

import path from 'path';
import replaceAll from 'core-js-pure/actual/string/replace-all.js';
import URL from 'core-js-pure/actual/url/index.js';
const isWindows = process.platform === 'win32' || /^(msys|cygwin)$/.test(process.env.OSTYPE);

export function fileURLToPath(url: string | URL): string {
  if (typeof url === 'string') {
    url = new URL(url);
  }

  if (url.protocol !== 'file:') {
    throw new Error('The URL must use the file: protocol');
  }

  if (isWindows) {
    if (/%2f|%5c/i.test(url.pathname)) {
      throw new Error('The file: URL path must not include encoded \\ or / characters');
    }
  } else {
    if (url.hostname) {
      throw new Error("The file: URL host must be 'localhost' or empty");
    }

    if (/%2f/i.test(url.pathname)) {
      throw new Error('The file: URL path must not include encoded / characters');
    }
  }

  const pathname = path.normalize(decodeURIComponent(url.pathname));

  if (isWindows) {
    if (url.hostname) return `\\\\${url.hostname}${pathname}`;

    const letter = pathname.charCodeAt(1) | 0x20;

    if (letter < 0x61 /* a */ || letter > 0x7a /* z */ || pathname.charCodeAt(2) !== 0x3a /* : */) {
      throw new Error('The file: URL path must be absolute');
    }

    return pathname.slice(1);
  }

  return pathname;
}

export function pathToFileURL(pathname: string): URL {
  let resolved = path.resolve(pathname);

  if (pathname[pathname.length - 1] === '/') {
    resolved += '/';
  } else if (isWindows && pathname[pathname.length - 1] === '\\') {
    resolved += '\\';
  }

  resolved = replaceAll(resolved, '%', '%25'); // Must be first
  resolved = replaceAll(resolved, '#', '%23');
  resolved = replaceAll(resolved, '?', '%3f');
  resolved = replaceAll(resolved, '\n', '%0a');
  resolved = replaceAll(resolved, '\r', '%0d');
  resolved = replaceAll(resolved, '\t', '%09');

  if (!isWindows) {
    resolved = replaceAll(resolved, '\\', '%5c');
  }

  return new URL(`file:${resolved}`);
}
