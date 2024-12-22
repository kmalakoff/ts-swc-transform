// @ts-ignore
import process from './process.cjs';

const major = +process.versions.node.split('.')[0];
export default major < 14 ? '14' : 'local';
