import { Service } from './service';
import { UserService } from './user';
import { Inject } from '../util/injector';
import electron from '../vendor/electron';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { compact } from 'lodash';

const archiver = window['require']('archiver');
const AWS = window['require']('aws-sdk');

export class CacheUploaderService extends Service {

  @Inject()
  userService: UserService;


  uploadCache(): Promise<string> {
    return new Promise(resolve => {
      const cacheDir = electron.remote.app.getPath('userData');
      const dateStr = (new Date()).toISOString();
      const username = this.userService.username;
      const keyname = `${compact([dateStr, username]).join('-')}.zip`;
      const cacheFile = path.join(os.tmpdir(), 'slobs-cache.zip');
      const output = fs.createWriteStream(cacheFile);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        const file = fs.createReadStream(cacheFile);

        AWS.config.region = 'us-west-2';

        // This is a restricted cache upload account
        AWS.config.credentials = new AWS.Credentials({
          accessKeyId: 'AKIAIAINC32O7I3KUJGQ',
          secretAccessKey: '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'
        });


        const upload = new AWS.S3.ManagedUpload({
          params: {
            Bucket: 'streamlabs-obs-user-cache',
            Key: keyname,
            Body: file
          }
        });

        upload.promise().then(() => {
          resolve(keyname);
        });
      });

      archive.pipe(output);
      archive.directory(cacheDir, false);
      archive.finalize();
    });
  }

}
