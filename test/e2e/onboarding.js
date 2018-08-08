import test from 'ava';
import { useSpectron, focusMain, focusChild } from '../helpers/spectron/index';
import {selectSource, clickSourceProperties, sourceIsExisting} from '../helpers/spectron/sources';

useSpectron({ skipOnboarding: false });

test('Startup first time / login', async t => {
  const app = t.context.app;
  await focusMain(t);

  const platform = {
    type: 'niconico',
    username: 'exampleuser',
    token: 'SomeToken',
    id: 'SomeId'
  };

  // Wait for the auth screen to appear
  t.true(await app.client.isExisting('[data-test="Connect"] [data-test="NiconicoSignup"]'));
  t.true(await app.client.isExisting('[data-test="Connect"] [data-test="Skip"]'));

  await app.webContents.send('testing-fakeAuth', {
    platform
  });

  // This will only show up if OBS is installed
  if (await t.context.app.client.isExisting('[data-test="ObsImport"]')) {
    await t.context.app.client.click('[data-test="ObsImport"] [data-test="Skip"]');
  }

  t.true(await t.context.app.client.isExisting('[data-test="Studio"]'));
});

test('Startup first time / skip', async t => {
  const app = t.context.app;
  await focusMain(t);

  // Wait for the auth screen to appear
  t.true(await app.client.isExisting('[data-test="Connect"] [data-test="NiconicoSignup"]'));
  t.true(await app.client.isExisting('[data-test="Connect"] [data-test="Skip"]'));
  await app.client.click('[data-test="Connect"] [data-test="Skip"]');

  // This will only show up if OBS is installed
  if (await t.context.app.client.isExisting('[data-test="ObsImport"]')) {
    await t.context.app.client.click('[data-test="ObsImport"] [data-test="Skip"]');
  }

  t.true(await t.context.app.client.isExisting('[data-test="Studio"]'));
});
