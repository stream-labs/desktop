import { runWithSpectron, test, afterAppStart } from '../../helpers/spectron';
import { getApiClient } from '../../helpers/api-client';
import { ISourcesServiceApi, TSourceType } from '../../../app/services/sources/sources-api';
import { runScreentest } from '../screenshoter';
import { sleep } from '../../helpers/sleep';
import { ScenesService } from '../../../app/services/api/external-api/scenes';
import { CustomizationService } from '../../../app/services/customization';
import { focusChild } from '../../helpers/modules/core';

let showSourceProps: (name: string) => void;

runWithSpectron({ restartAppAfterEachTest: false });
runScreentest();
afterAppStart(async t => {
  const types: TSourceType[] = [
    'image_source',
    'color_source',
    'browser_source',
    'slideshow',
    'ffmpeg_source',
    'text_gdiplus',
    'text_ft2_source',
    'monitor_capture',
    'window_capture',
    'game_capture',
    'dshow_input',
    'wasapi_input_capture',
    'wasapi_output_capture',
    'ndi_source',
  ];

  const client = await getApiClient();
  const scenesService = client.getResource<ScenesService>('ScenesService');
  const sourcesService = client.getResource<ISourcesServiceApi>('SourcesService');
  const customizationService = client.getResource<CustomizationService>('CustomizationService');

  types.forEach(type => {
    scenesService.activeScene.createAndAddSource(type, type);
  });

  // set performance mode to avoid hiding/showing the display
  // that improves test performance and prevents crashes
  customizationService.setSettings({ performanceMode: true });

  showSourceProps = async (name: string) => {
    const sourceId = sourcesService.getSourcesByName(name)[0].sourceId;
    sourcesService.showSourceProperties(sourceId);
    await focusChild();
  };
});

test('image_source', async t => {
  await showSourceProps('image_source');
  t.pass();
});

test('color_source', async t => {
  await showSourceProps('color_source');
  t.pass();
});

test('browser_source', async t => {
  await showSourceProps('browser_source');
  t.pass();
});

test('slideshow', async t => {
  await showSourceProps('slideshow');
  t.pass();
});

test('ffmpeg_source', async t => {
  await showSourceProps('ffmpeg_source');
  t.pass();
});

test('text_gdiplus', async t => {
  await showSourceProps('text_gdiplus');
  await sleep(1500); // the font selector rendering is very slow
  t.pass();
});

test('text_ft2_source', async t => {
  await showSourceProps('text_ft2_source');
  await sleep(1500); // the font selector rendering is very slow
  t.pass();
});

test('monitor_capture', async t => {
  await showSourceProps('monitor_capture');
  t.pass();
});

test('game_capture', async t => {
  await showSourceProps('game_capture');
  t.pass();
});

test('dshow_input', async t => {
  await showSourceProps('dshow_input');
  t.pass();
});

test('wasapi_input_capture', async t => {
  showSourceProps('wasapi_input_capture');
  t.pass();
});

test('wasapi_output_capture', async t => {
  await showSourceProps('wasapi_output_capture');
  t.pass();
});

test('ndi_source', async t => {
  await showSourceProps('ndi_source');
  t.pass();
});
