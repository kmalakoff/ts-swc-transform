## ts-swc-transform

Typescript transformers for swc. Supports Node >= 0.8.

Promise
```
import { transformDirectory } from 'ts-swc-transform';

await transformDirectory('src', 'dist', 'cjs', { sourceMaps: true });
```

Callback
```
import { transformDirectory } from 'ts-swc-transform';

transformDirectory('src', 'dist', 'esm', { sourceMaps: true }, function (err) {
  if (err) /* handle error */
});
```
