import { useSpectron, test, focusMain } from '../../helpers/spectron';
import { getClient } from '../../helpers/api-client';
import { makeScreenshots, useScreentest } from '../screenshoter';
import { logIn } from '../../helpers/spectron/user';
import { spawnSync } from 'child_process';
import { sleep } from '../../helpers/sleep';

const path = require('path');
const _7z = require('7zip')['7z'];

useSpectron({ skipOnboarding: false });
useScreentest();

test('Onboarding steps', async t => {

  // extract OBS config to the cache dir
  const cacheDir = path.resolve(await t.context.app.electron.remote.app.getPath('userData'), '..');
  const dataDir = path.resolve(__dirname, '..', '..', 'test', 'data');
  const obsCacheZipPath = path.resolve(dataDir, 'obs-studio.zip');
  spawnSync(_7z, ['x', obsCacheZipPath, `-o${cacheDir}`]);

  const app = t.context.app;
  const client = app.client;
  await focusMain(t);

  // Wait for the auth screen to appear
  await app.client.isExisting('button=Twitch');
  await makeScreenshots(t, 'Auth Buttons');

  await logIn(t);
  await sleep(1000);

  // This will show up if there are scene collections to import
  if (await t.context.app.client.isExisting('button=Continue')) {
    await t.context.app.client.click('button=Continue');
  }
  await sleep(1000);

  // Start auto config
  await makeScreenshots(t, 'Autoconfig');
  await app.client.click('button=Start');
  await app.client.waitForVisible('.button--action:not([disabled])', 60000);
  await makeScreenshots(t, 'Autoconfig is Finished');

  // obs importer
  await client.click('button=Next');
  await makeScreenshots(t, 'Obs Importer');
  await client.click('button=Import from OBS');
  await client.waitForVisible('button=Continue');
  await makeScreenshots(t, 'Obs Import is Completed');
  await sleep(900000000)

  t.pass();
});

