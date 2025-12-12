// Extracted from https://raw.githubusercontent.com/holepunchto/url-file-url/refs/heads/main/index.js
// Apache 2 License https://github.com/holepunchto/url-file-url/blob/main/LICENSE

import Module from 'module';
import path from 'path';
import url from 'url';

import { stringReplaceAll } from '../compat.ts';

// ESM-compatible require
const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;

// URL class - available natively in Node 7.0+, use core-js-pure for Node 0.8-6.x
// biome-ignore lint/suspicious/noExplicitAny: Feature detection for URL class
let URLClass: typeof URL = (url as any).URL;
if (!URLClass) {
  URLClass = _require('core-js-pure/actual/url/index.js');
}

const isWindows = process.platform === 'win32' || /^(msys|cygwin)$/.test(process.env.OSTYPE);

export function fileURLToPath(urlInput: string | URL): string {
  let parsedUrl: URL;
  if (typeof urlInput === 'string') {
    parsedUrl = new URLClass(urlInput);
  } else {
    parsedUrl = urlInput;
  }

  if (parsedUrl.protocol !== 'file:') {
    throw new Error('The URL must use the file: protocol');
  }

  if (isWindows) {
    if (/%2f|%5c/i.test(parsedUrl.pathname)) {
      throw new Error('The file: URL path must not include encoded \\ or / characters');
    }
  } else {
    if (parsedUrl.hostname) {
      throw new Error("The file: URL host must be 'localhost' or empty");
    }

    if (/%2f/i.test(parsedUrl.pathname)) {
      throw new Error('The file: URL path must not include encoded / characters');
    }
  }

  const pathname = path.normalize(decodeURIComponent(parsedUrl.pathname));

  if (isWindows) {
    if (parsedUrl.hostname) return `\\\\${parsedUrl.hostname}${pathname}`;

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

  resolved = stringReplaceAll(resolved, '%', '%25'); // Must be first
  resolved = stringReplaceAll(resolved, '#', '%23');
  resolved = stringReplaceAll(resolved, '?', '%3f');
  resolved = stringReplaceAll(resolved, '\n', '%0a');
  resolved = stringReplaceAll(resolved, '\r', '%0d');
  resolved = stringReplaceAll(resolved, '\t', '%09');

  if (!isWindows) {
    resolved = stringReplaceAll(resolved, '\\', '%5c');
  }

  return new URLClass(`file:${resolved}`);
}
