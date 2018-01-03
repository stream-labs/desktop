const sh = require('shelljs');
const colors = require('colors/safe');

/**
 * Shared functions for release scripts
 */

export function info(msg) {
  sh.echo(colors.magenta(msg));
}

export function warn(msg) {
  sh.echo(colors.red(`WARNING: ${msg}`));
}

export function error(msg) {
  sh.echo(colors.red(`ERROR: ${msg}`));
}

export function executeCmd(cmd) {
  const result = sh.exec(cmd);

  if (result.code !== 0) {
    error(`Command Failed >>> ${cmd}`);
    sh.exit(1);
  }
}
