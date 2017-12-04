import { Service } from 'services/service';

/**
 * Shared message interchange format
 */
export interface IGuestApiRequest {
  id: string;
  method: string;
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

/**
 * A dictionary of functions to expose to the child window
 */
export interface IRequestHandler {
  [key: string]: (...args: any[]) => Promise<any>;
}

/**
 * This class allows injection of functions into webviews.
 */
export class GuestApiService extends Service {
  /**
   * Exposes the passed functions to the webview.  You should be careful
   * what functions you expose, as the caller is considered un-trusted.
   * @param webview the target webview
   * @param requestHandler an object with the API you want to expose
   */
  exposeApi(webview: Electron.WebviewTag, requestHandler: IRequestHandler) {
    webview.addEventListener('ipc-message', msg => {
      if (msg.channel === 'guestApiRequest') {
        const apiRequest: IGuestApiRequest = msg.args[0];

        const mappedArgs = apiRequest.args.map(arg => {
          const isCallbackPlaceholder = (typeof arg === 'object') && arg && arg.__guestApiCallback;

          if (isCallbackPlaceholder) {
            return (...args: any[]) => {
              const callbackObj: IGuestApiCallback = {
                requestId: apiRequest.id,
                callbackId: arg.id,
                args
              };

              webview.send('guestApiCallback', callbackObj);
            };
          }

          return arg;
        });

        requestHandler[apiRequest.method](...mappedArgs)
          .then(result => {
            const response: IGuestApiResponse = {
              id: apiRequest.id,
              error: false,
              result
            };

            webview.send('guestApiResponse', response);
          })
          .catch(result => {
            const response: IGuestApiResponse = {
              id: apiRequest.id,
              error: true,
              result
            };

            webview.send('guestApiResponse', response);
          });
      }
    });
  }
}
