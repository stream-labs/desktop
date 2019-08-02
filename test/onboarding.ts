import { useSpectron, focusMain, focusChild, test } from './helpers/spectron/index';
import { logIn } from './helpers/spectron/user';
import { spawn, execSync, spawnSync } from 'child_process';
import { sleep } from './helpers/sleep';
import { switchCollection, sceneExisting } from './helpers/spectron/scenes';
import { sourceIsExisting, selectSource, clickSourceProperties } from './helpers/spectron/sources';
import { getFormInput } from './helpers/spectron/forms';

const path = require('path');
const _7z = require('7zip')['7z'];

useSpectron({ skipOnboarding: false });

test('Go through the onboarding and autoconfig', async t => {
  const app = t.context.app;
  await focusMain(t);

  // Wait for the auth screen to appear
  await app.client.isExisting('button=Twitch');

  await logIn(t, 'twitch', null, false, true);
  await sleep(1000);

  if (await t.context.app.client.isExisting('span=Skip')) {
    await t.context.app.client.click('span=Skip');
    await sleep(1000);
  }

  // Don't Import from OBS
  if (await t.context.app.client.isExisting('h2=Start Fresh')) {
    await t.context.app.client.click('h2=Start Fresh');
    await sleep(1000);
  }

  // Skip picking a theme
  if (await t.context.app.client.isExisting('p=Skip')) {
    await t.context.app.client.click('p=Skip');
    await sleep(1000);
  }

  // Start auto config
  t.true(await app.client.isExisting('button=Start'));
  await app.client.click('button=Start');
  await app.client.waitForVisible('h2=Sources', 60000);

  // success?
  t.true(await app.client.isVisible('h2=Sources'), 'Sources selector is visible');
});

test('OBS Importer', async t => {
  const client = t.context.app.client;

  // extract OBS config to the cache dir
  const cacheDir = path.resolve(await t.context.app.electron.remote.app.getPath('userData'), '..');
  const dataDir = path.resolve(__dirname, '..', '..', 'test', 'data');
  const obsCacheZipPath = path.resolve(dataDir, 'obs-studio.zip');
  spawnSync(_7z, ['x', obsCacheZipPath, `-o${cacheDir}`]);

  // skip auth
  if (await t.context.app.client.isExisting('span=Skip')) {
    await t.context.app.client.click('span=Skip');
    await sleep(1000);
  }

  // import from OBS
  if (await t.context.app.client.isExisting('h2=Import from OBS')) {
    await t.context.app.client.click('h2=Import from OBS');
    await sleep(10000);
  }

  // Complete onboarding
  if (await t.context.app.client.isExisting('p=Skip')) {
    await t.context.app.client.click('p=Skip');
    await sleep(1000);
  }

  // check collection 1 and sources
  await switchCollection(t, 'Collection 1');
  t.true(await sceneExisting(t, 'Scene'));
  t.true(await sceneExisting(t, 'Scene 2'));
  t.true(await sourceIsExisting(t, 'Color Source'));
  t.true(await sourceIsExisting(t, 'Text (GDI+)'));

  // check collection 2 exists
  await focusMain(t);
  await switchCollection(t, 'Collection 2');

  // check settings
  await client.click('.top-nav .icon-settings');
  await focusChild(t);
  await client.click('li=Output');
  t.is(await getFormInput(t, 'Video Bitrate'), '5000');
  t.is(await getFormInput(t, 'Encoder'), 'Software (x264)');
});
