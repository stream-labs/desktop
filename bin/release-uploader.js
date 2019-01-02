const fs = require('fs');
const os = require('os');
const path = require('path');
const slash = require('slash');
const flCompress = require('./compressor');
const flGen = require('./generator');
const aws = require('aws-sdk');
const pmap = require('p-map');
const util = require('util');

const stat = util.promisify(fs.stat);
const rmdir = util.promisify(fs.rmdir);
const unlink = util.promisify(fs.unlink);
const readdir = util.promisify(fs.readdir);

async function traverseDirectory(directory, callback) {
  const files = await readdir(directory);

  for (const file of files) {
    const filepath = path.resolve(directory, file);

    const stats = await stat(filepath);

    if (stats.isDirectory()) {
      await traverseDirectory(filepath, callback);
    }

    await callback(filepath, stats);
  }
}

async function s3BucketExists(client, Bucket) {
  const headArgs = {Bucket};

  try {
    await client.headBucket(headArgs).promise();
  } catch (error) {
    return false;
  }

  return true;
}

async function s3DirExists(client, Bucket, dir) {
  const getArgs = {Bucket, Key : `${dir}/`};

  try {
    await client.getObject(getArgs).promise();
  } catch (error) {
    return false;
  }

  return true;
}

async function s3DirCreate(client, Bucket, dir) {
  const putArgs = {Bucket, Key : `${dir}/`};

  try {
    await client.putObject(putArgs).promise();
  } catch (error) {
    return false;
  }

  return true;
}

async function s3UploadFiles(client, Bucket, s3Dir, baseDir, fileList) {
  const fileListKeys = Object.keys(fileList);

  return pmap(fileListKeys, (file) => {
    const filepath = path.resolve(baseDir, `${file}.gz`);
    const Key = `${s3Dir}/${slash(file)}.gz`;
    const stream = fs.createReadStream(filepath);

    const params = {Bucket, Key, ACL : 'public-read', Body : stream};

    const streamPromise = new Promise((resolve, reject) => {
      stream.on('close', () => { resolve(); });
      stream.on('error', (error) => { reject(error); });
    });

    console.log(`uploading ${file}`);
    return Promise.all([ client.upload(params).promise(), streamPromise ]);
  }, {concurrency : 10});
}

function validateArgs(args) {
  let argsValid = true;

  const argRequired = key => {
    if (!args[key]) {
      console.log(`${key} required`);
      argsValid = false;
    }
  };

  argRequired('access-key');
  argRequired('secret-access-key');
  argRequired('version');
  argRequired('release-dir');

  if (!args['tmp-dir']) {
    args['tmp-dir'] = path.join(os.tmpdir(), 'slobs-release', args['version']);
  }

  return argsValid;
}

async function main() {
  const cwd = path.resolve();
  const args = require('minimist')(
      process.argv.splice(2), {default : {'s3-bucket' : 'streamlabs-obs-dev'}});

  if (!validateArgs(args))
    return -1;

  const bucket = args['s3-bucket'];
  const version = args['version'];
  const releaseDir = path.resolve(cwd, args['release-dir']);
  const tmpDir = path.resolve(cwd, args['tmp-dir']);

  const awsCredentials =
      new aws.Credentials(args['access-key'], args['secret-access-key']);

  const s3Options = {credentials : awsCredentials};

  const s3Client = new aws.S3(s3Options);

  /* TODO If the bucket doesn't exist, we should allow creating it. */
  if (!(await s3BucketExists(s3Client, bucket))) {
    console.log(`${bucket} doesn't exist`);
    return -2;
  }

  if (await s3DirExists(s3Client, bucket, version)) {
    console.log(`${version} already exists`);
    return -3;
  }

  /* Make sure we can actually write to the bucket by creating the "folder" we
   * want. */
  console.log(`creating S3 key ${version}`);
  if (!(await s3DirCreate(s3Client, bucket, version))) {
    console.log(`failed to create S3 folder object`);
    return -4;
  }

  /* Generate a file list describing our release directory */
  let releaseList = {};

  console.log(`generating file list...`);

  await flGen(
    releaseDir,
    'sha256',
    (key, value) => (releaseList[key] = value)
  );

  console.log(`compressing files...`);
  await flCompress(releaseDir, tmpDir, releaseList, {});

  console.log(`uploading files...`);
  await s3UploadFiles(s3Client, bucket, version, tmpDir, releaseList);

  /* Upload the filelist itself to the bucket */
  console.log(`uploading manifest...`);

  let manifest = '';

  for (const key in releaseList) {
    manifest += `${releaseList[key]} ${key}\n`;
  }

  const releaseListParams = {
    Bucket : bucket,
    Key : `${version}.sha256`,
    ACL : 'public-read',
    Body : manifest
  };

  await s3Client.upload(releaseListParams).promise();

  await traverseDirectory(tmpDir, async (path, stats) => {
    if (stats.isDirectory()) {
      return rmdir(path);
    } else {
      return unlink(path);
    }
  });

  await rmdir(tmpDir);
  return 0;
}

main().then((code) => {
  if (!code) {
    process.exit(0);
  }

  process.exit(code);
}).catch((error) => {
  console.log(error);
  process.exit(-256);
});
