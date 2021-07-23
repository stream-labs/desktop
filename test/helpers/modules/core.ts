import { getContext } from '../spectron';
import { sleep } from '../sleep';

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
  return select(`button=${buttonText}`);
}

// CLICK SHORTCUTS

export async function click(selectorOrEl: TSelectorOrEl) {
  await (await select(selectorOrEl)).click();
}

export async function clickIfDisplayed(selectorOrEl: TSelectorOrEl) {
  await sleep(500);
  if (await isDisplayed(selectorOrEl)) {
    await click(selectorOrEl);
  }
}

export async function clickText(text: string) {
  await (await select(`*=${text}`)).click();
}

export async function clickButton(buttonText: string) {
  const $button = await selectButton(buttonText);
  await $button.click();
}

export async function clickTab(tabText: string) {
  await click(`div[role="tab"]=${tabText}`);
}

// OTHER SHORTCUTS

export async function isDisplayed(selectorOrEl: TSelectorOrEl) {
  return await (await select(selectorOrEl)).isDisplayed();
}

export async function waitForDisplayed(
  selectorOrEl: TSelectorOrEl,
  options?: WebdriverIO.WaitForOptions,
) {
  await (await select(selectorOrEl)).waitForDisplayed(options);
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

export async function focusWindow(winId: string): Promise<boolean> {
  const client = await getClient();
  const count = await getClient().getWindowCount();
  for (let i = 0; i < count; i++) {
    await client.windowByIndex(i);
    const url = await client.getUrl();
    if (url.includes(`windowId=${winId}`)) return true;
  }
  return false;
}

export async function focusChild() {
  return focusWindow('child');
}

export async function focusMain() {
  return focusWindow('main');
}

export async function useWindow<TCallbackResult>(
  targetWinId: string,
  cb: () => Promise<TCallbackResult>,
): Promise<TCallbackResult> {
  const currentWinId = await getFocusedWindowId();
  const shouldChangeFocus = currentWinId !== targetWinId;
  if (shouldChangeFocus) await focusWindow(targetWinId);
  const result = await cb();
  if (shouldChangeFocus) await focusWindow(currentWinId);
  return result;
}

export async function useMainWindow<TCallbackResult>(cb: () => Promise<TCallbackResult>) {
  return useWindow('main', cb);
}

export async function useChildWindow<TCallbackResult>(cb: () => Promise<TCallbackResult>) {
  return useWindow('child', cb);
}
