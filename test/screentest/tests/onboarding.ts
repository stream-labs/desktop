import { useSpectron, test, focusMain, focusChild } from '../../helpers/spectron';
import { disableGifAnimations, makeScreenshots, useScreentest } from '../screenshoter';
import { logIn } from '../../helpers/spectron/user';
import { spawnSync } from 'child_process';
import { sleep } from '../../helpers/sleep';

const path = require('path');
const _7z = require('7zip')['7z'];

useSpectron({ skipOnboarding: false });
useScreentest();

test('Onboarding steps', async t => {
  try {


  const app = t.context.app;
  await focusMain(t);

  // Wait for the auth screen to appear
  await app.client.isExisting('button=Twitch');
  await makeScreenshots(t, 'Auth Buttons');

  await logIn(t, null, null, false);
  await sleep(1000);

  // This will show up if there are scene collections to import
  if (await t.context.app.client.isExisting('button=Continue')) {
    await t.context.app.client.click('button=Continue');
  }
  await sleep(1000);

  // Start auto config
  t.true(await app.client.isExisting('button=Start'));
  await disableGifAnimations(t);
  await makeScreenshots(t, 'Autoconfig');
  await app.client.click('button=Start');
  await app.client.waitForVisible('.button--action:not([disabled])', 60000);
  await makeScreenshots(t, 'Autoconfig is Finished');

  t.pass();
  } catch (e) {
    console.log('catched', e);
    await sleep(999999999);
  }
});

test('Onboarding OBS Importer', async t => {
  const client = t.context.app.client;

  // extract OBS config to the cache dir
  const cacheDir = path.resolve(await t.context.app.electron.remote.app.getPath('userData'), '..');
  const dataDir = path.resolve(__dirname, '..', '..', '..', '..', 'test', 'data');
  const obsCacheZipPath = path.resolve(dataDir, 'obs-studio.zip');
  spawnSync(_7z, ['x', obsCacheZipPath, `-o${cacheDir}`]);

  // skip auth
  await client.click('a=Setup later');

  // import from OBS
  t.true(await client.isExisting('button=Import from OBS'), 'OBS detected');
  await makeScreenshots(t, 'OBS detected');
  await client.click('button=Import from OBS');
  await client.waitForVisible('button=Continue');
  await makeScreenshots(t, 'OBS completed');
  await client.click('button=Continue');

  // check sources exist in the main window
  await focusMain(t);
  await makeScreenshots(t, 'Sources exist');

  // check settings
  await client.click('.top-nav .icon-settings');
  await focusChild(t);
  await client.click('li=Output');
  await makeScreenshots(t, 'Settings are applied');
});
