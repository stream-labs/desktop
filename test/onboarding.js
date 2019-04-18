import test from 'ava';
import { useSpectron, focusMain, focusChild } from './helpers/spectron/index';
import { selectSource, clickSourceProperties, sourceIsExisting } from './helpers/spectron/sources';
import { logOut } from './helpers/spectron/user';

useSpectron({ skipOnboarding: false, appArgs: '--nosync' });

test('Adding some starter widgets', async t => {
  const app = t.context.app;
  await focusMain(t);

  const widgetToken = 'SomeWidgetToken';
  const platform = {
    type: 'twitch',
    username: 'exampleuser',
    token: 'SomeToken',
    id: 'SomeId'
  };

  // Wait for the auth screen to appear
  await app.client.isExisting('button=Twitch');

  await app.webContents.send('testing-fakeAuth', {
    widgetToken,
    platform
  });

  // This will show up if there are scene collections to import
  if (await t.context.app.client.isExisting('button=Continue')) {
    await t.context.app.client.click('button=Continue');
  }

  // This will only show up if OBS is installed
  if (await t.context.app.client.isExisting('button=Start Fresh')) {
    await t.context.app.client.click('button=Start Fresh');
  }

  await app.client.click('a=Setup later');

  await logOut(t); // widget settings don't work with a fake-auth
});
