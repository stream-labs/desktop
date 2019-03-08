import { SceneCollectionsService as InternalSceneCollectionsService } from 'services/scene-collections';
import { Inject } from 'util/injector';
import { Fallback, Singleton } from 'services/api/external-api';
import { Observable } from 'rxjs';

interface ISceneCollectionsManifestEntry {
  id: string;
  name: string;
}

interface ISceneCollectionCreateOptions {
  name?: string;
}

interface ISceneCollectionSchema {
  name: string;
  id: string;

  scenes: {
    id: string;
    name: string;
    sceneItems: { sceneItemId: string; sourceId: string }[];
  }[];

  sources: {
    sourceId: string;
    name: string;
    type: string;
    channel: number;
  }[];
}

@Singleton()
export class SceneCollectionsService {
  @Fallback()
  @Inject()
  protected sceneCollectionService: InternalSceneCollectionsService;

  get activeCollection(): ISceneCollectionsManifestEntry {
    return this.sceneCollectionService.activeCollection;
  }

  fetchSceneCollectionsSchema(): Promise<ISceneCollectionSchema[]> {
    return this.sceneCollectionService.fetchSceneCollectionsSchema();
  }

  create(options: ISceneCollectionCreateOptions): Promise<ISceneCollectionsManifestEntry> {
    return this.sceneCollectionService.create(options);
  }

  load(id: string) {
    return this.sceneCollectionService.load(id);
  }

  get collectionAdded(): Observable<ISceneCollectionsManifestEntry> {
    return this.sceneCollectionService.collectionAdded;
  }

  get collectionRemoved(): Observable<ISceneCollectionsManifestEntry> {
    return this.sceneCollectionService.collectionRemoved;
  }

  get collectionSwitched(): Observable<ISceneCollectionsManifestEntry> {
    return this.sceneCollectionService.collectionSwitched;
  }

  get collectionUpdated(): Observable<ISceneCollectionsManifestEntry> {
    return this.sceneCollectionService.collectionUpdated;
  }

  get collections(): ISceneCollectionsManifestEntry[] {
    return this.sceneCollectionService.collections;
  }
}
