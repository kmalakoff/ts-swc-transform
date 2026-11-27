import a from './a.ts';
import './side.ts';
import comp from './comp.tsx';
import type { D } from './decl.d.ts';
import type { T } from './types.ts';

export const values: string[] = [a, comp()];
export const typed: [D?, T?] = [];
export const lit = "import x from './a.ts'";
// see import('./comment.ts')

export function loadDyn() {
  return import('./dyn.ts');
}

export function load(specifier: string) {
  return import(specifier);
}

export type Dyn = typeof import('./dyn.ts');
