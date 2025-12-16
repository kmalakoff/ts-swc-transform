/**
 * Compatibility Layer for Node.js 0.8+
 * Local to this package - contains only needed functions.
 */

/**
 * String.prototype.startsWith wrapper for Node.js 0.8+
 * - Uses native startsWith on Node 4.0+ / ES2015+
 * - Falls back to indexOf on Node 0.8-3.x
 */
const hasStartsWith = typeof String.prototype.startsWith === 'function';

export function stringStartsWith(str: string, search: string, position?: number): boolean {
  if (hasStartsWith) {
    return str.startsWith(search, position);
  }
  position = position || 0;
  return str.indexOf(search, position) === position;
}

/**
 * String.prototype.endsWith wrapper for Node.js 0.8+
 * - Uses native endsWith on Node 4.0+ / ES2015+
 * - Falls back to lastIndexOf on Node 0.8-3.x
 */
const hasEndsWith = typeof String.prototype.endsWith === 'function';

export function stringEndsWith(str: string, search: string, position?: number): boolean {
  if (hasEndsWith) {
    return str.endsWith(search, position);
  }
  const len = position === undefined ? str.length : position;
  return str.lastIndexOf(search) === len - search.length;
}

/**
 * String.prototype.replaceAll wrapper for Node.js 0.8+
 * - Uses native replaceAll on Node 15.0+ / ES2021+
 * - Falls back to regex replace on older versions
 */
// biome-ignore lint/suspicious/noExplicitAny: Feature detection for ES2021 replaceAll
const hasReplaceAll = typeof (String.prototype as any).replaceAll === 'function';

export function stringReplaceAll(str: string, search: string, replace: string): string {
  if (hasReplaceAll) {
    // biome-ignore lint/suspicious/noExplicitAny: Using native replaceAll when available
    return (str as any).replaceAll(search, replace);
  }
  // Escape special regex characters
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return str.replace(new RegExp(escaped, 'g'), replace);
}

/**
 * Array.prototype.find wrapper for Node.js 0.8+
 * - Uses native find on Node 4.0+ / ES2015+
 * - Falls back to loop on Node 0.8-3.x
 */
const hasArrayFind = typeof Array.prototype.find === 'function';

export function arrayFind<T>(arr: T[], predicate: (item: T, index: number, arr: T[]) => boolean): T | undefined {
  if (hasArrayFind) {
    return arr.find(predicate);
  }
  for (let i = 0; i < arr.length; i++) {
    if (predicate(arr[i], i, arr)) return arr[i];
  }
  return undefined;
}
