import { getContext } from '../spectron';

// export function useContext(t: TExecutionContext) {
//
//   // CLICK SHORTCUTS
//
//   async function click(selector: string) {
//     await (await t.context.app.client.$(selector)).click();
//   }
//
//   async function clickButton(buttonText: string) {
//     await click(`button=${buttonText}`);
//   }
//
//   async function clickTab(tabText: string) {
//     await click(`div[role="tab"]=${tabText}`);
//   }
//
//   const client = t.context.app.client;
//
//   async function getFocusedWindowId(): Promise<string> {
//     const url = await t.context.app.client.getUrl();
//     return url.match(/windowId=main$/) ? 'main' : 'child';
//   }
//
//   async function focusWindow(winId: string): Promise<boolean> {
//     const count = await t.context.app.client.getWindowCount();
//     for (let i = 0; i < count; i++) {
//       await t.context.app.client.windowByIndex(i);
//       const url = await t.context.app.client.getUrl();
//       if (url.includes(`windowId=${winId}`)) return true;
//     }
//     return false;
//   }
//
//   async function focusChild() {
//     return focusWindow('child');
//   }
//
//   async function focusMain() {
//     return focusWindow('main');
//   }
//
//   async function useWindow(targetWinId: string, cb: () => Promise<unknown>) {
//     const currentWinId = await getFocusedWindowId();
//     const shouldChangeFocus = currentWinId !== targetWinId;
//     if (shouldChangeFocus) await focusWindow(targetWinId);
//     await cb();
//     if (shouldChangeFocus) await focusWindow(currentWinId);
//   }
//
//   async function useMainWindow(cb: () => Promise<unknown>) {
//     return useWindow('main', cb);
//   }
//
//   async function useChildWindow(cb: () => Promise<unknown>) {
//     return useWindow('child', cb);
//   }
//
//   return {
//     click,
//     clickButton,
//     clickTab,
//     client,
//     focusMain,
//     focusChild,
//     useMainWindow,
//     useChildWindow,
//   };
// }

export function getClient() {
  return getContext().context.app.client;
}

// SELECT SHORTCUTS

export function select(selector: string) {
  return getContext().context.app.client.$(selector);
}

export function selectButton(buttonText: string) {
  return select(`button=${buttonText}`);
}

// CLICK SHORTCUTS

export async function click(selector: string) {
  await (await select(selector)).click();
}

export async function clickButton(buttonText: string) {
  const $button = await selectButton(buttonText);
  await $button.click();
}

export async function clickTab(tabText: string) {
  await click(`div[role="tab"]=${tabText}`);
}

// OTHER SHORTCUTS

export async function isDisplayed(selector: string) {
  return await (await select(selector)).isDisplayed();
}

export async function waitForDisplayed(selector: string, options?: WebdriverIO.WaitForOptions) {
  await (await select(selector)).waitForDisplayed(options);
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
