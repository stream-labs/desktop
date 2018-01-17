import { Service } from 'services/service';
import { Inject } from 'util/injector';
import { SceneCollectionsServerApiService, parse, CONFIG_NODE_TYPES } from '.';
import { RootNode } from './nodes/root';
import electron from 'electron';
import path from 'path';
import fs from 'fs';

interface IFileData {
  modified: Date;
  rootNode: RootNode;
  json: string;
}

/**
 * This service manages interaction with the scene collections
 * server API.
 */
export class SceneCollectionsSyncService extends Service {
  @Inject('SceneCollectionsServerApiService') serverApi: SceneCollectionsServerApiService;

  init() {
    this.reconcileSceneCollections().then(() => {
      this.serverApi.fetchSceneCollections().then(data => {
        console.log(data);
      });
    });
  }

  /**
   * Stores the server id of the currently loaded scene collection.
   */
  currentServerId: number;

  /**
   * This function should be run at app startup before
   * any config files are loaded.  It reconciles the state
   * of scene configs on disk with the server.
   */
  async reconcileSceneCollections() {
    const data = await this.readFilesData();
    const serverCollections = (await this.serverApi.fetchSceneCollections()).data;

    // First, files that are on disk, but don't have a server id,
    // we should create on the server as new collections.
    await this.uploadUntrackedCollections(data);
  }

  /**
   * Uploads scene collections that are on disk but are untracked
   */
  private async uploadUntrackedCollections(dataLookup: Dictionary<IFileData>) {
    const promises: Promise<void>[] = [];

    Object.keys(dataLookup).forEach(file => {
      const val = dataLookup[file];

      if (!val.rootNode.data.serverId) {
        promises.push(this.createCollection(file, val));
      }
    });

    await Promise.all(promises);
  }

  /**
   * Uploads a single scene collection on disk as a new scene collection
   */
  private async createCollection(file: string, data: IFileData) {
    await this.serverApi.createSceneCollection({
      name: file.replace(/\.json$/, ''),
      data: data.json,
      updated_at: data.modified
    });
  }

  /**
   * Simultaneously reads file metadata from all config files, and
   * resolves with metadata grouped by filename when done.
   */
  private async readFilesData(): Promise<Dictionary<IFileData>> {
    const files = await this.listConfigFiles();
    const promises: Promise<IFileData>[] = [];

    files.forEach(file => {
      const filePath = path.join(this.configFileDirectory, file);
      promises.push(this.getFileMetadata(filePath));
    });

    const results = await Promise.all(promises);
    const byFileName: Dictionary<IFileData> = {};

    files.forEach((file, i) => {
      byFileName[file] = results[i];
    });

    return byFileName;
  }

  private async getFileMetadata(filePath: string): Promise<IFileData> {
    const json = await this.getFileContents(filePath);
    const rootNode = parse(json, CONFIG_NODE_TYPES);
    const modified = await this.getFileModifiedTimestamp(filePath);

    return { json, rootNode, modified };
  }

  private getFileContents(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(data.toString());
      });
    });
  }

  /**
   * Uses fs.stat to read file modified time, wrapped in a promise.
   * @param filePath the path to the file
   */
  private getFileModifiedTimestamp(filePath: string): Promise<Date> {
    return new Promise((resolve, reject) => {
      fs.stat(filePath, (err, stats) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(stats.mtime);
      });
    });
  }

  private async listConfigFiles() {
    const files = await this.readConfigDir();
    return files.filter(file => {
      if (file === '.json') return false;
      if (file.match(/\.json\.bak$/)) return false;
      return true;
    });
  }

  private readConfigDir() {
    return new Promise<string[]>((resolve, reject) => {
      fs.readdir(this.configFileDirectory, (err, files) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(files);
      });
    });
  }

  private get configFileDirectory() {
    return path.join(electron.remote.app.getPath('userData'), 'SceneConfigs');
  }
}
