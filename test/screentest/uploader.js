require('dotenv').config();






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

async function s3DirCreate(client, Bucket, dir) {
  const putArgs = {Bucket, Key : `${dir}/`};

  try {
    await client.putObject(putArgs).promise();
  } catch (error) {
    return false;
  }

  return true;
}
