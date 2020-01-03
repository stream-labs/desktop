// Helper methods for making HTTP requests
import request from 'request';
import fs from 'fs';
import crypto from 'crypto';
import humps from 'humps';

/**
 * Passing this function as your first "then" handler when making
 * a request using the fetch API will guarantee that non-success
 * HTTP response codes will result in a rejected promise.  Note that
 * this is NOT the default behavior of the fetch API, so we have to
 * handle it explicitly.
 */
export const handleResponse = (response: Response): Promise<any> => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const result = isJson ? response.json() : response.text();
  return response.ok ? result : result.then(r => Promise.reject(r));
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
  return new Promise<void>(resolve => {
    return fetch(srcUrl)
      .then(resp => (resp.ok ? Promise.resolve(resp) : Promise.reject(resp)))
      .then(({ body }: { body: ReadableStream }) => {
        const reader = body.getReader();
        const fileStream = fs.createWriteStream(dstPath);

        const readStream = ({ done, value }: { done: boolean; value: Uint8Array }) => {
          if (done) {
            fileStream.end();
            resolve();
          } else {
            fileStream.write(value);
            reader.read().then(readStream);
          }
        };

        return reader.read().then(readStream);
      });
  });
}

export const isUrl = (x: string): boolean => !!x.match(/^https?:/);

export function getChecksum(filePath: string) {
  return new Promise<string>((resolve, reject) => {
    const file = fs.createReadStream(filePath);
    const hash = crypto.createHash('md5');

    file.on('data', data => hash.update(data));
    file.on('end', () => resolve(hash.digest('hex')));
    file.on('error', e => reject(e));
  });
}
