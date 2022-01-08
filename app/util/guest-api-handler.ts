import electron from 'electron';
import { Subscription, Observable } from 'rxjs';
import uuid from 'uuid/v4';
import * as remote from '@electron/remote';

/**
 * Shared message interchange format
 */
export interface IGuestApiRequest {
  id: string;
  webContentsId: number;
  methodPath: string[];
  args: any[];
}

/**
 * Describes how to treat the contents of the result field
 * on an IGuestApiResponse.
 */
export enum EResponseResultProcessing {
  None = 'none',
  File = 'file',
}

export interface IGuestApiResponse {
  id: string;
  error: boolean;
  result: any;
  resultProcessing: EResponseResultProcessing;
}

export interface IGuestApiCallback {
  requestId: string;
  callbackId: string;
  args: any[];
}

type RequestHandlerMethod = (...args: any[]) => Promise<any>;
type RequestHandlerObservable = Observable<any>;

type RequestHandlerEndpoint = RequestHandlerMethod | RequestHandlerObservable;

/**
 * A dictionary of functions to expose to the guest content
 */
export interface IRequestHandler {
  [key: string]: RequestHandlerEndpoint | IRequestHandler;
}

/**
 * Like a RequestHandler, but each endpoint is denoted by a boolean.
 * This lets the preload script set up the proper structure of the
 * API in the context bridge.
 */
export interface IRequestHandlerSchema {
  [key: string]: boolean | IRequestHandlerSchema;
}

/**
 * Guest API functions that need to return a `File` object to
 * the remote guest can return an instance of this wrapper
 * containing the file path instead.
 */
export class FileReturnWrapper {
  constructor(public filePath: string) {}
}

/**
 * This class allows injection of functions into webviews.
 */
export class GuestApiHandler {
  /**
   * Exposes an API in a guest webcontents (generally a BrowserView)
   * For this to work, the following must be true:
   * - The guest-api.js preload script must have been set up when
   *   creating the WebContents
   * - contextIsolation should be enabled in the webPreferences
   *   options when creating the WebContents
   * - This function must be called before loadURL is called on
   *   the WebContents for the first time.
   * @param targetWebContentsId The webcontents to expose the API in
   * @param api An object containing the API
   */
  exposeApi(targetWebContentsId: number, api: IRequestHandler) {
    const ipcChannel = `guestApiRequest-${uuid()}`;
    const webContents = remote.webContents.fromId(targetWebContentsId);

    // Tracks rxjs subscriptions for this webview so they can be unsubscribed
    let subscriptions: Subscription[] = [];

    // To avoid leaks, automatically unregister this API when the webContents
    // is destroyed.
    webContents.on('destroyed', () => {
      subscriptions.forEach(sub => {
        sub.unsubscribe();
      });
      subscriptions = [];

      electron.ipcRenderer.removeAllListeners(ipcChannel);
    });

    const requestHandler = (request: IGuestApiRequest) => {
      const mappedArgs = this.getMappedArgs(request, webContents);
      const endpoint = this.getEndpointFromPath(api, request.methodPath);

      if (!endpoint) {
        // The path requested does not exist
        this.handleMissingEndpoint(request, webContents);
        return;
      }

      if (endpoint instanceof Observable) {
        subscriptions.push(endpoint.subscribe(mappedArgs[0]));
      } else {
        this.callEndpointMethod(endpoint, mappedArgs, request, webContents);
      }
    };

    electron.ipcRenderer.on(ipcChannel, (event: Electron.Event, request: IGuestApiRequest) => {
      requestHandler(request);
    });

    // This is done via the main process so the injected preload script can
    // request all of this information synchronously and set up the API.
    electron.ipcRenderer.send('guestApi-setInfo', {
      webContentsId: targetWebContentsId,
      schema: this.getSchema(api),
      hostWebContentsId: remote.getCurrentWebContents().id,
      ipcChannel,
    });
  }

