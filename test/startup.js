import test from 'ava';
import { useSpectron, focusMain, focusChild } from './helpers/spectron';

useSpectron();

test('The main window is visible', async t => {
  const app = t.context.app;
  await focusMain(t);
  t.true(await app.browserWindow.isVisible());
});

test('The child window is not visible', async t => {
  const app = t.context.app;
  await focusChild(t);
  t.false(await app.browserWindow.isVisible());
});
