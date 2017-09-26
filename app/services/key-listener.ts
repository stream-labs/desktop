// This service handles listening to keypresses
// with node-libuiohook.  This is a super simple
// service, and really just serves to ensure that
// the module is required properly and to define
// a typed interface around it.

import { Service } from './service';
import electron from 'electron';

export type TKeyEventType = 'registerKeydown' | 'registerKeyup';


interface INodeLibuiohookBinding {
  callback: () => void;
  eventType: TKeyEventType;
  key: string; // Is key code
  modifiers: {
    alt: boolean;
    ctrl: boolean;
    shift: boolean;
    meta: boolean;
  };
}


/**
 * Node libuiohook is a native addon for binding global hotkeys
 */
interface INodeLibuiohook {
  registerCallback(binding: INodeLibuiohookBinding): boolean;
  unregisterAllCallbacks(): void;
}


export class KeyListenerService extends Service {

  private libuiohook: INodeLibuiohook;

  init() {
    this.libuiohook = electron.remote.require('node-libuiohook');
  }

  unregisterAll() {
    this.libuiohook.unregisterAllCallbacks();
  }

  register(binding: INodeLibuiohookBinding) {
    // An empty string is not valid
    if (!binding.key) return;

    this.libuiohook.registerCallback(binding);
  }

}
