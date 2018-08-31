const fs = require('fs');
const path = require('path');
const slash = require('slash');
const fl_compress = require('./compressor');
const fl_gen = require('./generator');
const aws = require('aws-sdk');
const pmap = require('p-map');
const util = require('util');

const stat = util.promisify(fs.stat);
const rmdir = util.promisify(fs.rmdir);
const unlink = util.promisify(fs.unlink);
const readdir = util.promisify(fs.readdir);

async function traverse_directory(directory, callback) {
  const files = await readdir(directory);

  for (for file of files) {
    const filepath = path.resolve(directory, file);
    console.log(filepath);

    const stats = await stat(filepath);

    if (stats.isDirectory()) {
      await traverse_directory(filepath, callback);
    }

    await callback(filepath, stats);
  }
}

async function s3_bucket_exists(client, Bucket) {
  const head_args = {
    Bucket
  };

  try {
    await client.headBucket(head_args).promise();
  } catch (error) {
    return false;
  }

  return true;
}

async function s3_dir_exists(client, Bucket, dir) {
  const get_args = {
    Bucket,
    Key: `${dir}/`
  };

  try {
    await client.getObject(get_args).promise();
  } catch (error) {
    return false;
  }

  return true;
}

async function s3_dir_create(client, Bucket, dir) {
  const put_args = {
    Bucket,
    Key: `${dir}/`
  };

  try {
    await client.putObject(put_args).promise();
  } catch (error) {
    return false;
  }

  return true;
}

async function s3_upload_files(client, Bucket, s3_dir, base_dir, file_list) {
  const file_list_keys = Object.keys(file_list);

  return pmap(file_list_keys, (file) => {
    const filepath = path.resolve(base_dir, `${file}.gz`);
    const Key = `${s3_dir}/${slash(file)}.gz`;
    const stream = fs.createReadStream(filepath);

    const params = {
      Bucket,
      Key,
      ACL: 'public-read',
      Body: stream
    };

    const stream_promise = new Promise((resolve, reject) => {
      stream.on('close', () =>  { resolve(); })
      stream.on('error', (error) => { reject(error); });
    });

    console.log(`uploading ${file}`);
    return Promise.all([
      client.upload(params).promise(),
      stream_promise
    ]);

  }, { concurrency: 10 });
}

function validate_args(args) {
  let args_valid = true;

  const arg_required = key => {
    if (!args[key]) {
      console.log(`${key} required`);
      args_valid = false;
    }
  };

  arg_required('access-key');
  arg_required('secret-access-key');
  arg_required('version');
  arg_required('release-dir');
  arg_required('tmp-dir');

  return args_valid;
}

async function main() {
  const cwd = path.resolve();
  const args = require('minimist')(process.argv.splice(2), {
    default: {
      's3-bucket': 'streamlabs-obs-dev'
    }
  });

  if (!validate_args(args))
    return;

  const bucket = args['s3-bucket'];
  const version = args['version'];
  const release_dir = path.resolve(cwd, args['release-dir']);
  const tmp_dir = path.resolve(cwd, args['tmp-dir']);

  const aws_credentials = new aws.Credentials(
    args['access-key'],
    args['secret-access-key']
  );

  const s3_options = {
    credentials: aws_credentials
  };

  const s3_client = new aws.S3(s3_options);

  /* TODO If the bucket doesn't exist, we should allow creating it. */
  if (!(await s3_bucket_exists(s3_client, bucket))) {
    console.log(`${bucket} doesn't exist`);
    return;
  }

  if (await s3_dir_exists(s3_client, bucket, version)) {
    console.log(`${version} already exists`);
    return;
  }

  /* Make sure we can actually write to the bucket by creating the "folder" we want. */
  console.log(`creating S3 key ${version}`);
  if (!(await s3_dir_create(s3_client, bucket, version))) {
    console.log(`failed to create S3 folder object`);
    return;
  }

  /* Generate a file list describing our release directory */
  let release_list = {};

  console.log(`generating file list...`);
  await fl_gen(
    release_dir,
    { hashAlgo: 'sha256' },
    (key, value) => (release_list[key] = value)
  );

  console.log(`compressing files...`);
  await fl_compress(release_dir, tmp_dir, release_list, {});

  console.log(`uploading files...`);
  await s3_upload_files(s3_client, bucket, version, tmp_dir, release_list);

  /* Upload the filelist itself to the bucket */
  console.log(`uploading manifest...`);

  let manifest_string = '';

  for (const key in release_list) {
    manifest_string += `${release_list[key]} ${key}\n`;
  }

  const release_list_params = {
    Bucket: bucket,
    Key: `${version}.sha256`,
    ACL: 'public-read',
    Body: manifest_string
  };

  await s3_client.upload(release_list_params).promise();

  await traverse_directory(tmp_dir, async (path, stats) => {
    if (stats.isDirectory()) {
      return rmdir(path);
    } else {
      return unlink(path);
    }
  });
}

main().then(() => { });
