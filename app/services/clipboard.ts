import { mutation, StatefulService } from './stateful-service';
import { ScenesService } from './scenes';
import { SourcesService } from './sources';
import { shortcut } from './shortcuts';
import { Inject } from '../util/injector';

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


  @shortcut('Ctrl+C')
  copy() {
    const source = this.scenesService.activeScene.activeItem;
    if (!source) return;
    this.SET_ITEMS([{ id: source.sourceId, type: EClipboardItemType.Source }]);
  }


  @shortcut('Ctrl+V')
  pasteReference() {
    this.state.items.forEach(clipboardItem => {
      const source = this.sourcesService.getSource(clipboardItem.id);
      if (!source) return;
      this.scenesService.activeScene.addSource(source.sourceId);
    });
  }


  pasteDuplicate() {
    this.state.items.forEach(clipboardItem => {
      const source = this.sourcesService.getSource(clipboardItem.id);
      if (!source) return;
      const duplicatedSource = source.duplicate();
      if (!duplicatedSource) {
        alert(`Unable to duplicate ${source.name}`);
        return;
      }
      this.scenesService.activeScene.addSource(duplicatedSource.sourceId);
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
