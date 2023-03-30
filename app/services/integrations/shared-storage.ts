import fs from 'fs';
import { Service, Inject } from 'services/core';
import { UserService } from 'services/user';
import { authorizedHeaders, jfetch } from 'util/requests';

interface IVideoFile {
  name: string;
  size: number;
}

interface IPrepareResponse {
  file: {
    id: string;
    status: string;
    multipart: boolean;
    mime_type: 'video/mpeg';
    original_filename: string;
    size: number;
    created_at: string;
    expires_at: string;
  };
  uploadUrls: string[];
  isMultipart: boolean;
}

export class SharedStorageService extends Service {
  @Inject() userService: UserService;

  get host() {
    return 'https://api-id.streamlabs.dev';
  }

  async prepareUpload(video: IVideoFile): Promise<IPrepareResponse> {
    const url = `${this.host}/storage/v1/temporary-files`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const body = new FormData();
    body.append('name', video.name);
    body.append('size', String(video.size));
    body.append('mime_type', 'video/mpeg');

    try {
      return await jfetch(new Request(url, { headers, body, method: 'POST' }));
    } catch (e: unknown) {
      console.error(e);
    }
  }

  async uploadFile(video: IVideoFile, onProgress?: (progress: any) => void) {
    try {
      const uploadInfo = await this.prepareUpload(video);
      if (uploadInfo.isMultipart) {
      } else {
        this.uploadS3File(uploadInfo, video.name);
      }
    } catch (e: unknown) {
      console.error(e);
    }
  }

  private async uploadS3File(uploadInfo: IPrepareResponse, filepath: string) {
    try {
      return await new Uploader({
        fileInfo: uploadInfo,
        filepath,
        onProgress: () => {},
        onError: () => {},
      }).start();
    } catch (e: unknown) {
      console.error(e);
    }
  }
}

interface IUploaderOptions {
  fileInfo: IPrepareResponse;
  filepath: string;
  onProgress: (progress: any) => void;
  onError?: (e: unknown) => void;
}

class Uploader {
  @Inject() userService: UserService;

  uploadedSize = 0;
  aborted = false;
  onProgress = (progress: any) => {};
  onError = (e: unknown) => {};
  uploadUrls: string[] = [];
  isMultipart = false;
  chunkSize: number = null;
  size = 0;
  type = '';
  filepath = '';

  constructor(opts: IUploaderOptions) {
    this.onProgress = opts.onProgress;
    this.onError = opts.onError;
    this.uploadUrls = opts.fileInfo.uploadUrls;
    this.isMultipart = opts.fileInfo.isMultipart;
    this.size = opts.fileInfo.file.size;
    this.chunkSize = this.isMultipart ? Math.round(this.size / this.uploadUrls.length) : this.size;
    this.type = opts.fileInfo.file.mime_type;
    this.filepath = opts.filepath;
  }

  async start() {
    const file = await new Promise<number>((resolve, reject) => {
      fs.open(this.filepath, 'r', (err, fd) => {
        if (err) {
          reject(err);
        } else {
          resolve(fd);
        }
      });
    });

    this.initialize(file);
  }

  async initialize(file: number) {
    try {
      await Promise.all(this.uploadUrls.map(url => this.uploadChunk(url, file)));
    } catch (e: unknown) {
      return e;
    }
  }

  async uploadChunk(url: string, file: number) {
    const chunkSize = Math.min(this.size - this.uploadedSize, this.chunkSize);
    const readBuffer = Buffer.alloc(chunkSize);
    const bytesRead = await new Promise<number>((resolve, reject) => {
      fs.read(file, readBuffer, 0, chunkSize, null, (err, bytesRead) => {
        if (err) {
          reject(err);
        } else {
          resolve(bytesRead);
        }
      });
    });

    if (bytesRead !== chunkSize) {
      // Something went wrong, we didn't read as many bytes as expected
      throw new Error(
        `Did not read expected number of bytes from video, Expected: ${chunkSize} Actual: ${bytesRead}`,
      );
    }

    const headers = authorizedHeaders(this.userService.apiToken);
    headers.append('Content-Type', this.type);
    headers.append(
      'Content-Range',
      `bytes ${this.uploadedSize}-${this.uploadedSize + chunkSize - 1}/${this.size}`,
    );
    headers.append('X-Upload-Content-Type', this.type);

    this.uploadedSize += chunkSize;

    const result = await fetch(
      new Request(url, {
        method: 'PUT',
        headers,
        body: new Blob([readBuffer]),
      }),
    );

    this.onProgress({
      totalBytes: this.size,
      uploadedBytes: this.uploadedSize,
    });

    // 308 means we need to keep uploading
    if (result.status === 308) {
      return false;
    } else if ([200, 201].includes(result.status)) {
      // Final upload call contains info about the created video
      return (await result.json()) as { id: string };
    } else {
      throw new Error(`Got unexpected video chunk upload status ${result.status}`);
    }
  }
}
