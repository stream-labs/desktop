import { TExecutionContext } from './index';

/**
 * click to the element inside a webview
 * @example
 *  click(t, 'webview', '.my-button')
 */
export async function click(t: TExecutionContext, webviewSelector: string, itemSelector: string) {
  return t.context.app.webContents.executeJavaScript(
    `document.querySelector('${webviewSelector}').executeJavaScript('document.querySelector("${itemSelector}").click()')`,
  );
}
