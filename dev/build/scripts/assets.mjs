#!/usr/bin/env node

import path from 'path';
import url from 'url';
import spawn from 'cross-spawn-cb';
import resolve from 'resolve';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const cwd = process.cwd();
const src = resolve.sync('import-meta-resolve');
const dest = path.join(__dirname, '..', '..', '..', 'assets', 'import-meta-resolve.cjs');

import fs from 'fs';
const REPLACEMENTS = []
function patch(callback) {
  try {
    const pre = fs.readFileSync(path.join(__dirname, '..', 'assets', 'pre.js'), 'utf8');
    const post = fs.readFileSync(path.join(__dirname, '..', 'assets', 'post.js'), 'utf8');
    let content = fs.readFileSync(dest, 'utf8');
    content = REPLACEMENTS.reduce((m, r) => m.replace(new RegExp(r.from, 'g'), r.to), content)
    fs.writeFileSync(dest, pre + content + post, 'utf8');
    callback();
  } catch (err) {
    callback(err);
  }
}

function build(callback) {
  const config = path.join(__dirname, 'rollup.config.mjs');
  const args = ['rollup', '--config', config, '--input', src, '--file', dest];
  spawn(args[0], args.slice(1), { cwd: cwd, stdio: 'inherit' }, (err) => err ? callback(err) : patch(callback));
}

build((err) => {
  !err || console.error(err);
});