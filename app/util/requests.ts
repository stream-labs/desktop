// Helper methods for making HTTP requests

/**
 * Passing this function as your first "then" handler when making
 * a request using the fetch API will guarantee that non-success
 * HTTP response codes will result in a rejected promise.  Note that
 * this is NOT the default behavior of the fetch API, so we have to
 * handle it explicitly.
 */
export function handleErrors(response: Response): Response {
  if (response.ok) return response;
  throw new Error(response.statusText);
}
