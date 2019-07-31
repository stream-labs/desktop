import { focusMain, TExecutionContext } from './index';

/**
 * Replaces the `fetch` method to simulate network issues
 */
export async function setResponseCode(t: TExecutionContext, code: number) {
  await t.context.app.webContents.executeJavaScript(`
    window.originalFetch = window.fetch;
    window.fetch = (...args) => {
      const resp = new Proxy(new Response(), { 
        get: (obj, prop) => {
          const patch = {
             ok: false,
             status: ${code},
             text: () => Promise.resolve(''),
             json: () => Promise.resolve({})
          }
          return patch[prop] || obj[prop]} 
        })
      return Promise.resolve(resp)
    };
  `);
}

export async function resetResponseCode(t: TExecutionContext) {
  await t.context.app.webContents.executeJavaScript(`
    window.fetch = window.originalFetch;
  `);
}
