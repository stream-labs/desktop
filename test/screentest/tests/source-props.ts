import test from 'ava';
import { useSpectron } from '../../helpers/spectron';
import { ApiClient, getClient } from '../../helpers/api-client';
import { ISourcesServiceApi } from '../../../app/services/sources/sources-api';
import { useScreentest } from '../screenshoter';
import { ISettingsServiceApi } from '../../../app/services/settings';
import { IScenesServiceApi } from '../../../app/services/scenes/scenes-api';


useSpectron({ restartAppAfterEachTest: false });
useScreentest({ window: 'child' });

const client: ApiClient;
const sourcesService: ISourcesServiceApi;
const showSourceProps: (name) => void;

test.before.always(async t => {
  const scenesService = client.getResource<IScenesServiceApi>('ScenesService');
  const types = [
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
    'wasapi_output_capture'
  ];


  client = await getClient();
  sourcesService = client.getResource<ISourcesServiceApi>('SourcesService');

  types.forEach(type => {
    scenesService.activeScene.createAndAddSource(type, type);
  });

  showSourceProps = (name) => {
    const sourceId = this.sourcesService.getSourcesByName(name)[0].sourceId;
    this.sourcesService.showSourceProperties(sourceId);
  };


});

test('image_source', async t => {
  showSourceProps('image_source')
  t.pass();
});
