import { ObjectSchema } from 'realm';
import { RealmObject } from '../../realm';
import { IUploadInfo } from '../models/highlighter.models';

export class RUploadInfo extends RealmObject {
  uploading: boolean;
  uploadedBytes: number;
  totalBytes: number;
  cancelRequested: boolean;
  videoId: string | null;
  error: boolean;

  static schema: ObjectSchema = {
    name: 'UploadInfo',
    embedded: true,
    properties: {
      uploading: { type: 'bool', default: false },
      uploadedBytes: { type: 'int', default: 0 },
      totalBytes: { type: 'int', default: 0 },
      cancelRequested: { type: 'bool', default: false },
      videoId: { type: 'mixed', default: null },
      error: { type: 'bool', default: false },
    },
  };

  update(uploadInfo: Partial<IUploadInfo>) {
    this.db.write(() => {
      Object.assign(this, uploadInfo);
    });
  }

  clear() {
    this.db.write(() => {
      this.uploading = false;
      this.uploadedBytes = 0;
      this.totalBytes = 0;
      this.cancelRequested = false;
      this.videoId = null;
      this.error = false;
    });
  }
}

RUploadInfo.register({ persist: true });
