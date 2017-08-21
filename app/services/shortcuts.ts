import { Service } from './service';
import Utils from './utils';


type TShortcutHandler = (event: KeyboardEvent) => void;


// Only works on singletons
export function shortcut(key: string) {
  return function (target: any, methodName: string, descriptor: PropertyDescriptor) {
    const shortcutsService: ShortcutsService = ShortcutsService.instance;

    shortcutsService.registerShortcut(key, e => target.constructor.instance[methodName](e));
  };
}


export class ShortcutsService extends Service {


  shortcuts: Map<string, TShortcutHandler> = new Map();


  init() {
    document.addEventListener('keydown', e => {
      // TODO: Maybe look at the event target and see if we should ignore it

      const handler = this.shortcuts.get(e.key);

      if (handler) handler(e);
    });
  }


  registerShortcut(key: string, handler: TShortcutHandler) {
    // We only register shortcuts in the main window for now
    if (Utils.isChildWindow()) return;

    this.shortcuts.set(key, handler);
  }

}
