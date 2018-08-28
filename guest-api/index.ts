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

  /**
   * Returns a proxy rooted at the given path
   * @param path the current path
   */
  function getProxy(path: string[] = []): any {
    return new Proxy(
      () => {},
      {
        get(target, key) {
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
            methodPath: path,
            args: mappedArgs
          };

          electron.ipcRenderer.sendToHost('guestApiRequest', apiRequest);

          return promise;
        }
      }
    );
  }

  global['streamlabsOBS'] = getProxy();
})();
