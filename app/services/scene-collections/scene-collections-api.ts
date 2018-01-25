export interface ISceneCollectionsServiceApi {
  /**
   * Attempt to load a scene collection.
   * @param id The id of the colleciton to load
   */
  load(id: string): Promise<void>;

  /**
   * Create and load a new empty scene collection
   * @param name the name of the new collection
   */
  create(name?: string): Promise<void>;

  /**
   * Fetch a list of all scene collections and information
   * about the scene and sources inside them.
   */
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
