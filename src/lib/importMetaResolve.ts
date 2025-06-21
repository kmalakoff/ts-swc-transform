import Module from 'module';

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const resolve = _require('../../../assets/importMetaResolve.cjs').resolve;

export default function importMetaResolve(specifier: string, url: URL): string {
  return resolve(specifier, url);
}
