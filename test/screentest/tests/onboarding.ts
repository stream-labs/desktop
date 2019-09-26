import { useSpectron, test, focusMain } from '../../helpers/spectron';
import { disableGifAnimations, makeScreenshots, useScreentest } from '../screenshoter';
import { logIn } from '../../helpers/spectron/user';
import { spawnSync } from 'child_process';
import { sleep } from '../../helpers/sleep';
const path = require('path');
const _7z = require('7zip')['7z'];

useSpectron({ skipOnboarding: false, appArgs: '--nosync' });
useScreentest();

test('Onboarding steps', async t => {
  const app = t.context.app;
  await focusMain(t);

  // Wait for the auth screen to appear
  await app.client.waitForVisible('button=Twitch');

  await logIn(t, 'twitch', null, false, true);
  await sleep(1000);
  await t.context.app.client.click('span=Skip');

  await app.client.waitForVisible('h2=Start Fresh', 15000);
  await makeScreenshots(t, 'Start fresh or import from OBS');
  await app.client.click('h2=Start Fresh');

  await app.client.waitForVisible('h1=Add a Theme');
  await makeScreenshots(t, 'Add a Theme');
  await app.client.click('p=Skip');

  await app.client.waitForVisible('h1=Optimize');
  await makeScreenshots(t, 'Before optimize');
  await app.client.click('button=Start');
  await app.client.waitForVisible('h1=Optimizing... 33%');
  await makeScreenshots(t, 'Optimization progress');

  // success?
  await app.client.waitForVisible('h2=Sources', 60000);
  await makeScreenshots(t, 'Onboarding completed');
  t.pass();

});

test('OBS Importer', async t => {
  const client = t.context.app.client;

  // extract OBS config to the cache dir
  const cacheDir = path.resolve(await t.context.app.electron.remote.app.getPath('userData'), '..');
  const dataDir = path.resolve(__dirname, '..', '..', 'test', 'data');
  const obsCacheZipPath = path.resolve(dataDir, 'obs-studio.zip');
  spawnSync(_7z, ['x', obsCacheZipPath, `-o${cacheDir}`]);

  // skip auth
  await client.waitForVisible('button=Twitch');
  await t.context.app.client.click('span=Skip');

  // import from OBS
  await client.waitForVisible('h2=Import from OBS');
  await makeScreenshots(t, 'Import button');
  await client.click('h2=Import from OBS');

  // benefits page
  await client.waitForVisible('h1=A few benefits of using Streamlabs OBS');
  await makeScreenshots(t, 'Benefits');
  await client.click('button=Complete');

  // success?
  await client.waitForVisible('h2=Sources', 60000);
  await makeScreenshots(t, 'Import from OBS is completed');
  t.pass();
});
