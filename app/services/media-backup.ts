import { mutation, StatefulService } from 'services/stateful-service';
import path from 'path';
import fs from 'fs';
import request from 'request';
import { Inject } from 'util/injector';
import { HostsService } from 'services/hosts';
import { UserService } from 'services/user';
import electron from 'electron';
import { getChecksum, isUrl } from 'util/requests';

const uuid = window['require']('uuid/v4');

export enum EMediaFileStatus {
  Checking,
  Synced,
  Uploading,
  Downloading,
}

export enum EGlobalSyncStatus {
  Syncing,
  Synced,
}

interface IMediaFile {
  id: string; // SLOBS ID
  serverId?: number; // Server ID
  name: string;
  status: EMediaFileStatus;
  filePath: string;
  syncLock: string;
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

const ONE_GIGABYTE = Math.pow(10, 9);

export class MediaBackupService extends StatefulService<IMediaBackupState> {
  @Inject() hostsService: HostsService;
  @Inject() userService: UserService;

  static initialState: IMediaBackupState = { files: [] };

  /**
   * Gets a string suitable to act as a local file id
   */
  getLocalFileId() {
    return uuid();
  }

  /**
   * Fetches the global sync status.
   * Will be "synced" if all files are synced
   * Will be "syncing" if at least 1 file is syncing
   */
  get globalSyncStatus(): EGlobalSyncStatus {
    const syncing = this.state.files.find(file => file.status !== EMediaFileStatus.Synced);

    if (syncing) return EGlobalSyncStatus.Syncing;

    return EGlobalSyncStatus.Synced;
  }

  /**
   * Registers a new file
   */
  async createNewFile(localId: string, filePath: string): Promise<IMediaFile> {
    let name: string;

    if (isUrl(filePath)) {
      return;
    }

    try {
      name = path.parse(filePath).base;
    } catch (e) {
      console.warn(`[Media Backup] Got unparseable path ${filePath}`);
      return null;
    }

    let stats: fs.Stats;

    try {
      stats = await new Promise<fs.Stats>((resolve, reject) => {
        fs.lstat(filePath, (err, stats) => {
          if (err) {
            reject(err);
          } else {
            resolve(stats);
          }
        });
      });
    } catch (e) {
      // Lots of people have media sources that point to files that no
      // longer exist.  We want to silently do nothing in this scenario.
      console.warn(`[Media Backup] Error fetching stats for: ${filePath}`);
      return null;
    }

    if (stats.size > ONE_GIGABYTE) {
      // We don't upload files larger than 1 gigabyte
      return null;
    }

    const syncLock = uuid();

    const file: IMediaFile = {
      name,
      filePath,
      syncLock,
      id: localId,
      status: EMediaFileStatus.Uploading,
    };

    if (!fs.existsSync(filePath)) return null;

    this.INSERT_FILE(file);

    let data: { id: number };

    try {
      data = await this.withRetry(() => this.uploadFile(filePath));
    } catch (e) {
      console.error('[Media Backup] Error uploading file:', e);

      // We don't surface errors to the user currently
      if (this.validateSyncLock(localId, syncLock)) {
        this.UPDATE_FILE(localId, { status: EMediaFileStatus.Synced });
      }

      return null;
    }

    if (this.validateSyncLock(localId, syncLock)) {
      file.serverId = data.id;
      file.status = EMediaFileStatus.Synced;
      this.UPDATE_FILE(localId, file);
      return file;
    }

    return null;
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

    const syncLock = uuid();

    const file: IMediaFile = {
      name,
      serverId,
      syncLock,
      id: localId,
      filePath: originalFilePath,
      status: EMediaFileStatus.Checking,
    };

    this.INSERT_FILE(file);

    let data: IMediaFileDataResponse;

    try {
      data = await this.withRetry(() => this.getFileData(serverId));
    } catch (e) {
      console.error(`[Media Backup] Ran out of retries fetching data ${e.body}`);

      // At the moment, we don't surface sync errors to the user
      if (this.validateSyncLock(localId, syncLock)) {
        this.UPDATE_FILE(localId, { status: EMediaFileStatus.Synced });
      }
      return null;
    }

    // These are the 2 locations that will be checked for valid media files
    const filesToCheck = [originalFilePath, this.getMediaFilePath(serverId, data.filename)];

    for (const fileToCheck of filesToCheck) {
      if (fs.existsSync(fileToCheck)) {
        let checksum: string;

        try {
          checksum = await this.withRetry(() => getChecksum(fileToCheck));
        } catch (e) {
          // This is not a fatal error, we can download a new copy
          console.warn(`[Media Backup] Error calculating checksum: ${e}`);
        }

        if (checksum && checksum === data.checksum) {
          if (this.validateSyncLock(localId, syncLock)) {
            file.filePath = fileToCheck;
            file.status = EMediaFileStatus.Synced;
            this.UPDATE_FILE(localId, file);
            return file;
          }
        }

        console.debug(`[Media Backup] Got checksum mismatch: ${checksum} =/= ${data.checksum}`);
      }
    }

    // We need to download a new copy of this file from the server
    if (!this.validateSyncLock(localId, syncLock)) return null;
    this.UPDATE_FILE(localId, { status: EMediaFileStatus.Downloading });
    let downloadedPath: string;

    try {
      downloadedPath = await this.withRetry(() =>
        this.downloadFile(data.url, serverId, data.filename),
      );
    } catch (e) {
      console.error(`[Media Backup] Error downloading file: ${e.body}`);

      // At the moment, we don't surface sync errors to the user
      if (this.validateSyncLock(localId, syncLock)) {
        this.UPDATE_FILE(localId, { status: EMediaFileStatus.Synced });
      }
      return null;
    }

    if (this.validateSyncLock(localId, syncLock)) {
      file.status = EMediaFileStatus.Synced;
      file.filePath = downloadedPath;
      this.UPDATE_FILE(localId, file);

      return file;
    }
  }

