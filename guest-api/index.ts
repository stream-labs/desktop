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
  let idCounter = 0;

  const getUniqueId = () => {
    idCounter += 1;
    return idCounter.toString();
  };

  let ready: Function;
  const readyPromise = new Promise<boolean>(resolve => {
    ready = resolve;
  });

  electron.ipcRenderer.on(
    'guestApiCallback',
    (event: any, response: IGuestApiCallback) => {
      requests[response.requestId].callbacks[response.callbackId](...response.args);
    }
  );

  electron.ipcRenderer.on(
    'guestApiResponse',
    (event: any, response: IGuestApiResponse) => {
      if (response.error) {
        requests[response.id].reject(response.result);
      } else {
        requests[response.id].resolve(response.result);
      }
    }
  );

  electron.ipcRenderer.on(
    'guestApiReady',
    () => ready()
  );

  // TODO: Assuming the main window is always contents id 1 may not be safe.
  const mainWindowContents = electron.remote.webContents.fromId(1);
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
          const requestId = getUniqueId();
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
              const callbackId = getUniqueId();

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
