import fs from 'fs';
import path from 'path';
import mime from 'mime';
import { platformRequest } from '../utils';
import { Inject } from 'services/core';
import { UserService } from 'services/user';

export interface IYoutubeVideoUploadOptions {
  title: string;
  description: string;
  privacyStatus: TPrivacyStatus;
}

interface IUploadProgress {
  uploadedBytes: number;
  totalBytes: number;
}

/**
 * This object is extremely extensive, but for right now we
 * are just defining typings for what we use.
 */
export interface IYoutubeUploadResponse {
  id: string;
}

export type TPrivacyStatus = 'private' | 'public' | 'unlisted';
type TProgressCallback = (progress: IUploadProgress) => void;

export class YoutubeUploader {
  @Inject() userService: UserService;

  get oauthToken() {
    return this.userService.state.auth?.platforms?.youtube?.token;
  }

  uploadVideo(
    filePath: string,
    options: IYoutubeVideoUploadOptions,
    onProgress: TProgressCallback,
  ): { cancel: () => void; complete: Promise<IYoutubeUploadResponse> } {
    let cancelRequested = false;
    const oauthToken = this.oauthToken;

    // Slightly weird structure here is to support returning both
    // a promise for when the upload is finished, and a function
    // that can be used to cancel the upload
    async function doUpload(): Promise<IYoutubeUploadResponse> {
      const parsed = path.parse(filePath);
      const type = mime.getType(parsed.ext) ?? 'application/octet-stream';
      const stats = fs.lstatSync(filePath);

      onProgress({
        totalBytes: stats.size,
        uploadedBytes: 0,
      });

      const headers = new Headers();

      headers.append('Authorization', `Bearer ${oauthToken}`);
      headers.append('Content-Type', 'application/json');
      headers.append('X-Upload-Content-Length', stats.size.toString());
      headers.append('X-Upload-Content-Type', type);

      const result = await platformRequest(
        'youtube',
        {
          url:
            'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&mine=true&uploadType=resumable',
          method: 'POST',
          headers,
          body: JSON.stringify({
            snippet: {
              title: options.title,
              description: options.description,
            },
            status: {
              privacyStatus: options.privacyStatus,
            },
          }),
        },
        true,
        false,
      );

      const locationHeader = result.headers.get('Location');
      if (!locationHeader) {
        result.text().then(text => {
          console.log(`Got ${result.status} response from YT Upload`);
          console.log(text);
        });

        throw new Error('Did not receive upload location header!');
      }
      const uploadLocation = locationHeader;

      let currentByteIndex = 0;

      // YT wants us to upload in chunks of 262144 bytes
      const CHUNK_SIZE = 262144;
      const file = await new Promise<number>((resolve, reject) => {
        fs.open(filePath, 'r', (err, fd) => {
          if (err) {
            reject(err);
          } else {
            resolve(fd);
          }
        });
      });

      // Uploads the next chunk of the video.
      // Resolves to video creation response if done, or false if not done
      // Rejects if the chunk upload fails
      async function uploadNextChunk(): Promise<IYoutubeUploadResponse | false> {
        const nextChunkSize = Math.min(stats.size - currentByteIndex, CHUNK_SIZE);
        const readBuffer = Buffer.alloc(nextChunkSize);
        const bytesRead = await new Promise<number>((resolve, reject) => {
          fs.read(file, readBuffer, 0, nextChunkSize, null, (err, bytesRead) => {
            if (err) {
              reject(err);
            } else {
              resolve(bytesRead);
            }
          });
        });

        if (bytesRead !== nextChunkSize) {
          // Something went wrong, we didn't read as many bytes as expected
          throw new Error(
            `Did not read expected number of bytes from video, Expected: ${nextChunkSize} Actual: ${bytesRead}`,
          );
        }

        const headers = new Headers();
        headers.append('Content-Type', type);
        headers.append(
          'Content-Range',
          `bytes ${currentByteIndex}-${currentByteIndex + nextChunkSize - 1}/${stats.size}`,
        );
        headers.append('X-Upload-Content-Type', type);

        currentByteIndex += nextChunkSize;

        // Doesn't need to use platformRequest as this is not
        // an authenticated call. Is a unique secure upload URL.
        const result = await fetch(
          new Request(uploadLocation, {
            method: 'PUT',
            headers,
            body: new Blob([readBuffer]),
          }),
        );

        onProgress({
          totalBytes: stats.size,
          uploadedBytes: currentByteIndex,
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

      let chunkResult: IYoutubeUploadResponse | false;

      while (!(chunkResult = await uploadNextChunk())) {
        if (cancelRequested) return Promise.reject('The upload was canceled');
      }

      return chunkResult;
    }

    return {
      cancel: () => (cancelRequested = true),
      complete: doUpload(),
    };
  }
}
