const aws = require('aws-sdk');

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
  argRequired('s3-bucket');
  argRequired('version-file');

  return argsValid;
}

async function main() {
  const args = require('minimist')(process.argv.splice(2));

  if (!validateArgs(args)) return;

  const bucket = args['s3-bucket'];
  const version = args['version'];

  const awsCredentials =
      new aws.Credentials(args['access-key'], args['secret-access-key']);

  const s3Options = {credentials : awsCredentials};

  const s3Client = new aws.S3(s3Options);

  const versionFileParams = {
    Bucket : bucket,
    Key : `${args['version-file']}.json`,
    ACL : 'public-read',
    Body : JSON.stringify({version})
  };

  return s3Client.upload(versionFileParams).promise();
}

main().then((code) => {
  if (code) code = 0;

  process.exit(0);
}).catch((error) => {
  console.log(error);
  process.exit(-256);
});