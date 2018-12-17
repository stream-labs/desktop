/* eslint-disable import/no-dynamic-require,global-require */
const fs = require('fs');
const which = require('which');
const path = require('path');
const readPkgUp = require('read-pkg-up')

function resolveBin(modName, { executable = modName, cwd = process.cwd() } = {}) {
  let pathFromWhich;
  try {
    pathFromWhich = fs.realpathSync(which.sync(executable));
  } catch (_error) {
    // ignore _error
  }
  try {
    const modPkgPath = require.resolve(`${modName}/package.json`);
    const modPkgDir = path.dirname(modPkgPath);
    const { bin } = require(modPkgPath);
    const binPath = typeof bin === 'string' ? bin : bin[executable];
    const fullPathToBin = path.join(modPkgDir, binPath);
    if (fullPathToBin === pathFromWhich) {
      return executable;
    }
    return fullPathToBin.replace(cwd, '.');
  } catch (error) {
    if (pathFromWhich) {
      return executable;
    }
    throw error;
  }
}
const { pkg, path: pkgPath } = readPkgUp.sync({
  cwd: fs.realpathSync(process.cwd()),
});
const appDirectory = path.dirname(pkgPath);
const fromRoot = (...p) => path.join(appDirectory, ...p);

function isOptedIn(key, t = true, f = false) {
  if (!fs.existsSync(fromRoot('.opt-in'))) {
    return f;
  }
  const contents = fs.readFileSync(fromRoot('.opt-in'), 'utf-8');
  return contents.includes(key) ? t : f;
}

module.exports = {
  resolveBin,
  isOptedIn,
};
