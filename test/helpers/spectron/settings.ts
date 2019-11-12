import { click, focusChild, focusMain, TExecutionContext } from './index';

export async function showSettings(t: TExecutionContext, category: string) {
  await focusMain(t);
  await click(t, '.side-nav .icon-settings');
  await focusChild(t);

  if (category) {
    await click(t, `.nav-item__content=${category}`);
  }
}
