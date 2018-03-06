// Helper methods for making HTTP requests

/**
 * Passing this function as your first "then" handler when making
 * a request using the fetch API will guarantee that non-success
 * HTTP response codes will result in a rejected promise.  Note that
 * this is NOT the default behavior of the fetch API, so we have to
 * handle it explicitly.
 */
export function handleErrors(response: Response): Promise<Response> {
  if (response.ok) return Promise.resolve(response);
  return Promise.reject(response);
}

export function requiresToken() {
  return (target: any, methodName: string, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    return {
      ...descriptor,
      value(...args: any[]) {
        return original.apply(target.constructor.instance, args)
        .catch((error: Response) => {
          if (error.status === 401) {
            return target.fetchNewToken().then(() => {
              return original.apply(target.constructor.instance, args);
            });
          }
          return Promise.reject(error);
        });
      }
    };
  };
}
