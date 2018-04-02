import { mutation, StatefulService } from 'services/stateful-service';
import { ScenesService } from 'services/scenes';
import { SourcesService } from 'services/sources';
import { shortcut } from 'services/shortcuts';
import { Inject } from '../../util/injector';
import { SourceFiltersService } from 'services/source-filters';
import { SelectionService } from 'services/selection';
import { SceneCollectionsService } from 'services/scene-collections';
import { IClipboardServiceApi } from './clipboard-api';


interface IClipboardState {
  itemsSceneId: string;
  sceneItemIds: string[];
  filterIds: string[];
}

export class ClipboardService extends StatefulService<IClipboardState> implements IClipboardServiceApi {

  static initialState: IClipboardState = {
    itemsSceneId: '',
    sceneItemIds: [],
    filterIds: []
  };

  @Inject() private scenesService: ScenesService;
  @Inject() private sourcesService: SourcesService;
  @Inject() private sourceFiltersService: SourceFiltersService;
  @Inject() private selectionService: SelectionService;
  @Inject() private sceneCollectionsService: SceneCollectionsService;

  init() {
    this.sceneCollectionsService.collectionSwitched.subscribe(() => {
      this.clear(); // it is not possible to copy/paste between scene collections yet
    });
  }


  @shortcut('Ctrl+C')
  copy() {
    this.SET_SCENE_ITEMS_IDS(this.selectionService.getIds());
    this.SET_SCENE_ITEMS_SCENE(this.scenesService.activeScene.id);
  }


  @shortcut('Ctrl+V')
  pasteReference() {
    if (!this.hasItems()) return;
    const insertedItems = this.scenesService
      .getScene(this.state.itemsSceneId)
      .getSelection(this.state.sceneItemIds)
      .copyReferenceTo(this.scenesService.activeSceneId);
    if (insertedItems.length) this.selectionService.select(insertedItems);
  }


  pasteDuplicate() {
    if (!this.hasItems()) return;
    const insertedItems = this.scenesService
      .getScene(this.state.itemsSceneId)
      .getSelection(this.state.sceneItemIds)
      .copyTo(this.scenesService.activeSceneId);
    if (insertedItems.length) this.selectionService.select(insertedItems);
  }


  copyFilters() {
    const source = this.selectionService.getLastSelected();
    if (!source) return;
    this.SET_FILTERS_IDS([source.sourceId]);
  }


  pasteFilters(toSourceId: string) {
    this.state.filterIds.forEach(fromSourceId => {
      const fromSource = this.sourcesService.getSource(fromSourceId);
      if (!fromSource) return;
      this.sourceFiltersService.copyFilters(fromSource.sourceId, toSourceId);
    });
  }


  hasItems() {
    return !!this.state.sceneItemIds.length;
  }


  hasFilters() {
    return !!this.state.filterIds.length;
  }

  clear() {
    this.SET_FILTERS_IDS([]);
    this.SET_SCENE_ITEMS_IDS([]);
    this.SET_SCENE_ITEMS_SCENE('');
  }

  @mutation()
  private SET_SCENE_ITEMS_IDS(ids: string[]) {
    this.state.sceneItemIds = ids;
  }

  @mutation()
  private SET_FILTERS_IDS(filtersIds: string[]) {
    this.state.filterIds = filtersIds;
  }

  @mutation()
  private SET_SCENE_ITEMS_SCENE(sceneId: string) {
    this.state.itemsSceneId = sceneId;
  }
}
