import test from 'ava';
import { useSpectron, focusMain, focusChild } from './helpers/spectron/index';
import {
  navigateToCustomCommandsTab,
  openCustomCommandWindow
} from './helpers/spectron/chatbot';
import { getClient } from './helpers/api-client';
import { logIn } from './helpers/spectron/user';
import { sleep } from './helpers/sleep';

useSpectron();

test('Adding a custom command', async t => {
  const app = t.context.app;
  const client = await getClient();
  await logIn(t);
  const navigationService = client.getResource('NavigationService');
  navigationService.navigate('Chatbot');
  await navigateToCustomCommandsTab(t);
  await openCustomCommandWindow(t);
  t.pass();

});
