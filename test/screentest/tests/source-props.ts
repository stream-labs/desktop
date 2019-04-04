import test from 'ava';
import { useSpectron } from '../../helpers/spectron';
import { getClient } from '../../helpers/api-client';
import { ISourcesServiceApi, TSourceType } from '../../../app/services/sources/sources-api';
import { useScreentest } from '../screenshoter';
import { ScenesService } from '../../../app/services/scenes/';

let showSourceProps: (name: string) => void;

useSpectron({
  restartAppAfterEachTest: false,
  afterStartCb: async t => {
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

    const client = await getClient();
    const scenesService = client.getResource<ScenesService>('ScenesService');
    const sourcesService = client.getResource<ISourcesServiceApi>('SourcesService');

    types.forEach(type => {
      scenesService.activeScene.createAndAddSource(type, type);
    });

    showSourceProps = (name: string) => {
      const sourceId = sourcesService.getSourcesByName(name)[0].sourceId;
      sourcesService.showSourceProperties(sourceId);
    };
  },
});

useScreentest({ window: 'child' });

test('image_source', async t => {
  showSourceProps('image_source');
  t.pass();
});

test('color_source', async t => {
  showSourceProps('color_source');
  t.pass();
});

test('browser_source', async t => {
  showSourceProps('browser_source');
  t.pass();
});

test('slideshow', async t => {
  showSourceProps('slideshow');
  t.pass();
});

test('ffmpeg_source', async t => {
  showSourceProps('ffmpeg_source');
  t.pass();
});

test('text_gdiplus', async t => {
  showSourceProps('text_gdiplus');
  t.pass();
});

test('text_ft2_source', async t => {
  showSourceProps('text_ft2_source');
  t.pass();
});

test('monitor_capture', async t => {
  showSourceProps('monitor_capture');
  t.pass();
});

test('game_capture', async t => {
  showSourceProps('game_capture');
  t.pass();
});

test('dshow_input', async t => {
  showSourceProps('dshow_input');
  t.pass();
});

test('wasapi_input_capture', async t => {
  showSourceProps('wasapi_input_capture');
  t.pass();
});

test('wasapi_output_capture', async t => {
  showSourceProps('wasapi_output_capture');
  t.pass();
});

test('ndi_source', async t => {
  showSourceProps('ndi_source');
  t.pass();
});
