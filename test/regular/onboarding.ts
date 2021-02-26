import { focusChild, focusMain, test, useSpectron } from '../helpers/spectron';
import { logIn } from '../helpers/spectron/user';
import { spawnSync } from 'child_process';
import { sleep } from '../helpers/sleep';
import { sceneExisting, switchCollection } from '../helpers/spectron/scenes';
import { sourceIsExisting } from '../helpers/spectron/sources';
import { getClient } from '../helpers/api-client';
import { WidgetsService } from '../../app/services/widgets';
import { EWidgetType } from '../helpers/widget-helpers';
import { FormMonkey } from '../helpers/form-monkey';
import { importExtractZip } from '../../app/util/slow-imports';

const path = require('path');

useSpectron({ skipOnboarding: false });

test('Go through the onboarding and autoconfig', async t => {
  const app = t.context.app;
  await focusMain(t);

  // Wait for the auth screen to appear
  await app.client.isExisting('button=Twitch');

  await logIn(t, 'twitch', { prime: false }, false, true);
  await sleep(1000);

  if (await t.context.app.client.isExisting('span=Skip')) {
    await t.context.app.client.click('span=Skip');
    await sleep(1000);
  }

  // Skip purchasing prime
  if (await t.context.app.client.isExisting('div=Choose Starter')) {
    await t.context.app.client.click('div=Choose Starter');
    await sleep(1000);
  }

  // Don't Import from OBS
  if (await t.context.app.client.isExisting('h2=Start Fresh')) {
    await t.context.app.client.click('h2=Start Fresh');
    await sleep(1000);
  }

  // Skip hardware config
  if (await t.context.app.client.isExisting('button=Skip')) {
    await t.context.app.client.click('button=Skip');
    await sleep(1000);
  }

  // Skip picking a theme
  if (await t.context.app.client.isExisting('button=Skip')) {
    await t.context.app.client.click('button=Skip');
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
  const dataDir = path.resolve(__dirname, '..', '..', '..', 'test', 'data');
  const obsCacheZipPath = path.resolve(dataDir, 'obs-studio.zip');

  await new Promise(async (resolve, reject) => {
    // import of extractZip takes to much time on startup, so import it dynamically
    const extractZip = (await importExtractZip()).default;
    extractZip(obsCacheZipPath, { dir: cacheDir }, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

  // skip auth
  if (await t.context.app.client.isExisting('span=Skip')) {
    await t.context.app.client.click('span=Skip');
    await sleep(1000);
  }

  // Skip purchasing prime
  if (await t.context.app.client.isExisting('div=Choose Starter')) {
    await t.context.app.client.click('div=Choose Starter');
    await sleep(1000);
  }

  // import from OBS
  if (await t.context.app.client.isExisting('h2=Import from OBS')) {
    await t.context.app.client.click('h2=Import from OBS');
    await t.context.app.client.click('h2=Start');
    await sleep(10000);
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
  await client.click('.side-nav .icon-settings');
  await focusChild(t);
  await client.click('li=Output');
  const form = new FormMonkey(t);
  await form.setInputValue(await form.getInputSelectorByTitle('Video Bitrate'), '5000');
  await form.setInputValue(await form.getInputSelectorByTitle('Encoder'), 'Software (x264)');

  // check that widgets have been migrated
  await focusMain(t);
  await switchCollection(t, 'Widgets');
  const api = await getClient();
  const widgetsService = api.getResource<WidgetsService>('WidgetsService');

  t.deepEqual(
    [EWidgetType.DonationGoal, EWidgetType.EventList, EWidgetType.AlertBox],
    widgetsService.getWidgetSources().map(widget => (widget.type as unknown) as EWidgetType),
  );
});
