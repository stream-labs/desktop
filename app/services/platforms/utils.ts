import { getResource } from '../core';
import { UserService } from '../user';
import { IPlatformRequest } from './index';
import { async } from 'rxjs/internal/scheduler/async';

/**
 * same as handleResponse but passes a Response object instead a response body
 * in the case of Promise rejection
 * @see handleResponse
 */
export async function handlePlatformResponse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const result = await (isJson ? response.json() : response.text());
  const serializedResponse = { ok: response.ok, url: response.url, status: response.status };
  return response.ok ? result : Promise.reject({ result, ...serializedResponse });
}

/**
 * make a request to the platform API
 * ensure correct headers for each platform and retry fetching in case
 * if the token has been outdated
 * @param useToken true|false or a token string
 */
export async function platformRequest<T = any>(
  reqInfo: IPlatformRequest | string,
  useToken: boolean | string = false,
): Promise<T> {
  const req: IPlatformRequest = typeof reqInfo === 'string' ? { url: reqInfo } : reqInfo;
  const platformService = getResource<UserService>('UserService').getPlatformService();

  // create a request function with required headers
  const requestFn = () => {
    const headers = new Headers(platformService.getHeaders(req, useToken));
    return fetch(new Request(req.url, { ...req, headers })).then(handlePlatformResponse);
  };

  // try to fetch and retry fetching with a new token if the API responds with 401 (unauthorized)
  return requestFn().catch(error => {
    if (useToken && error.status === 401) {
      return platformService.fetchNewToken().then(() => {
        return requestFn();
      });
    }
    return Promise.reject(error);
  });
}

/**
 * Make an authorized request to the platform API
 * This is a shortcut for platformRequest()
 * @see platformRequest
 */
export function platformAuthorizedRequest<T = any>(req: IPlatformRequest | string): Promise<T> {
  return platformRequest(req, true);
}
