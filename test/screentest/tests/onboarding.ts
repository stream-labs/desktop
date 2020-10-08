import { useSpectron, test, focusMain } from '../../helpers/spectron';
import { disableGifAnimations, makeScreenshots, useScreentest } from '../screenshoter';
import { logIn } from '../../helpers/spectron/user';
import { spawnSync } from 'child_process';
import { sleep } from '../../helpers/sleep';
const path = require('path');
const _7z = require('7zip')['7z'];

useSpectron({ skipOnboarding: false });
useScreentest();

test('Onboarding steps', async t => {
  const app = t.context.app;
  await focusMain(t);

  // Wait for the auth screen to appear
  await app.client.waitForVisible('h1=Connect');

  await logIn(t, 'twitch', { prime: false }, false, true);
  await sleep(1000);
  await t.context.app.client.click('span=Skip');

  await app.client.waitForVisible('h1=Choose your Streamlabs plan', 15000);
  await makeScreenshots(t, 'Prime');
  await app.client.click('div=Choose Starter');

  await app.client.waitForVisible('h2=Start Fresh');
  await makeScreenshots(t, 'Start fresh or import from OBS');
  await app.client.click('h2=Start Fresh');

  await app.client.waitForVisible('h1=Set Up Mic and Webcam');
  await makeScreenshots(t, 'Setup Mic and Webcam');
  await app.client.click('button=Skip');

  await app.client.waitForVisible('h1=Add a Theme');
  await makeScreenshots(t, 'Add a Theme');
  await app.client.click('button=Skip');

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
  const dataDir = path.resolve(__dirname, '..', '..', '..', '..', 'test', 'data');
  const obsCacheZipPath = path.resolve(dataDir, 'obs-studio.zip');
  const result = spawnSync(_7z, ['x', obsCacheZipPath, `-o${cacheDir}`]);

  if (result.status) {
    console.error(result.stderr.toString());
    throw new Error('Error setting up OBS Studio cache directory!');
  }

  // skip auth
  await client.waitForVisible('h1=Connect');
  await client.click('span=Skip');

  // skip prime
  await client.waitForVisible('h1=Choose your Streamlabs plan');
  await client.click('div=Choose Starter');

  // import from OBS
  await client.waitForVisible('h2=Import from OBS');
  await client.click('h2=Import from OBS');

  await client.waitForVisible('h1=Importing Your Existing Settings From OBS');
  await makeScreenshots(t, 'Import button');
  await client.click('h2=Start');

  // success?
  await client.waitForVisible('h2=Sources', 60000);
  await makeScreenshots(t, 'Import from OBS is completed');
  t.pass();
});
