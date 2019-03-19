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

  // Select and deselect some widgets
  await app.client.click('div=Alertbox');
  await app.client.click('button=Remove Widget');

  await app.client.click('div=Chatbox');
  await app.client.click('button=Add Widget');

  await app.client.click('div=Donation Goal');
  await app.client.click('button=Add Widget');

  await app.client.click('button=Add 2 Widgets');
  await app.client.click('a=Setup later');

  t.false(await sourceIsExisting(t, 'Alert Box'));
  t.false(await sourceIsExisting(t, 'Event List'));
  t.false(await sourceIsExisting(t, 'The Jar'));
  t.true(await sourceIsExisting(t, 'Chat Box'));
  t.false(await sourceIsExisting(t, 'Donation Ticker'));
  t.true(await sourceIsExisting(t, 'Donation Goal'));

  await logOut(t); // widget settings don't work with a fake-auth
  await selectSource(t, 'Chat Box');
  await clickSourceProperties(t);
  await focusChild(t);

  t.true(await app.client.isExisting('label=Custom CSS'));
});
