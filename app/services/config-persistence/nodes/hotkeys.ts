import { ArrayNode } from './array-node';
import { HotkeysService, IHotkey, Hotkey } from '../../hotkeys';
import { Inject } from '../../../util/injector';


interface IContext {
  sceneId?: string;
  sceneItemId?: string;
  sourceId?: string;
}

export class HotkeysNode extends ArrayNode<IHotkey, IContext, Hotkey> {

  schemaVersion = 1;

  @Inject()
  private hotkeysService: HotkeysService;

  getItems(context: IContext = {}): Hotkey[] {
    if (context.sceneId) {
      return this.hotkeysService.getSceneHotkeys(context.sceneId);
    } else if (context.sceneItemId) {
      return this.hotkeysService.getSceneItemHotkeys(context.sceneItemId);
    } else if (context.sourceId) {
      return this.hotkeysService.getSourceHotkeys(context.sourceId);
    } else {
      return this.hotkeysService.getGeneralHotkeys();
    }
  }


  saveItem(hotkey: Hotkey, context: IContext): IHotkey {
    const hotkeyObj = hotkey.getModel();
    Object.keys(context).forEach(key => delete hotkeyObj[key]);
    return hotkeyObj;
  }


  loadItem(obj: IHotkey, context: IContext) {
    this.hotkeysService.addHotkey({ ...obj, ...context });
  }

}
