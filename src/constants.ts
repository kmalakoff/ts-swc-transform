export const moduleRegEx = /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/;
export const typeFileRegEx = /^[^.]+\.d\.[cm]?ts$/;

export const moduleDependencyRegEx = '\\s*[\'"`]([^\'"`]+)[\'"`]\\s*';
export const moduleNameRegEx = '\\s*(?:[\\w${},\\s*]+)\\s*';
export const requireRegEx = new RegExp(`(?:(?:var|const|let)${moduleNameRegEx}=\\s*)?require\\(${moduleDependencyRegEx}\\)?`, 'g');
export const importRegEx = new RegExp(`${requireRegEx}|import(?:${moduleNameRegEx}from\\s*)?${moduleDependencyRegEx};?|export(?:${moduleNameRegEx}from\\s*)?${moduleDependencyRegEx}?`, 'g');
export const extensions = ['.js', '.jsx', '.cjs', '.mjs', '.ts', '.tsx', '.cts', '.mts', '.es6', '.es'];
