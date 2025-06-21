import Module from 'module';

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const path = '../../../assets/importMetaResolve.cjs';
export default _require(path).resolve;