  private getSchema(api: IRequestHandler): IRequestHandlerSchema {
    const newObj: IRequestHandlerSchema = {};

    Object.keys(api).forEach(key => {
      if (api[key] instanceof Function || api[key] instanceof Observable) {
        newObj[key] = true;
      } else {
        newObj[key] = this.getSchema(api[key] as IRequestHandler);
      }
    });

    return newObj;
  }

  /**
   * Extracts mapped args from a request.  Placeholders for callbacks
   * will be replaced with actual functions.
   * @param request the request object
   * @param contents the calling webcontents
   */
  private getMappedArgs(request: IGuestApiRequest, contents: electron.WebContents): any[] {
    return request.args.map(arg => {
      const isCallbackPlaceholder = typeof arg === 'object' && arg && arg.__guestApiCallback;

      if (isCallbackPlaceholder) {
        return (...args: any[]) => {
          const callbackObj: IGuestApiCallback = {
            args,
            requestId: request.id,
            callbackId: arg.id,
          };

          this.safeSend(contents, 'guestApiCallback', callbackObj);
        };
      }

      return arg;
    });
  }

  /**
   * Sends a message stating that the requested endpoint does not exist
   * @param request the request object
   * @param contents the calling webcontents
   */
  private handleMissingEndpoint(request: IGuestApiRequest, contents: electron.WebContents) {
    const response: IGuestApiResponse = {
      id: request.id,
      error: true,
      result: `Error: The function ${request.methodPath.join('.')} does not exist!`,
      resultProcessing: EResponseResultProcessing.None,
    };
    this.safeSend(contents, 'guestApiResponse', response);
  }

  /**
   * Call an endpoint method, and handle proxying the response
   * back to the calling webcontents.
   * @param method The endpoint method to call
   * @param args The args to call with
   * @param request The request object
   * @param contents The calling webcontents
   */
  private callEndpointMethod(
    method: RequestHandlerMethod,
    args: any[],
    request: IGuestApiRequest,
    contents: electron.webContents,
  ) {
    method(...args)
      .then(result => {
        let response: IGuestApiResponse;

        if (result instanceof FileReturnWrapper) {
          response = {
            result: result.filePath,
            resultProcessing: EResponseResultProcessing.File,
            id: request.id,
            error: false,
          };
        } else {
          response = {
            result,
            resultProcessing: EResponseResultProcessing.None,
            id: request.id,
            error: false,
          };
        }

        this.safeSend(contents, 'guestApiResponse', response);
      })
      .catch(rawResult => {
        const result = rawResult instanceof Error ? rawResult.message : rawResult;

        const response: IGuestApiResponse = {
          result,
          resultProcessing: EResponseResultProcessing.None,
          id: request.id,
          error: true,
        };

        this.safeSend(contents, 'guestApiResponse', response);
      });
  }

  private safeSend(contents: Electron.WebContents, channel: string, msg?: any) {
    if (contents && !contents.isDestroyed()) {
      contents.send(channel, msg);
    }
  }

  /**
   * Traverses a request handler looking for an endpoint at the provided path
   * @param handler the handler containing the endpoints
   * @param path an array of keys describing the location of the endpoint
   */
  private getEndpointFromPath(handler: IRequestHandler, path: string[]): RequestHandlerEndpoint {
    if (!handler) return;
    if (path.length === 0) return;

    // This is an extra level of security that ensures any key being
    // accessed is actually an enumerable property on the object and
    // not something dangerous.
    if (!handler.propertyIsEnumerable(path[0])) return;

    if (path.length === 1) {
      const endpoint = handler[path[0]];

      // Make sure this actually looks like an endpoint
      if (endpoint instanceof Function || endpoint instanceof Observable) return endpoint;
      return;
    }

    return this.getEndpointFromPath(handler[path[0]] as IRequestHandler, path.slice(1));
  }
}
