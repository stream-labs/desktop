export interface IScenesCollectionsApi {
  getState(): IScenesCollectionState;
}

export interface IScenesCollectionState {
  activeCollection: string;
  scenesCollections: string[];
}
