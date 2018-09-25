const aws = require('aws-sdk');

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

  return args_valid;
}

async function main()
{
  const args = require('minimist')(process.argv.splice(2), {
    default: {
      'version-file': 'latest',
      's3-bucket': 'streamlabs-obs-dev'
    }
  });

  const bucket = args['s3-bucket'];
  const version = args['version'];

  if (!validate_args(args))
    return;

  const aws_credentials = new aws.Credentials(
    args['access-key'],
    args['secret-access-key']
  );

  const s3_options = {
    credentials: aws_credentials
  };

  const s3_client = new aws.S3(s3_options);

  const version_file_params = {
    Bucket: bucket,
    Key: `${args['version-file']}.json`,
    ACL: 'public-read',
    Body: JSON.stringify({ version })
  };

  return s3_client.upload(version_file_params).promise();
}

main().then(() => {});