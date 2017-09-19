// This service handles listening to keypresses
// with node-libuiohook.  This is a super simple
// service, and really just serves to ensure that
// the module is required properly and to define
// a typed interface around it.

import { Service } from './service';
import electron from 'electron';
import { capitalize } from 'lodash';

export type TKeyEventType = 'registerKeydown' | 'registerKeyup';

// This is a subset of the full API, but we shouldn't be calling
// anything other than these two methods here.
interface INodeLibuiohook {
  registerCallback(accelerator: string, callback: () => void, eventType: TKeyEventType): boolean;
  unregisterAllCallbacks(): void;
}

export class KeyListenerService extends Service {

  private libuiohook: INodeLibuiohook;

  mounted() {
    this.libuiohook = electron.remote.require('node-libuiohook');
  }

  unregisterAll() {
    this.libuiohook.unregisterAllCallbacks();
  }

  register(accelerator: string, callback: () => void, eventType: TKeyEventType) {
    this.libuiohook.registerCallback(
      this.normalizeAccelerator(accelerator),
      callback,
      eventType
    );
  }

  private normalizeAccelerator(accelerator: string) {
    let [modifier, key] = accelerator.split('+');

    if (!key) {
      key = modifier;
      modifier = null;
    }

    if (modifier === 'Ctrl' || modifier === 'Control' || modifier === 'Command') {
      modifier = 'CommandOrControl';
    }

    key = capitalize(key);

    return [modifier, key].join('+');
  }

}
