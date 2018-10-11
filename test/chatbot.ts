import test from 'ava';
import { useSpectron, focusMain, focusChild } from './helpers/spectron/index';
import { openCustomCommandWindow } from './helpers/spectron/chatbot';

useSpectron();

test('Adding a custom command', async t => {
  const app = t.context.app;
  await openCustomCommandWindow(t);
});
