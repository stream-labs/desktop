import { HostsService } from 'app-services';
import fs from 'fs';
import path from 'path';
import { Service, Inject } from 'services/core';
import { UserService } from 'services/user';
import { authorizedHeaders, jfetch } from 'util/requests';

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

interface IProgress {
  totalBytes: number;
  uploadedBytes: number;
}

export class SharedStorageService extends Service {
  @Inject() userService: UserService;
  @Inject() hostsService: HostsService;

  id: string;
  cancel: () => void;

  get host() {
    return this.hostsService.streamlabs;
  }

  async uploadFile(
    filepath: string,
    onProgress?: (progress: IProgress) => void,
    onError?: (error: unknown) => void,
  ) {
    try {
      const uploadInfo = await this.prepareUpload(filepath);
      this.id = uploadInfo.file.id;
      const { uploaded, reqBody } = await this.uploadS3File(
        uploadInfo,
        filepath,
        onProgress,
        onError,
      );
      if (uploaded) {
        await this.completeUpload(reqBody);
        return await this.generateShare();
      }
    } catch (e: unknown) {
      console.error(e);
    }
  }

  async completeUpload(body: { parts?: { number: number; tag: string }[] }) {
    const url = `${this.host}/storage/v1/temporary-files/${this.id}/complete`;
    const headers = authorizedHeaders(this.userService.apiToken);
    return await jfetch(new Request(url, { headers, method: 'POST', body: JSON.stringify(body) }));
  }

  async cancelUpload() {
    if (!this.id || !this.cancel) return;
    const url = `${this.host}/storage/v1/temporary-files/${this.id}`;
    const headers = authorizedHeaders(this.userService.apiToken);
    return await jfetch(new Request(url, { headers, method: 'DELETE' }));
  }

  private async prepareUpload(filepath: string): Promise<IPrepareResponse> {
    const url = `${this.host}/storage/v1/temporary-files`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const body = new FormData();
    const name = path.basename(filepath);
    const size = fs.lstatSync(filepath).size;
    body.append('name', name);
    body.append('size', String(size));
    body.append('mime_type', 'video/mpeg');

    try {
      return await jfetch(new Request(url, { headers, body, method: 'POST' }));
    } catch (e: unknown) {
      console.error(e);
    }
  }

  private async uploadS3File(
    uploadInfo: IPrepareResponse,
    filepath: string,
    onProgress?: (progress: IProgress) => void,
    onError?: (error: unknown) => void,
  ) {
    try {
      const uploader = new Uploader({
        fileInfo: uploadInfo,
        filepath,
        onProgress,
        onError,
      });
      this.cancel = uploader.cancel;
      return await uploader.start();
    } catch (e: unknown) {
      console.error(e);
    }
  }

  private async generateShare(): Promise<{ id: string }> {
    if (!this.id) return;
    const url = `${this.host}/storage/v1/temporary-shares/`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const body = JSON.stringify({ temporary_file_id: this.id, type: 'video' });
    return await jfetch(new Request(url, { method: 'POST', headers, body }));
  }
}

interface IUploaderOptions {
  fileInfo: IPrepareResponse;
  filepath: string;
  onProgress?: (progress: IProgress) => void;
  onError?: (e: unknown) => void;
}

class Uploader {
  @Inject() userService: UserService;

  uploadedSize = 0;
  aborted = false;
  onProgress = (progress: IProgress) => {};
  onError = (e: unknown) => {};
  uploadUrls: string[] = [];
  isMultipart = false;
  chunkSize: number = null;
  size = 0;
  type = '';
  filepath = '';
  cancelRequested = false;
  parts: { number: number; tag: string }[] = [];

  constructor(opts: IUploaderOptions) {
    this.onProgress = opts.onProgress;
    this.onError = opts.onError;
    this.uploadUrls = opts.fileInfo.uploadUrls;
    this.isMultipart = opts.fileInfo.isMultipart;
    this.size = opts.fileInfo.file.size;
    this.chunkSize = this.isMultipart ? Math.round(this.size / this.uploadUrls.length) : this.size;
    this.type = opts.fileInfo.file.mime_type;
    this.filepath = opts.filepath;
    this.cancel = this.cancel.bind(this);
  }

  async start() {
    try {
      const file = await new Promise<number>((resolve, reject) => {
        fs.open(this.filepath, 'r', (err, fd) => {
          if (err) {
            reject(err);
          } else {
            resolve(fd);
          }
        });
      });

      await this.uploadChunks(file);
      const reqBody = this.isMultipart ? { parts: this.parts } : {};
      return { uploaded: true, reqBody };
    } catch (e: unknown) {
      this.onError(e);
    }
  }

  async uploadChunks(file: number) {
    try {
      for (const url of this.uploadUrls) {
        if (this.cancelRequested) return;
        await this.uploadChunk(url, file);
      }
    } catch (e: unknown) {
      this.onError(e);
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

    const result: { eTag: string } = await jfetch(
      new Request(url, {
        method: 'PUT',
        headers,
        body: new Blob([readBuffer]),
      }),
    );

    this.parts.push({ number: this.parts.length + 1, tag: result.eTag });

    this.onProgress({
      totalBytes: this.size,
      uploadedBytes: this.uploadedSize,
    });
  }

  cancel() {
    this.cancelRequested = true;
  }
}
