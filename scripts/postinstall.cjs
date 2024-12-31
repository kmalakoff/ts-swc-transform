#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var installModule = require('install-module-linked');
var Queue = require('queue-cb');
var resolve = require('resolve');

function patch(callback) {
  var swcPackagePath = resolve.sync('@swc/core/package.json');
  var swcDir = path.dirname(path.dirname(swcPackagePath));
  var optionalDependencies = JSON.parse(fs.readFileSync(swcPackagePath, 'utf8')).optionalDependencies;
  var depKey = process.platform + "-" + process.arch;

  var queue = new Queue();
  Object.keys(optionalDependencies)
    .filter(function (name) { return name.indexOf(depKey) >= 0 })
    .map(function (name) {
      queue.defer(function (callback) {
        var version = optionalDependencies[name];
        var installString = version ? name + "@" + version : name;
        installModule(installString, path.dirname(swcDir), callback);
      });
    });
  queue.await(callback);
}

// run patch
patch(function (err) {
  if (err) {
    console.log("postinstall failed. Error: " + err.message)
    process.exit(-1);
  } else {
    console.log("postinstall succeeded")
    process.exit(0);
  }
});
