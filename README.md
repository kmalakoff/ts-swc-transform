# ts-swc-transform

TypeScript transformers for SWC. Supports Node.js 0.8 and newer.

## Install

```bash
npm install ts-swc-transform
```

## Promise

```js
import { transformDirectory } from 'ts-swc-transform';

const files = await transformDirectory('src', 'dist', 'esm', { sourceMaps: true });
console.log(`Wrote ${files.length} files`);
```

## Callback

```js
var transformDirectory = require('ts-swc-transform').transformDirectory;

transformDirectory('src', 'dist', 'cjs', { sourceMaps: true }, function (err, files) {
  if (err) throw err;
  console.log('Wrote ' + files.length + ' files');
});
```

The target must be `cjs` or `esm`. The package also exports lower-level
single-file, declaration, path-resolution, and matching helpers; see the
[API documentation](https://kmalakoff.github.io/ts-swc-transform/) for their
signatures.
