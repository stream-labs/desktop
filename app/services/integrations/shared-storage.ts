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

  async uploadFile(video: IVideoFile) {
    try {
      const uploadInfo = await this.prepareUpload(video);
      if (uploadInfo.isMultipart) {
      } else {
        this.uploadS3File(uploadInfo.uploadUrls[0]);
      }
    } catch (e: unknown) {
      console.error(e);
    }
  }

  async uploadS3File(url: string) {}
}
