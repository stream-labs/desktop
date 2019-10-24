import { focusChild, focusMain, TExecutionContext } from './index';
import { sleep } from '../sleep';

export async function showSettings(t: TExecutionContext, category: string) {
  await focusMain(t);
  await t.context.app.client.click('.side-nav .icon-settings');
  await focusChild(t);

  if (category) {
    await t.context.app.client.click(`.nav-item__content=${category}`);
  }
}

