/**
 * Manager for scenes collections.
 * Use `AppService.loadConfig()` to switch between configs.
 *
 * @see AppService
 *
 */
export interface IScenesCollectionsServiceApi {
  getState(): IScenesCollectionState;
  hasConfig(configName: string): boolean;
  renameConfig(newName: string): void;
  duplicateConfig(toConfig: string): void;

  /**
   * returns list of sources and scenes for each scene collection
   */
  fetchSceneCollectionsSchema(): Dictionary<ISceneCollectionSchema>;
}

export interface IScenesCollectionState {
  activeCollection: string;
  scenesCollections: string[];
}

export interface ISceneCollectionSchema {
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
