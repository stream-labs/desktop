import { click, focusChild, focusMain, TExecutionContext } from './index';
import { sleep } from '../sleep';

export async function showSettings(t: TExecutionContext, category: string) {
  await focusMain(t);
  await sleep(1000);
  await click(t, '.side-nav .icon-settings');
  await focusChild(t);

  await sleep(1000);
  if (category) {
    await click(t, `.nav-item__content=${category}`);
  }
}
