import { Service } from './service';
import Utils from './utils';
import { AppService } from './app';
import { Inject } from '../util/injector';

type TShortcutHandler = (event: KeyboardEvent) => void;

// Only works on singletons
export function shortcut(key: string) {
  return function(target: any, methodName: string, descriptor: PropertyDescriptor) {
    const shortcutsService: ShortcutsService = ShortcutsService.instance;

    shortcutsService.registerShortcut(key, e => target.constructor.instance[methodName](e));
  };
}

export class ShortcutsService extends Service {
  shortcuts: Map<string, TShortcutHandler> = new Map();

  @Inject() private appService: AppService;

  init() {
    document.addEventListener('keydown', e => {
      // ignore key events from webview
      if ((e.target as HTMLElement).tagName === 'WEBVIEW') return;

      // ignore key if app in the loading state
      if (this.appService.state.loading) return;

      const shortcutName = ShortcutsService.getShortcutName(e);
      const handler = this.shortcuts.get(shortcutName);

      if (handler) handler(e);
    });
  }

  registerShortcut(key: string, handler: TShortcutHandler) {
    // We only register shortcuts in the main window for now
    if (Utils.isChildWindow()) return;

    this.shortcuts.set(
      key
        .split(' ')
        .join('')
        .toUpperCase(),
      handler,
    );
  }

  private static getShortcutName(event: KeyboardEvent): string {
    const keys: string[] = [];
    if (event.ctrlKey) keys.push('Ctrl');
    if (event.shiftKey) keys.push('Shift');
    if (event.altKey) keys.push('Alt');
    keys.push(event.key);
    return keys.join('+').toUpperCase();
  }
}
