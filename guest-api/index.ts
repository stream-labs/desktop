/**
 * This script is injected into guest webviews and used by the app
 * to expose small pieces of functionality based on the guest content.
 */

import electron from 'electron';
import {
  IGuestApiRequest,
  IGuestApiResponse,
  IGuestApiCallback,
  EResponseResultProcessing,
} from '../app/services/guest-api';
import uuid from 'uuid/v4';
import fs from 'fs';
import util from 'util';
import mime from 'mime';
import path from 'path';

(() => {
  const readFile = util.promisify(fs.readFile);

  global.eval = function() {
    throw new Error('Eval is disabled for security');
  };

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

  const mainWindowContents = electron.remote.webContents.fromId(
    electron.ipcRenderer.sendSync('getMainWindowWebContentsId'),
  );
  const webContentsId = electron.remote.getCurrentWebContents().id;

  const requestBuffer: IGuestApiRequest[] = [];

  let ready = false;
  let readyFunc: Function;
  const readyPromise = new Promise<boolean>(resolve => {
    readyFunc = () => {
      requestBuffer.forEach(req => {
        mainWindowContents.send('guestApiRequest', req);
      });
      ready = true;
      resolve();
    };
  });

  electron.ipcRenderer.on('guestApiCallback', (event: any, response: IGuestApiCallback) => {
    // This window was likely reloaded and no longer cares about this callback.
    if (!requests[response.requestId]) return;
    requests[response.requestId].callbacks[response.callbackId](...response.args);
  });

  electron.ipcRenderer.on('guestApiResponse', async (event: any, response: IGuestApiResponse) => {
    if (!requests[response.id]) return;

    let result: any;

    // Perform any processing on the result if required
    if (response.resultProcessing === EResponseResultProcessing.File) {
      result = await readFile(response.result).then(data => {
        const parsed = path.parse(response.result);
        return new File([data], parsed.base, { type: mime.getType(parsed.ext) });
      });
    } else {
      result = response.result;
    }

    if (response.error) {
      requests[response.id].reject(result);
    } else {
      requests[response.id].resolve(result);
    }

    // Delete the request object if there aren't any callbacks
    // to avoid leaking too much memory.
    if (Object.keys(requests[response.id].callbacks).length === 0) {
      delete requests[response.id];
    }
  });

  electron.ipcRenderer.on('guestApiReady', () => readyFunc());

  /**
   * Returns a proxy rooted at the given path
   * @param path the current path
   */
  function getProxy(path: string[] = []): any {
    return new Proxy(() => {}, {
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
          callbacks: {},
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
              id: callbackId,
            };
          }

          return arg;
        });

        const apiRequest: IGuestApiRequest = {
          webContentsId,
          id: requestId,
          methodPath: path,
          args: mappedArgs,
        };

        if (ready) {
          mainWindowContents.send('guestApiRequest', apiRequest);
        } else {
          requestBuffer.push(apiRequest);
        }

        return promise;
      },
    });
  }

  global['streamlabsOBS'] = getProxy();
})();
