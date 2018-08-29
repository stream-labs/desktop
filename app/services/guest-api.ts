import { Service } from 'services/service';
import uuid from 'uuid/v4';
import electron from 'electron';

/**
 * Shared message interchange format
 */
export interface IGuestApiRequest {
  id: string;
  webContentsId: number;
  methodPath: string[];
  args: any[];
}

export interface IGuestApiResponse {
  id: string;
  error: boolean;
  result: any;
}

export interface IGuestApiCallback {
  requestId: string;
  callbackId: string;
  args: any[];
}

type RequestHandlerMethod = (...args: any[]) => Promise<any>;

/**
 * A dictionary of functions to expose to the guest content
 */
export interface IRequestHandler {
  [key: string]: RequestHandlerMethod | IRequestHandler;
}

/**
 * This class allows injection of functions into webviews.
 */
export class GuestApiService extends Service {

  handlers: Dictionary<Function> = {};

  init() {
    electron.ipcRenderer.on('guestApiRequest', (event: Electron.Event, request: IGuestApiRequest) => {
      const { webContentsId } = request;

      if (this.handlers[webContentsId]) {
        this.handlers[webContentsId](request);
      } else {
        console.error(`Received guest API request from unregistered webContents ${webContentsId}`);
      }
    });
  }

  /**
   * Exposes the passed functions to the webview.  You should be careful
   * what functions you expose, as the caller is considered un-trusted.
   * @param webContentsId the webContents id of the target webview
   * @param requestHandler an object with the API you want to expose
   */
  exposeApi(webContentsId: number, requestHandler: IRequestHandler) {
    // Do not expose an API twice for the same webview
    if (this.handlers[webContentsId]) return;

    // To avoid leaks, automatically unregister this API when the webContents
    // is destroyed.
    const webContents = electron.remote.webContents.fromId(webContentsId)
    webContents.on('destroyed', () => {
      console.log('Destroying API for webcontents', webContentsId);
      delete this.handlers[webContentsId];
    });

    this.handlers[webContentsId] = (request: IGuestApiRequest) => {
      const contents = electron.remote.webContents.fromId(webContentsId);

      const mappedArgs = request.args.map(arg => {
        const isCallbackPlaceholder = (typeof arg === 'object') && arg && arg.__guestApiCallback;

        if (isCallbackPlaceholder) {
          return (...args: any[]) => {
            const callbackObj: IGuestApiCallback = {
              requestId: request.id,
              callbackId: arg.id,
              args
            };

            this.safeSend(contents, 'guestApiCallback', callbackObj);
          };
        }

        return arg;
      });

      const method = this.getMethodFromPath(requestHandler, request.methodPath);

      if (!method) {
        // The path requested does not exist
        const response: IGuestApiResponse = {
          id: request.id,
          error: true,
          result: `Error: The function ${request.methodPath.join('.')} does not exist!`
        };
        this.safeSend(contents, 'guestApiResponse', response);
        return;
      }

      method(...mappedArgs)
        .then(result => {
          const response: IGuestApiResponse = {
            id: request.id,
            error: false,
            result
          };

          this.safeSend(contents, 'guestApiResponse', response);
        })
        .catch(rawResult => {
          const result = rawResult instanceof Error ? rawResult.message : rawResult;

          const response: IGuestApiResponse = {
            id: request.id,
            error: true,
            result
          };

          this.safeSend(contents, 'guestApiResponse', response);
        });
    }
  }

  private safeSend(contents: Electron.WebContents, channel: string, msg: any) {
    if (!contents.isDestroyed()) {
      contents.send(channel, msg);
    }
  }

  private getMethodFromPath(handler: IRequestHandler | RequestHandlerMethod, path: string[]): RequestHandlerMethod {
    if (!handler) return;

    if (path.length === 0) {
      if (handler instanceof Function) return handler;
      return;
    }

    // This is an extra level of security that ensures any key being
    // accessed is actually an enumerable property on the object and
    // not something dangerous.
    if (!handler.propertyIsEnumerable(path[0])) return;

    return this.getMethodFromPath(handler[path[0]], path.slice(1));
  }
}
