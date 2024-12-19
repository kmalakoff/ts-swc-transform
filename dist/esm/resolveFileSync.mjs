import fs from 'fs';
import path from 'path';
import extensions from './extensions.mjs';
import toPath from './toPath.mjs';
const moduleRegEx = /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/;
const typeFileRegEx = /^[^.]+\.d\.[cm]?ts$/;
const indexExtensions = extensions.map((x)=>`index${x}`);
export default function resolveFileSync(specifier, context) {
    const filePath = toPath(specifier, context);
    const ext = path.extname(filePath);
    let stats;
    try {
        stats = fs.statSync(filePath);
    } catch (_err) {}
    // biome-ignore lint/complexity/useOptionalChain: <explanation>
    if (stats && stats.isDirectory() || specifier.endsWith('/')) {
        const items = fs.readdirSync(filePath);
        const item = items.find((x)=>indexExtensions.indexOf(x) >= 0);
        if (item) return path.join(filePath, item);
    } else if (!stats || !ext && !moduleRegEx.test(specifier)) {
        const fileName = path.basename(filePath).replace(/(\.[^/.]+)+$/, '');
        const items = fs.readdirSync(path.dirname(filePath));
        const item = items.find((x)=>x.startsWith(fileName) && !typeFileRegEx.test(x) && extensions.indexOf(path.extname(x)) >= 0);
        if (item) return path.join(path.dirname(filePath), item);
    }
    // return what was found
    return stats ? filePath : null;
}
