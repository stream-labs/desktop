export interface ISceneCollectionsServiceApi {
  load(id: string, shouldAttemptRecovery?: boolean): Promise<void>;
  create(name?: string, setupFunction?: () => void): Promise<void>;
  fetchSceneCollectionsSchema(): Promise<ISceneCollectionSchema[]>;

  collections: ISceneCollectionsManifestEntry[];
  activeCollection: ISceneCollectionsManifestEntry;
}

export interface ISceneCollectionSchema {
  name: string;
  id: string;

  scenes: {
    id: string;
    name: string;
    sceneItems: { sceneItemId: string, sourceId: string }[]
  }[];

  sources: {
    sourceId: string;
    name: string;
    type: string;
    channel: number;
  }[];
}

export interface ISceneCollectionsManifestEntry {
  id: string;
  name: string;
  serverId?: number;
  deleted: boolean;
  modified: string;
}
