const sh = require('shelljs');
const colors = require('colors/safe');
const AWS = require('aws-sdk');
const fs = require('fs');
const os = require('os');
const AmazonS3URI = require('amazon-s3-uri');
const path = require('path');

const node_modules = path.join(process.cwd(), 'node_modules');

const s3Client = new AWS.S3();

function log_info(msg) {
    sh.echo(colors.magenta(msg));
  }
  
function log_error(msg) {
    sh.echo(colors.red(`ERROR: ${msg}`));
}

function executeCmd(cmd, options) {
  // Default is to exit on failure
  if (options.exit == null) options.exit = true;

  const result = options.silent ? sh.exec(cmd, { silent: true }) : sh.exec(cmd);

  if (result.code !== 0) {
    error(`Command Failed >>> ${cmd}`);
    if (options.exit) {
      sh.exit(1);
    } else {
      throw new Error(`Failed to execute command: ${cmd}`);
    }
  }

  return result.stdout;
}

async function downloadBinaries(bucket, fileName, attempt = 60, waitMs = 60000) {
  try {
    const data = await s3Client.getObject({ Bucket: bucket, Key: fileName }).promise().catch( (error) => { throw error });
    if (data) {
      fs.writeFileSync(path.join(node_modules, fileName), data.Body);
      log_info ('Installing ' + fileName);
      executeCmd('tar -xzvf ' + fileName, { silent: true });
      sh.rm(fileName);
    }
  } catch (e) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, waitMs));
      await downloadBinaries(bucket, fileName, --attempt).catch(() => console.log('failed'));
    } else {
      log_error('Error while downloading');
      throw e;
    }
  }
}

async function runScript() {
  colors.blue('----Streamlabs OBS native dependecies installation----');

  try {
    const jsonData = fs.readFileSync('./scripts/repositories.json')
    const root = JSON.parse(jsonData.toString());
    const dependecies = root.root;
    let os = '';

    if (process.platform === 'win32')
      os = 'win64';
    else if (process.platform === 'darwin')
      os = 'osx';
    else
      throw 'Platform not supported.';

    sh.cd(node_modules);

    const promises = dependecies.filter(dependancy => dependancy[os])
      .map(async dependancy => {
        const { bucket } = AmazonS3URI(dependancy['url']);

        let fileName = dependancy['archive'];
        fileName = fileName.replace('[VERSION]', dependancy['version']);
        fileName = fileName.replace('[OS]', os);
        
        await downloadBinaries(bucket, fileName).catch((error) => {
          log_error(error);
          throw 'Installation failed for ' + dependancy['name'];
        });
      });
      await Promise.all(promises);
  } catch (error) {
    log_error('An error occured preventing the script from installing successfully all required native dependencies.')
    log_error(error);
    sh.exit(1);
  }
}

runScript().then(() => {
  sh.exit(0);
});