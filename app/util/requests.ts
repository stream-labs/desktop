// Helper methods for making HTTP requests

import fs from 'fs';
import humps from 'humps';

/**
 * Passing this function as your first "then" handler when making
 * a request using the fetch API will guarantee that non-success
 * HTTP response codes will result in a rejected promise.  Note that
 * this is NOT the default behavior of the fetch API, so we have to
 * handle it explicitly.
 */
export const handleResponse = (response: Response): Promise<any> => {
  if (response.ok) return response.json();
  return response.json().then(json => Promise.reject(json));
};

export const handleErrors = (response: Response): Promise<any> => {
  if (response.ok) return Promise.resolve(response);
  return response.json().then(json => Promise.reject(json));
};

/**
 * transforms response keys to lowerCamelCase
 * helps to keep consistent code style in the project
 */
export function camelize(response: Response): Promise<any> {
  return new Promise(resolve => {
    return response.json().then(json => {
      resolve(humps.camelizeKeys(json));
    });
  });
}

export function requiresToken() {
  return (target: any, methodName: string, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    return {
      ...descriptor,
      value(...args: any[]) {
        return original.apply(target.constructor.instance, args).catch((error: Response) => {
          if (error.status === 401) {
            return target.fetchNewToken().then(() => {
              return original.apply(target.constructor.instance, args);
            });
          }
          return Promise.reject(error);
        });
      },
    };
  };
}

/**
 * Generates authorized headers per the OAuth standard.  If headers
 * are not passed, new headers will be generated.
 * @param token the OAuth access token
 * @param headers headers to append to
 */
export function authorizedHeaders(token: string, headers = new Headers()): Headers {
  headers.append('Authorization', `Bearer ${token}`);
  return headers;
}

export async function downloadFile(srcUrl: string, dstPath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    return fetch(srcUrl)
      .then(resp => (resp.ok ? Promise.resolve(resp) : Promise.reject(resp)))
      .then(({ body }: { body: ReadableStream }) => {
        const reader = body.getReader();
        let result = new Uint8Array(0);
        const readStream = ({ done, value }: { done: boolean; value: Uint8Array }) => {
          if (done) {
            fs.writeFileSync(dstPath, result);
            resolve();
          } else {
            result = concatUint8Arrays(result, value);
            reader.read().then(readStream);
          }
        };
        return reader.read().then(readStream);
      });
  });
}

function concatUint8Arrays(a: Uint8Array, b: Uint8Array) {
  const c = new Uint8Array(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
}

export const isUrl = (x: string): boolean => !!x.match(/^https?:/);
