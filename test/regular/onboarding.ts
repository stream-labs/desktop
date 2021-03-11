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
  await (await app.client.$('button=Twitch')).isExisting();

  await logIn(t, 'twitch', { prime: false }, false, true);
  await sleep(1000);

  if (await (await t.context.app.client.$('span=Skip')).isExisting()) {
    await (await t.context.app.client.$('span=Skip')).click();
    await sleep(1000);
  }

  // Skip purchasing prime
  if (await (await t.context.app.client.$('div=Choose Starter')).isExisting()) {
    await (await t.context.app.client.$('div=Choose Starter')).click();
    await sleep(1000);
  }

  // Don't Import from OBS
  if (await (await t.context.app.client.$('h2=Start Fresh')).isExisting()) {
    await (await t.context.app.client.$('h2=Start Fresh')).click();
    await sleep(1000);
  }

  // Skip hardware config
  if (await (await t.context.app.client.$('button=Skip')).isExisting()) {
    await (await t.context.app.client.$('button=Skip')).click();
    await sleep(1000);
  }

  // Skip picking a theme
  if (await (await t.context.app.client.$('button=Skip')).isExisting()) {
    await (await t.context.app.client.$('button=Skip')).click();
    await sleep(1000);
  }

  // Start auto config
  t.true(await (await app.client.$('button=Start')).isExisting());
  await (await app.client.$('button=Start')).click();
  await (await app.client.$('h2=Sources')).waitForDisplayed({ timeout: 60000 });

  // success?
  t.true(await (await app.client.$('h2=Sources')).isDisplayed(), 'Sources selector is visible');
});

test('OBS Importer', async t => {
  const client = t.context.app.client;

  // extract OBS config to the cache dir
  // @ts-ignore Spectron typings are wrong - app is actually under remote
  const cacheDir = path.resolve(await t.context.app.electron.remote.app.getPath('userData'), '..');
  const dataDir = path.resolve(__dirname, '..', '..', '..', 'test', 'data');
  const obsCacheZipPath = path.resolve(dataDir, 'obs-studio.zip');

  const extractZip = require('extract-zip');
  await new Promise(async (resolve, reject) => {
    extractZip(obsCacheZipPath, { dir: cacheDir }, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

  // skip auth
  if (await (await t.context.app.client.$('span=Skip')).isExisting()) {
    await (await t.context.app.client.$('span=Skip')).click();
    await sleep(1000);
  }

  // Skip purchasing prime
  if (await (await t.context.app.client.$('div=Choose Starter')).isExisting()) {
    await (await t.context.app.client.$('div=Choose Starter')).click();
    await sleep(1000);
  }

  // import from OBS
  if (await (await t.context.app.client.$('h2=Import from OBS')).isExisting()) {
    await (await t.context.app.client.$('h2=Import from OBS')).click();
    await (await t.context.app.client.$('h2=Start')).click();
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
  await (await client.$('.side-nav .icon-settings')).click();
  await focusChild(t);
  await (await client.$('li=Output')).click();
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
