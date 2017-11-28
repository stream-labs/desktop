// Releases the packaged app by uploading artifacts to S3

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const yml = require('js-yaml');
const ProgressBar = require('progress');

function info(msg) {
  console.log(msg);
}

function err(msg) {
  console.log(`Error: ${msg}`);
}

function exitErr() {
  err(`Deploy did not complete successfully.`);
  process.exit();
}

/*****************
 * Configuration *
 *****************/
const distDir = './dist';
const channel = 'latest';
const s3Bucket = 'streamlabs-obs';

info(`Starting release from ${path.resolve(distDir)}`);

/*************************************
 * Discovery of publishing artifacts *
 *************************************/
info(`Discovering publishing artifacts...`);

const channelFileName = `${channel}.yml`;
const channelFilePath = path.join(distDir, channelFileName);

if (!fs.existsSync(channelFilePath)) {
  err(`Could not find ${path.resolve(channelFilePath)}`);
  exitErr();
}

info(`Discovered ${channelFileName}`);

const parsedLatest = yml.safeLoad(fs.readFileSync(channelFilePath));
const installerFileName = parsedLatest.path;
const installerFilePath = path.join(distDir, installerFileName);

if (!fs.existsSync(installerFilePath)) {
  err(`Could not find ${path.resolve(installerFilePath)}`);
  exitErr();
}

info(`Disovered ${installerFileName}`);

/********************
 * Upload artifacts *
 ********************/

info(`Beginning upload of publishing artifacts...`);

// Returns a promise
function uploadFile(name, path) {
  info(`Starting upload of ${name}`);

  const stream = fs.createReadStream(path);

  const upload = new AWS.S3.ManagedUpload({
    params: {
      Bucket: s3Bucket,
      Key: name,
      ACL: 'public-read',
      Body: stream
    },
    queueSize: 1
  });

  const bar = new ProgressBar(name + ' [:bar] :percent :etas', {
    total: 100,
    clear: true
  });

  upload.on('httpUploadProgress', progress => {
    bar.update(progress.loaded / progress.total);
  });

  return upload.promise().catch(data => {
    err(`Upload of ${name} failed`);
    err(data);
    exitErr();
  });
}

uploadFile(installerFileName, installerFilePath).then(data => {
  info(`Finished uploading ${installerFileName}`);

  return uploadFile(channelFileName, channelFilePath);
}).then(data => {
  info(`Finished uploading ${channelFileName}`);
  info(`Deploy completed successully`);
  process.exit();
});
