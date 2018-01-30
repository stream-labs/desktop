import { mutation, StatefulService } from './stateful-service';
import { ScenesService } from './scenes';
import { SourcesService } from './sources';
import { shortcut } from './shortcuts';
import { Inject } from '../util/injector';
import { SourceFiltersService } from './source-filters';
import { SelectionService } from 'services/selection';


interface IClipboardState {
  sceneItemsIds: string[];
  filtersIds: string[];
}

export class ClipboardService extends StatefulService<IClipboardState> {

  static initialState: IClipboardState = {
    sceneItemsIds: [],
    filtersIds: []
  };

  @Inject() private scenesService: ScenesService;
  @Inject() private sourcesService: SourcesService;
  @Inject() private sourceFiltersService: SourceFiltersService;
  @Inject() private selectionService: SelectionService;

  @shortcut('Ctrl+C')
  copy() {
    const itemsIds = this.selectionService.getIds();
    this.SET_SCENE_ITEMS_IDS(itemsIds);
  }


  @shortcut('Ctrl+V')
  pasteReference() {
    const insertedIds: string[] = [];
    const scene = this.scenesService.activeScene;
    this.state.sceneItemsIds.forEach(sceneItemId => {
      const sceneItem = this.scenesService.getSceneItem(sceneItemId);
      if (!sceneItem) return;
      const insertedItem = scene.addSource(sceneItem.sourceId);
      insertedItem.setSettings(sceneItem.getSettings());
      insertedIds.push(insertedItem.sceneItemId);
    });
    if (insertedIds.length) this.selectionService.select(insertedIds);
  }


  pasteDuplicate() {
    const insertedIds: string[] = [];
    const scene = this.scenesService.activeScene;
    this.state.sceneItemsIds.forEach(sceneItemId => {
      const sceneItem = this.scenesService.getSceneItem(sceneItemId);
      if (!sceneItem) return;
      const duplicatedSource = sceneItem.getSource().duplicate();
      if (!duplicatedSource) {
        alert(`Unable to duplicate ${sceneItem.name}`);
        return;
      }
      const insertedItem = scene.addSource(duplicatedSource.sourceId);
      insertedItem.setSettings(sceneItem.getSettings());
      insertedIds.push(insertedItem.sceneItemId);
    });
    if (insertedIds.length) this.selectionService.select(insertedIds);
  }


  copyFilters() {
    const source = this.selectionService.getLastSelected();
    if (!source) return;
    this.SET_FILTERS_IDS([source.sourceId]);
  }


  pasteFilters(toSourceId: string) {
    this.state.filtersIds.forEach(fromSourceId => {
      const fromSource = this.sourcesService.getSource(fromSourceId);
      if (!fromSource) return;
      this.sourceFiltersService.copyFilters(fromSource.sourceId, toSourceId);
    });
  }


  hasItems() {
    return !!this.state.sceneItemsIds.length;
  }


  hasFilters() {
    return !!this.state.filtersIds.length;
  }


  @mutation()
  private SET_SCENE_ITEMS_IDS(ids: string[]) {
    this.state.sceneItemsIds = ids;
  }

  @mutation()
  private SET_FILTERS_IDS(filtersIds: string[]) {
    this.state.filtersIds = filtersIds;
  }
}
