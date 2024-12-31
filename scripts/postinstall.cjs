#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const installModule = require('install-module-linked');
const Queue = require('queue-cb');
const resolve = require('resolve');

function patch(callback) {
  const swcPackagePath = resolve.sync('@swc/core/package.json');
  const swcDir = path.dirname(path.dirname(swcPackagePath));
  const { optionalDependencies } = JSON.parse(fs.readFileSync(swcPackagePath, 'utf8'));
  const depKey = `${process.platform}-${process.arch}`;

  const queue = new Queue();
  Object.keys(optionalDependencies)
    .filter((name) => name.indexOf(depKey) >= 0)
    .map((name) => {
      queue.defer((callback) => {
        const version = optionalDependencies[name];
        const installString = `${name}${version ? `@${version}` : ''}`;
        installModule(installString, path.dirname(swcDir), callback);
      });
    });
  queue.await(callback);
}

// run patch
patch((err) => {
  !err || console.log(err.message);
  process.exit(0);
});