  private async uploadFile(filePath: string) {
    const checksum = await getChecksum(filePath);
    const file = fs.createReadStream(filePath);

    const formData = {
      checksum,
      file,
      modified: new Date().toISOString(),
    };

    return await new Promise<{ id: number }>((resolve, reject) => {
      const req = request.post(
        {
          formData,
          url: `${this.apiBase}/upload`,
          headers: this.authedHeaders,
        },
        (err, res, body) => {
          if (Math.floor(res.statusCode / 100) === 2) {
            resolve(JSON.parse(body));
          } else {
            reject(res);
          }
        },
      );
    });
  }

  private getFileData(id: number) {
    return new Promise<IMediaFileDataResponse>((resolve, reject) => {
      request(
        {
          url: `${this.apiBase}/${id}`,
          headers: this.authedHeaders,
        },
        (err, res, body) => {
          if (Math.floor(res.statusCode / 100) === 2) {
            resolve(JSON.parse(body));
          } else {
            reject(res);
          }
        },
      );
    });
  }

  private downloadFile(url: string, serverId: number, filename: string) {
    this.ensureMediaDirectory();
    const filePath = this.getMediaFilePath(serverId, filename);

    return new Promise<string>((resolve, reject) => {
      const stream = fs.createWriteStream(filePath);
      request(url).pipe(stream);

      stream.on('finish', () => resolve(filePath));
      stream.on('error', e => reject(e));
    });
  }

  private async withRetry<T>(executor: () => Promise<T>): Promise<T> {
    let retries = 2;

    while (true) {
      try {
        return await executor();
      } catch (e) {
        if (retries <= 0) throw e;
        retries -= 1;
      }
    }
  }

  /**
   * Validates that no other file has started uploading or
   * downloading more recently for this source
   */
  private validateSyncLock(id: string, syncLock: string) {
    return !!this.state.files.find(file => {
      return file.id === id && file.syncLock === syncLock;
    });
  }

  private getMediaFilePath(serverId: number, filename: string) {
    return path.join(this.mediaDirectory, `${serverId.toString()}-${filename}`);
  }

  private get apiBase() {
    return `https://${this.hostsService.media}/api/v5/slobs/media`;
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
