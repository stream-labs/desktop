const aws = require('aws-sdk');

function validate_args(args) {
  let args_valid = true;

  const arg_required = (key, cb) => {
    const value = args[key];
    if (!value) {
      console.log(`${key} required`);
      args_valid = false;
      return;
    }

    if (cb && typeof(cb) === 'function') {
      cb(args[key]);
    }
  };

  arg_required('access-key');
  arg_required('secret-access-key');
  arg_required('version');

  arg_required('chance', (value) => {
    if (value >= 1 && value <= 100) return;

    console.log(`Chance value ${chance} expected to be a value from 1 to 100`);
    args_valid = false;
  });

  return args_valid;
}

async function main()
{
  const args = require('minimist')(process.argv.splice(2), {
    default: {
      's3-bucket': 'streamlabs-obs-dev'
    }
  });

  const bucket = args['s3-bucket'];
  const version = args['version'];
  const chance = args['chance'];

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
    Key: `${version}.chance`,
    ACL: 'public-read',
    Body: JSON.stringify({ chance })
  };

  return s3_client.upload(version_file_params).promise();
}

main().then(() => {
  process.exit(0);
}).catch((error) => {
  console.log(error);
  process.exit(1);
});