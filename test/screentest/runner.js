const { execSync, spawnSync } = require('child_process');
const fs = require('fs');



(function main() {

  log('tests compilation');

  try {
    execSync('yarn compile-tests')
  } catch (e) {
    err('compilation failed', e);
    return;
  }

  log('creating screenshots');
  try {
    execSync('yarn ava test-dist/test/screentest/tests/*.js');
  } catch (e) {
    err('creating screenshots failed');
    return;
  }






})();


function log(...args) {
  console.log(...args);
}

function err(...args) {
  console.error(...args);
}

function setupConfig(config) {
  const dir = 'test-dist/screenshots';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(`${dir}/config.json`);
}


