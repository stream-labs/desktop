const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');
const mime = require('mime');
const recursiveReadDir = require('recursive-readdir');

/**
 * A aws-sdk wrapper for uploading folders and files to AWS
 */
class AwsUploader {

  constructor(awsAccessKey, awsSecretKey, awsBucket) {
    this.awsAccessKey = awsAccessKey;
    this.awsSecretKey = awsSecretKey;
    this.awsBucket = awsBucket;
    const awsCredentials = new AWS.Credentials(this.awsAccessKey, this.awsSecretKey);
    const s3Options = { credentials: awsCredentials };
    this.s3Client = new AWS.S3(s3Options);
    this.baseUrl = `http://${awsBucket}.s3.amazonaws.com`;
  }

  /**
   * @returns {Promise<{baseUrl: string, files: string[]}>}
   */
  async uploadDir(dirPath, bucketPath) {
    const uploadedFilesUrls = [];
    try {
      const files = await recursiveReadDir(dirPath);
      for (const filePath of files) {
        console.info(`uploading ${filePath}`);
        const relativePath = path.relative(dirPath, filePath).replace('\\', '/');
        const bucketPath = `${bucketPath}/${relativePath}`;
        uploadedFilesUrls.push(await this.uploadFile(filePath, bucketPath))
      }
      console.info('file uploaded to', this.baseUrl);
      return { baseUrl: this.baseUrl, files: uploadedFilesUrls };

    }
    catch (e) {
      console.error('Failed to upload files');
      console.error(e);
    }
    return null;
  }

  /**
   * @returns string file url
   */
  async uploadFile(filePath, bucketPath) {
    const contentType = mime.getType(filePath);
    const stream = fs.createReadStream(filePath);
    const params = {
      Bucket: this.awsBucket,
      Key: `${bucketPath}`,
      ContentType: contentType,
      ACL: 'public-read',
      Body: stream
    };
    await this.s3Client.upload(params).promise();
    return `${this.baseUrl}/${bucketPath}`;
  }
}

/**
 * Use environment variables to instantiate the uploader
 * @returns {AwsUploader}
 */
function initAwsUploaderViaEnv() {
  require('dotenv').config();
  const {
    AWS_ACCESS_KEY,
    AWS_SECRET_KEY,
    AWS_BUCKET
  } = process.env;
  return new AwsUploader(AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_BUCKET);
}

module.exports.AwsUploader = AwsUploader;
module.exports.initAwsUploaderViaEnv = initAwsUploaderViaEnv;
