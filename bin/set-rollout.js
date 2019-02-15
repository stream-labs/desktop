const inq = require('inquirer');
const colors = require('colors/safe');
const sh = require('shelljs');
const https = require('https');
const cp = require('child_process');
const path = require('path');

function info(msg) {
  sh.echo(colors.magenta(msg));
}

function important(msg) {
  sh.echo(colors.cyan(msg));
}

function setRollout(version, rollout, bucket) {
  const proc = cp.fork(
    path.resolve(__dirname, 'aws-wrapper.js'),
    [
      path.resolve(__dirname, 'set-chance.js'),
      '--s3-bucket', bucket,
      '--version', version,
      '--chance', rollout
    ]
  );
  return new Promise((resolve, reject) => {
    proc.on('exit', code => {
      code ? reject() : resolve();
    });
  });
}

(async () => {
  info('|-------------------------------------------|');
  info('| Streamlabs OBS Interactive Rollout Script |');
  info('|-------------------------------------------|');

  const channel = (await inq.prompt({
    type: 'list',
    name: 'channel',
    message: 'Which channel would you like to modify?',
    choices: [
      {
        name: 'preview',
        value: 'preview'
      },
      {
        name: 'live',
        value: 'latest'
      }
    ]
  })).channel;

  const version = await new Promise((resolve, reject) => {
    https.get(`https://slobs-cdn.streamlabs.com/${channel}.json`, res => {
      res.on('data', body => {
        resolve(JSON.parse(body).version);
      });
    });
  });

  important(`The latest version is ${version}`);

  const rollout = await new Promise((resolve, reject) => {
    https.get(`https://slobs-cdn.streamlabs.com/${version}.chance`, res => {
      res.on('data', body => {
        resolve(JSON.parse(body).chance);
      });
    });
  });

  important(`${version} is at ${rollout}% rollout`);
  info('Rollout can be raised or lowered.');
  info('Lowering rollout to 0 will stop propagation of the update');

  const newRollout = (await inq.prompt({
    type: 'input',
    name: 'newRollout',
    message: `Please enter the new rollout percentage (0 - 100)`,
    filter: ans => parseInt(ans, 10)
  })).newRollout;

  info(`Setting ${newRollout}% rollout for version ${version}...`);

  try {
    await setRollout(version, newRollout, 'streamlabs-obs');
    await setRollout(version, newRollout, 'slobs-cdn.streamlabs.com');
  } catch (e) {
    info('Failed to set rollout');
    sh.exit(1);
  }

  info(`${version} is now at ${newRollout}% rollout!`);

})().then(() => {
  sh.exit(0);
});
