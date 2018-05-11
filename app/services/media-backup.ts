import { StatefulService, mutation } from 'services/stateful-service';
import path from 'path';
import fs from 'fs';
import request from 'request';
import crypto from 'crypto';
import { Inject } from 'util/injector';
import { HostsService } from 'services/hosts';
import { UserService } from 'services/user';
import electron from 'electron';

const uuid = window['require']('uuid/v4');

export enum EMediaFileStatus {
  Checking,
  Synced,
  Uploading,
  Downloading
}

interface IMediaFile {
  id: string; // SLOBS ID
  serverId?: number; // Server ID
  name: string;
  status: EMediaFileStatus;
  filePath: string;
}

interface IMediaBackupState {
  files: IMediaFile[];
}

interface IMediaFileDataResponse {
  checksum: string;
  filename: string;
  modified: string;
  url: string;
}

export class MediaBackupService extends StatefulService<IMediaBackupState> {
  @Inject() hostsService: HostsService;
  @Inject() userService: UserService;

  static initialState: IMediaBackupState = { files: [] };

  /**
   * Gets a string suitable to act as a local file id
   */
  getLocalFileId() { return uuid(); }

  /**
   * Registers a new file
   */
  async createNewFile(localId: string, filePath: string): Promise<IMediaFile> {
    let name: string;

    try {
      name = path.parse(filePath).base;
    } catch (e) {
      console.debug(`Got unparseable path ${filePath}`);
      return null;
    }

    const file: IMediaFile = {
      id: localId,
      name,
      filePath,
      status: EMediaFileStatus.Uploading
    };

    this.INSERT_FILE(file);

    // TODO: Async
    if (!fs.existsSync(filePath)) return null;

    // TODO: Error handling
    const serverId = (await this.uploadFile(filePath)).id;
    file.serverId = serverId;
    file.status = EMediaFileStatus.Synced;
    this.UPDATE_FILE(localId, file);
    return file;
  }

  /**
   * Checks the file for integrity and downloads a new copy if necessary
   * @param localId the local id of the file
   * @param serverId the server id of the file
   * @param originalFilePath the original path of the file when it was
   * uploaded.  This is an optimization to prevent having a duplicate of
   * the media in the users cache on the PC that the originally uploaded
   * the media from.
   */
  async syncFile(localId: string, serverId: number, originalFilePath: string): Promise<IMediaFile> {
    const name = path.parse(originalFilePath).base;

    const file: IMediaFile = {
      id: localId,
      name,
      filePath: originalFilePath,
      serverId,
      status: EMediaFileStatus.Checking
    };

    this.INSERT_FILE(file);

    const data = await this.getFileData(serverId);

    // TODO: Handle data does not exist on server

    // These are the 2 locations that will be checked for valid media files
    const filesToCheck = [
      originalFilePath,
      this.getMediaFilePath(serverId)
    ];

    for (const fileToCheck of filesToCheck) {
      // TODO: Async
      if (fs.existsSync(fileToCheck)) {
        const checksum = await this.getChecksum(fileToCheck);

        if (checksum === data.checksum) {
          file.filePath = fileToCheck;
          file.status = EMediaFileStatus.Synced;
          this.UPDATE_FILE(localId, file);
          return file;
        }

        console.debug(`Got checksum mismatch: ${checksum} =/= ${data.checksum}`);
      }
    }

    // We need to download a new copy of this file from the server
    this.UPDATE_FILE(localId, { status: EMediaFileStatus.Downloading });
    const downloadedPath = await this.downloadFile(data.url, serverId);

    file.status = EMediaFileStatus.Synced;
    file.filePath = downloadedPath;
    this.UPDATE_FILE(localId, file);

    return file;
  }


  private async uploadFile(filePath: string) {
    console.log('UPLOAD');

    const checksum = await this.getChecksum(filePath);
    const file = fs.createReadStream(filePath);

    const formData = {
      modified: new Date().toISOString(),
      checksum,
      file
    };

    const data = await new Promise<{ id: number }>(resolve => {
      const req = request.post({
        url: `${this.apiBase}/upload`,
        headers: this.authedHeaders,
        formData
      },
      (err, res, body) => {
        // TODO: Error handling?
        resolve(JSON.parse(body));
      });
    });

    return data;
  }

  private getFileData(id: number) {
    return new Promise<IMediaFileDataResponse>(resolve => {
      request({
        url: `${this.apiBase}/${id}`,
        headers: this.authedHeaders
      },
      (err, res, body) => {
        // TODO: Error handling?
        resolve(JSON.parse(body));
      });
    });
  }

  private getChecksum(filePath: string) {
    return new Promise<string>(resolve => {
      const file = fs.createReadStream(filePath);
      const hash = crypto.createHash('md5');

      file.on('data', data => hash.update(data));
      file.on('end', () => resolve(hash.digest('hex')));
    });
  }

  private downloadFile(url: string, serverId: number) {
    console.log('DOWNLOAD');
    this.ensureMediaDirectory();
    const filePath = this.getMediaFilePath(serverId);

    return new Promise<string>(resolve => {
      const stream = fs.createWriteStream(filePath);
      request(url).pipe(stream);

      stream.on('finish', () => resolve(filePath));
    });
  }

  private getMediaFilePath(serverId: number) {
    return path.join(this.mediaDirectory, serverId.toString());
  }

  private get apiBase() {
    return `https://${this.hostsService.streamlabs}/api/v5/slobs/media`;
  }

  private get authedHeaders() {
    return { Authorization: `Bearer ${this.userService.apiToken}` };
  }

  private ensureMediaDirectory() {
    if (!fs.existsSync(this.mediaDirectory)) {
      fs.mkdirSync(this.mediaDirectory);
    }
  }

  private get mediaDirectory() {
    return path.join(electron.remote.app.getPath('userData'), 'Media');
  }

  @mutation()
  INSERT_FILE(file: IMediaFile) {
    // First remove the existing one, if it is exists
    this.state.files = this.state.files.filter(storeFile => {
      return storeFile.id !== file.id;
    });

    this.state.files.push({ ...file });
  }

  @mutation()
  UPDATE_FILE(id: string, patch: Partial<IMediaFile>) {
    this.state.files.forEach(file => {
      if (file.id === id) {
        Object.assign(file, patch);
      }
    });
  }

}
