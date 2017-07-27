import { mutation, StatefulService, Inject } from './stateful-service';
import { ScenesService } from './scenes';
import { SourcesService } from './sources';

// TODO: add Filter type
enum EClipboardItemType { Source }

interface IClipboardItem {
  type: EClipboardItemType;
  id: string;
}

interface IClipboardState {
  items: IClipboardItem[];
}

export class ClipboardService extends StatefulService<IClipboardState> {

  static initialState: IClipboardState = {
    items: []
  };

  @Inject()
  scenesService: ScenesService;

  @Inject()
  sourcesService: SourcesService;


  copy() {
    const source = this.scenesService.activeScene.activeItem;
    if (!source) return;
    this.SET_ITEMS([{ id: source.sourceId, type: EClipboardItemType.Source }]);
  }


  paste() {
    this.state.items.forEach(clipboardItem => {
      const source = this.sourcesService.getSource(clipboardItem.id);
      if (!source) return;
      this.scenesService.activeScene.addSource(source.sourceId);
    });
  }


  hasItems() {
    return !!this.state.items.length;
  }


  @mutation()
  private SET_ITEMS(items: IClipboardItem[]) {
    this.state.items = items;
  }

}
