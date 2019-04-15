/**
 * same as handleResponse but passes a Response object instead a response body
 * in the case of Promise rejection
 * @see handleResponse
 */
export function handlePlatformResponse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const result = isJson ? response.json() : response.text();
  return response.ok ? result : Promise.reject(response);
}

export function requiresToken() {
  return (target: any, methodName: string, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    return {
      ...descriptor,
      value(...args: any[]) {
        return original.apply(target.constructor.instance, args).catch((error: Response) => {
          if (!(error instanceof Response)) {
            console.error('Expected Response but got', error);
          }
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
