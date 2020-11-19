import { focusMain, focusWorker, TExecutionContext } from './index';

/**
 * install the fetch-mock lib
 */
export async function installFetchMock(t: TExecutionContext) {
  await focusWorker(t);
  await t.context.app.webContents.executeJavaScript(`
    window.fetchMock = require('fetch-mock');
  `);
}

/**
 * mock fetch requests
 */
export async function fetchMock(t: TExecutionContext, regExp: RegExp, code: number) {
  await focusWorker(t);
  await t.context.app.webContents.executeJavaScript(`
    fetchMock.mock(${regExp.toString()}, ${code});
  `);
}

/**
 * reset all mocks
 */
export async function resetFetchMock(t: TExecutionContext) {
  await focusWorker(t);
  await t.context.app.webContents.executeJavaScript(`
    fetchMock.reset();
  `);
}
