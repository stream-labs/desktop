import { getResource } from '../core';
import { UserService } from '../user';
import { IPlatformRequest, TPlatform, getPlatformService } from './index';

export interface IPlatformResponse<TResult = unknown> {
  ok: boolean;
  url: string;
  status: number;
  result: TResult;
  message: string;
}

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
  return response.ok
    ? result
    : Promise.reject({ result, message: status, ...serializedResponse } as IPlatformResponse);
}

/**
 * make a request to the platform API
 * ensure correct headers for each platform and retry fetching in case
 * if the token has been outdated
 * @param useToken true|false or a token string
 */
export async function platformRequest<T = unknown>(
  platform: TPlatform,
  reqInfo: IPlatformRequest | string,
  useToken: boolean | string = false,
): Promise<T> {
  const req: IPlatformRequest = typeof reqInfo === 'string' ? { url: reqInfo } : reqInfo;
  const platformService = getPlatformService(platform);

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
export function platformAuthorizedRequest<T = unknown>(
  platform: TPlatform,
  req: IPlatformRequest | string,
): Promise<T> {
  return platformRequest(platform, req, true);
}
