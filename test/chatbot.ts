import test from 'ava';
import { useSpectron, focusMain, focusChild } from './helpers/spectron/index';

useSpectron();

test('Adding a custom command', async t => {
  const app = t.context.app;
});
