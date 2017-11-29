import { mutation, StatefulService } from './stateful-service';
import { ScenesService } from './scenes';
import { SourcesService } from './sources';
import { shortcut } from './shortcuts';
import { Inject } from '../util/injector';
import { SourceFiltersService } from './source-filters';


interface IClipboardState {
  sourcesIds: string[];
  filtersIds: string[];
}

export class ClipboardService extends StatefulService<IClipboardState> {

  static initialState: IClipboardState = {
    sourcesIds: [],
    filtersIds: []
  };

  @Inject()
  private scenesService: ScenesService;

  @Inject()
  private sourcesService: SourcesService;

  @Inject()
  private sourceFiltersService: SourceFiltersService;

  @shortcut('Ctrl+C')
  copy() {
    const source = this.scenesService.activeScene.activeItems[0];
    if (!source) return;
    this.SET_SOURCES_IDS([source.sourceId]);
  }


  @shortcut('Ctrl+V')
  pasteReference() {
    this.state.sourcesIds.forEach(sourceId => {
      const source = this.sourcesService.getSource(sourceId);
      if (!source) return;
      this.scenesService.activeScene.addSource(sourceId);
    });
  }


  pasteDuplicate() {
    this.state.sourcesIds.forEach(sceneItemId => {
      const source = this.sourcesService.getSource(sceneItemId);
      if (!source) return;
      const duplicatedSource = source.duplicate();
      if (!duplicatedSource) {
        alert(`Unable to duplicate ${source.name}`);
        return;
      }
      this.scenesService.activeScene.addSource(duplicatedSource.sourceId);
    });
  }


  copyFilters() {
    const source = this.scenesService.activeScene.activeItems[0];
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


  hasSources() {
    return !!this.state.sourcesIds.length;
  }


  hasFilters() {
    return !!this.state.filtersIds.length;
  }


  @mutation()
  private SET_SOURCES_IDS(sourcesIds: string[]) {
    this.state.sourcesIds = sourcesIds;
  }

  @mutation()
  private SET_FILTERS_IDS(filtersIds: string[]) {
    this.state.filtersIds = filtersIds;
  }
}
