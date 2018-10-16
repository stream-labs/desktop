/**
 * This script is injected into guest webviews and used by the app
 * to expose small pieces of functionality based on the guest content.
 */

import electron from 'electron';
import {
  IGuestApiRequest,
  IGuestApiResponse,
  IGuestApiCallback
} from '../app/services/guest-api';
import uuid from 'uuid/v4';

(() => {
  global.eval = function() {
    throw new Error('Eval is disabled for security');
  }

  interface IRequest {
    resolve: (val: any) => void;
    reject: (val: any) => void;
    callbacks: {
      [callbackId: string]: Function;
    };
  }

  const requests: {
    [requestId: string]: IRequest;
  } = {};

  let ready: Function;
  const readyPromise = new Promise<boolean>(resolve => {
    ready = resolve;
  });

  electron.ipcRenderer.on(
    'guestApiCallback',
    (event: any, response: IGuestApiCallback) => {
      // This window was likely reloaded and no longer cares about this callback.
      if (!requests[response.requestId]) return;
      requests[response.requestId].callbacks[response.callbackId](...response.args);
    }
  );

  electron.ipcRenderer.on(
    'guestApiResponse',
    (event: any, response: IGuestApiResponse) => {
      if (!requests[response.id]) return;

      if (response.error) {
        requests[response.id].reject(response.result);
      } else {
        requests[response.id].resolve(response.result);
      }

      // Delete the request object if there aren't any callbacks
      // to avoid leaking too much memory.
      if (Object.keys(requests[response.id].callbacks).length === 0) {
        delete requests[response.id];
      }
    }
  );

  electron.ipcRenderer.on(
    'guestApiReady',
    () => ready()
  );

  const mainWindowContents = electron.remote.webContents.fromId(
    electron.ipcRenderer.sendSync('getMainWindowWebContentsId')
  );
  const webContentsId = electron.remote.getCurrentWebContents().id;

  /**
   * Returns a proxy rooted at the given path
   * @param path the current path
   */
  function getProxy(path: string[] = []): any {
    return new Proxy(
      () => {},
      {
        get(target, key) {
          if (key === 'apiReady') {
            return readyPromise;
          }

          return getProxy(path.concat([key.toString()]));
        },

        apply(target, thisArg, args: any[]) {
          const requestId = uuid();
          requests[requestId] = {
            resolve: null,
            reject: null,
            callbacks: {}
          };
          const promise = new Promise((resolve, reject) => {
            requests[requestId].resolve = resolve;
            requests[requestId].reject = reject;
          });
          const mappedArgs = args.map(arg => {
            if (typeof arg === 'function') {
              const callbackId = uuid();

              requests[requestId].callbacks[callbackId] = arg;

              return {
                __guestApiCallback: true,
                id: callbackId
              };
            }

            return arg;
          });

          const apiRequest: IGuestApiRequest = {
            id: requestId,
            webContentsId,
            methodPath: path,
            args: mappedArgs
          };

          mainWindowContents.send('guestApiRequest', apiRequest);

          return promise;
        }
      }
    );
  }

  global['streamlabsOBS'] = getProxy();
})();
