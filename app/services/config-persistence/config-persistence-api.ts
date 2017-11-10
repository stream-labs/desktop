export interface IConfigPersistenceServiceApi {
  getState(): IScenesCollectionState;
}

export interface IScenesCollectionState {
  activeCollection: string;
  scenesCollections: string[];
}
