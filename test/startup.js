import { useSpectron, focusMain, focusChild, test } from './helpers/spectron/index';

useSpectron();

test('Main and child window visibility', async t => {
  const app = t.context.app;
  await focusMain(t);
  t.true(await app.browserWindow.isVisible());
  await focusChild(t);
  t.false(await app.browserWindow.isVisible());
});
