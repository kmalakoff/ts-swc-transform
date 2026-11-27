export function templateImport() {
  return import(`./a.ts`);
}

export function requireLiteral() {
  return require('./a.ts');
}
