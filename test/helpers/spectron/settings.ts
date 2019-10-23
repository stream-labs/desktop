import { focusChild, focusMain, TExecutionContext } from './index';

export async function showSettings(t: TExecutionContext, category: string) {
  await focusMain(t);
  await t.context.app.client.click('.side-nav .icon-settings');

  if (category) {
    await focusChild(t);
    await t.context.app.client.click(`li=${category}`);
  }
}

