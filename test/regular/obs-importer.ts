import { test, useSpectron } from '../helpers/spectron';
import { sceneExisting, switchCollection } from '../helpers/modules/scenes';
import { sourceIsExisting } from '../helpers/modules/sources';
import { getApiClient } from '../helpers/api-client';
import { WidgetsService } from '../../app/services/widgets';
import { EWidgetType } from '../helpers/widget-helpers';
import { FormMonkey } from '../helpers/form-monkey';
import { ExecutionContext } from 'ava';
import { click, focusChild, focusMain, waitForDisplayed } from '../helpers/modules/core';
import { logIn } from '../helpers/spectron/user';

const path = require('path');

useSpectron({ skipOnboarding: false, beforeAppStartCb: installOBSCache });

async function installOBSCache(t: ExecutionContext) {
  // extract OBS config to the cache dir
  // @ts-ignore Spectron typings are wrong - app is actually under remote
  const cacheDir = path.resolve(t.context.cacheDir);
  const dataDir = path.resolve(__dirname, '..', '..', '..', 'test', 'data');
  const obsCacheZipPath = path.resolve(dataDir, 'obs-studio.zip');

  const extractZip = require('extract-zip');
  await new Promise<void>(async (resolve, reject) => {
    extractZip(obsCacheZipPath, { dir: cacheDir }, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

test('OBS Importer', async t => {
  const client = t.context.app.client;

  await logIn(t);

  // skip auth
  await click('span=Skip');

  // import from OBS
  await click('div=Import from OBS');
  await click('div=Start');

  await waitForDisplayed('.scene-collections-wrapper');

  // check collection 1 and sources
  await switchCollection('Collection 1');
  t.true(await sceneExisting('Scene'));
  t.true(await sceneExisting('Scene 2'));
  t.true(await sourceIsExisting('Color Source'));
  t.true(await sourceIsExisting('Text (GDI+)'));

  // check collection 2 exists
  await focusMain();
  await switchCollection('Collection 2');

  // check settings
  await (await client.$('.side-nav .icon-settings')).click();
  await focusChild();
  await (await client.$('li=Output')).click();
  const form = new FormMonkey(t);
  await form.setInputValue(await form.getInputSelectorByTitle('Video Bitrate'), '5000');
  await form.setInputValue(await form.getInputSelectorByTitle('Encoder'), 'Software (x264)');

  // check that widgets have been migrated
  await focusMain();
  await switchCollection('Widgets');
  const api = await getApiClient();
  const widgetsService = api.getResource<WidgetsService>('WidgetsService');

  t.deepEqual(
    [EWidgetType.DonationGoal, EWidgetType.EventList, EWidgetType.AlertBox],
    widgetsService.getWidgetSources().map(widget => (widget.type as unknown) as EWidgetType),
  );
});
