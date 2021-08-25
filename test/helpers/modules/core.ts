/*
 * The core module provides methods for the most frequent actions
 */

import { getContext, TExecutionContext } from '../spectron';

export type TSelectorOrEl = string | WebdriverIO.Element;

export function getClient() {
  return getContext().context.app.client;
}

// SELECT SHORTCUTS

/**
 * A shortcut for client.$()
 */
export async function select(selectorOrEl: TSelectorOrEl): Promise<WebdriverIO.Element> {
  if (typeof selectorOrEl === 'string') {
    return getClient().$(selectorOrEl);
  }
  return selectorOrEl;
}

export function selectButton(buttonText: string) {
  return Promise.race([
    waitForDisplayed(`button=${buttonText}`),
    waitForDisplayed(`span=${buttonText}`),
  ]);
}

// CLICK SHORTCUTS

export async function click(selectorOrEl: TSelectorOrEl, options?: WebdriverIO.ClickOptions) {
  const $el = await select(selectorOrEl);
  await $el.waitForClickable();
  await $el.click(options);
}

export async function clickIfDisplayed(selectorOrEl: TSelectorOrEl) {
  if (await isDisplayed(selectorOrEl)) {
    await click(selectorOrEl);
  }
}

export async function clickText(text: string) {
  await (await select(`*=${text}`)).click();
}

export async function clickButton(buttonText: string) {
  const $button = await selectButton(buttonText);
  await click($button);
}

export async function clickTab(tabText: string) {
  await click(`div[role="tab"]=${tabText}`);
}

// OTHER SHORTCUTS

export async function isDisplayed(
  selectorOrEl: TSelectorOrEl,
  waitForOptions?: WebdriverIO.WaitForOptions,
) {
  if (waitForOptions) {
    try {
      await waitForDisplayed(selectorOrEl, waitForOptions);
      return true;
    } catch (e) {
      return false;
    }
  }
  return await (await select(selectorOrEl)).isDisplayed();
}

export async function waitForDisplayed(
  selectorOrEl: TSelectorOrEl,
  options?: WebdriverIO.WaitForOptions,
) {
  const $el = await select(selectorOrEl);
  await $el.waitForDisplayed(options);
  return $el;
}

export async function waitForClickable(
  selectorOrEl: TSelectorOrEl,
  options?: WebdriverIO.WaitForOptions,
) {
  await (await select(selectorOrEl)).waitForClickable(options);
}

export function waitForText(text: string) {
  return waitForDisplayed(`*="${text}"`);
}

export async function waitForEnabled(
  selectorOrEl: TSelectorOrEl,
  options?: WebdriverIO.WaitForOptions,
) {
  await (await select(selectorOrEl)).waitForEnabled(options);
}

// WINDOW FOCUS

export async function getFocusedWindowId(): Promise<string> {
  const url = await getClient().getUrl();
  return url.match(/windowId=main$/) ? 'main' : 'child';
}

export async function focusWindow(winIdOrRegexp: string | RegExp): Promise<boolean> {
  const client = await getClient();
  const count = await getClient().getWindowCount();
  for (let i = 0; i < count; i++) {
    await client.windowByIndex(i);
    const url = await client.getUrl();
    if (typeof winIdOrRegexp === 'string') {
      const winId = winIdOrRegexp;
      if (url.includes(`windowId=${winId}`)) return true;
    } else {
      const regex = winIdOrRegexp as RegExp;
      if (url.match(regex)) return true;
    }
  }
  return false;
}

export async function focusChild() {
  return focusWindow('child');
}

export async function focusMain() {
  return focusWindow('main');
}

export async function closeWindow(winId: string) {
  await useWindow(winId, async () => {
    await getContext().context.app.browserWindow.close();
  });
}

/**
 * Focus the given window and execute a callback
 * Than return focus to the previous window
 */
export async function useWindow<TCallbackResult>(
  targetWinId: string,
  cb: () => Promise<TCallbackResult>,
): Promise<TCallbackResult> {
  const winIdBefore = await getFocusedWindowId();
  if (winIdBefore !== targetWinId) await focusWindow(targetWinId);
  const result = await cb();
  const winIdAfter = await getFocusedWindowId();
  if (winIdBefore !== winIdAfter) await focusWindow(winIdBefore);
  return result;
}

export async function useMainWindow<TCallbackResult>(cb: () => Promise<TCallbackResult>) {
  return useWindow('main', cb);
}

export async function useChildWindow<TCallbackResult>(cb: () => Promise<TCallbackResult>) {
  return useWindow('child', cb);
}

export async function waitForLoader() {
  await (await select('.main-loading')).waitForExist({
    interval: 100, // we need a smaller interval to run tests faster
    timeout: 20000,
    reverse: true,
  });
}
