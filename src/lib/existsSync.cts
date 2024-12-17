const accessSync = require('fs-access-sync-compat');

module.exports = function existsSync(path) {
  try {
    accessSync(path);
    return true;
  } catch (_) {
    return false;
  }
};
