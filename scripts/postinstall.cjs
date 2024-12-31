#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var installModule = require('install-module-linked');
var Queue = require('queue-cb');
var resolve = require('resolve');

function patch(callback) {
  var packagePath = resolve.sync('@swc/core/package.json');
  var nodeModules = path.dirname(path.dirname(path.dirname(packagePath)));
  var optionalDependencies = JSON.parse(fs.readFileSync(packagePath, 'utf8')).optionalDependencies;
  var depKey = process.platform + '-';

  var queue = new Queue();
  Object.keys(optionalDependencies)
    .filter(function (name) {
      return name.indexOf(depKey) >= 0;
    })
    .map(function (name) {
      queue.defer(function (callback) {
        var version = optionalDependencies[name];
        var installString = version ? name + '@' + version : name;
        installModule(installString, nodeModules, function (err) {
          if (err) return callback(err);
          console.log('installed ' + path.join(nodeModules, installString));
          callback();
        });
      });
    });
  queue.await(callback);
}

// run patch
patch(function (err) {
  if (err) {
    console.log('postinstall failed. Error: ' + err.message);
    process.exit(-1);
  } else {
    console.log('postinstall succeeded');
    process.exit(0);
  }
});
