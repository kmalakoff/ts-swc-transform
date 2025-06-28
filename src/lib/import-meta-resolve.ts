import Module from 'module';

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const resolve = _require('../../../assets/import-meta-resolve.cjs').resolve;

export default function importMetaResolve(specifier: string, url: URL): string {
  return resolve(specifier, url);
}
