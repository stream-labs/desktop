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

// test('Log into chatbot', async t => {
//   // t.true(await logIn(t));
//   // const app = t.context.app;
//   const apiClient = await getClient();
//   const navigationService = apiClient.getResource('NavigationService');
//   t.true(await navigationService.navigate('Dashboard'));
//   // await app.client.click('.nav-item.Commands');
//   // await app.client.click('.nav-item.Custom_Commands');
//   // await app.client.click('.button--add-command');
//   // await navigateToCustomCommandsTab(t);
//   // await openCustomCommandWindow(t);
//   // t.true();
// });

test('Log into chatbot', async t => {
  const client = await getClient();
  await logIn(t);
  const app = t.context.app;
  const navigationService = client.getResource('NavigationService');
});