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
}

export interface IScenesCollectionState {
  activeCollection: string;
  scenesCollections: string[];
}
