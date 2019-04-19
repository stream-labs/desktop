import test from 'ava';
import { useSpectron, focusMain, focusChild } from './helpers/spectron/index';
import { logIn, logOut } from './helpers/spectron/user';

useSpectron({ skipOnboarding: false, appArgs: '--nosync', pauseIfFailed: true });

test('Go through unboarding', async t => {
  const app = t.context.app;
  await focusMain(t);

  // Wait for the auth screen to appear
  await app.client.isExisting('button=Twitch');

  await logIn(t);

  // This will show up if there are scene collections to import
  if (await t.context.app.client.isExisting('button=Continue')) {
    await t.context.app.client.click('button=Continue');
  }

  // This will only show up if OBS is installed
  if (await t.context.app.client.isExisting('button=Start Fresh')) {
    await t.context.app.client.click('button=Start Fresh');
  }

  await app.client.click('a=Setup later');

  t.pass();
});
