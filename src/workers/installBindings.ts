import fs from 'fs';
import path from 'path';
import installModule from 'install-module-linked';
import Queue from 'queue-cb';
import resolve from 'resolve';
import resolveOnce from 'resolve-once-cb';

export default resolveOnce(function installBindings(callback) {
  const packagePath = resolve.sync('@swc/core/package.json');
  const nodeModules = path.dirname(path.dirname(path.dirname(packagePath)));
  const optionalDependencies = JSON.parse(fs.readFileSync(packagePath, 'utf8')).optionalDependencies;
  const depKey = `${process.platform}-`;

  const queue = new Queue();
  Object.keys(optionalDependencies)
    .filter((name) => name.indexOf(depKey) >= 0)
    .map((name) => {
      queue.defer((callback) => {
        const version = optionalDependencies[name];
        const installString = version ? `${name}@${version}` : name;
        installModule(installString, nodeModules, (err) => {
          if (err) return callback(err);
          console.log(`installed ${path.join(nodeModules, name)}`);
          callback();
        });
      });
    });
  queue.await(callback);
});
