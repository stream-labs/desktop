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

test('Go through onboarding', async t => {
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


test('OBS Importer', async t => {
  const client = t.context.app.client;

  // extract OBS config to the cache dir
  const cacheDir = path.resolve(await t.context.app.electron.remote.app.getPath('userData'), '..');
  const dataDir = path.resolve(__dirname, '..', '..', 'test', 'data');
  const obsCacheZipPath = path.resolve(dataDir, 'obs-studio.zip');
  spawnSync(_7z, ['x', obsCacheZipPath, `-o${cacheDir}`]);

  // skip auth
  await client.click('a=Setup later');

  // import from OBS
  t.true(await client.isExisting('button=Import from OBS'), 'OBS detected');
  await client.click('button=Import from OBS');
  await client.waitForVisible('button=Continue');
  await client.click('button=Continue');

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
