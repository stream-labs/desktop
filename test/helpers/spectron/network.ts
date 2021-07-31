import { TExecutionContext } from './index';
import { focusWindow } from '../modules/core';

/**
 * install the fetch-mock lib
 */
export async function installFetchMock(t: TExecutionContext) {
  await focusWindow('worker');
  await t.context.app.webContents.executeJavaScript(`
    window.fetchMock = require('fetch-mock');
    0; // Prevent returning a value that cannot be serialized
  `);
}

/**
 * mock fetch requests
 */
export async function fetchMock(t: TExecutionContext, regExp: RegExp, code: number) {
  await focusWindow('worker');
  await t.context.app.webContents.executeJavaScript(`
    fetchMock.mock(${regExp.toString()}, ${code});
    0; // Prevent returning a value that cannot be serialized
  `);
}

/**
 * reset all mocks
 */
export async function resetFetchMock(t: TExecutionContext) {
  await focusWindow('worker');
  await t.context.app.webContents.executeJavaScript(`
    fetchMock.reset();
    0; // Prevent returning a value that cannot be serialized
  `);
}
