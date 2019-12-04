import { test, useSpectron } from '../helpers/spectron';
import { showSettings } from '../helpers/spectron/settings';
import { fillForm } from '../helpers/form-monkey';
import { getClient } from '../helpers/api-client';
import { ScenesService } from 'services/api/external-api/scenes';

useSpectron();

test('Search', async t => {
  const { client } = t.context.app;
  const scenesService: ScenesService = (await getClient()).getResource('ScenesService');
  await showSettings(t);

  // search for x264 encoder in Output settings
  await fillForm(t, null, { search: 'x264' });
  await client.waitForVisible('[data-name="StreamEncoder"]');

  // search for MyColorSource in Hotkeys
  scenesService.activeScene.createAndAddSource('MyColorSource', 'color_source');
  await showSettings(t);
  await fillForm(t, null, { search: 'MyColorSource' });
  await client.waitForVisible('div=Show MyColorSource');
  t.pass();
});