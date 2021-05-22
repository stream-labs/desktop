import { Service } from './core/service';
import Utils from './utils';
import { AppService } from './app';
import { Inject } from './core/injector';
import { InitAfter } from './core';
import { OS, getOS } from 'util/operating-systems';
import { NavigationService } from './navigation';

type TShortcutHandler = () => void;

// Only works on singletons
export function shortcut(key: string) {
  return function (target: any, methodName: string, descriptor: PropertyDescriptor) {
    const shortcutsService: ShortcutsService = ShortcutsService.instance;

    shortcutsService.registerShortcut(key, () => target.constructor.instance[methodName]());
  };
}

@InitAfter('AppService')
export class ShortcutsService extends Service {
  shortcuts: Map<string, TShortcutHandler> = new Map();

  @Inject() private appService: AppService;
  @Inject() private navigationService: NavigationService;

  init() {
    // Shortcuts are handled via the application menu on Mac OS
    // TODO: Merge the windows and mac systems
    if (getOS() === OS.Mac) return;

    document.addEventListener('keydown', e => {
      // ignore key events from webview
      if ((e.target as HTMLElement).tagName === 'WEBVIEW') return;

      // All shortcuts only work on the editor tab
      if (this.navigationService.state.currentPage !== 'Studio') return;

      // ignore key if app in the loading state
      if (this.appService.state.loading) return;

      const shortcutName = ShortcutsService.getShortcutName(e);
      const handler = this.shortcuts.get(shortcutName);

      if (handler) handler();
    });
  }

  registerShortcut(key: string, handler: TShortcutHandler) {
    // We only register shortcuts in the main window for now
    if (Utils.isChildWindow()) return;

    this.shortcuts.set(key.split(' ').join('').toUpperCase(), handler);
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
