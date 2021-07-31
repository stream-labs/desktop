import { useSpectron, test } from '../../helpers/spectron';
import { getApiClient } from '../../helpers/api-client';
import { ISourcesServiceApi } from '../../../app/services/sources/sources-api';
import { useScreentest } from '../screenshoter';
import { ScenesService } from '../../../app/services/api/external-api/scenes';

useSpectron({ restartAppAfterEachTest: false });
useScreentest();

test('Editor without sources', async t => {
  const client = await getApiClient();
  t.pass();
});

test('Editor with sources', async t => {
  const client = await getApiClient();
  const scenesService = client.getResource<ScenesService>('ScenesService');
  const sourcesService = client.getResource<ISourcesServiceApi>('SourcesService');
  const scene = scenesService.activeScene;

  const colorSource1 = sourcesService.createSource('MyColorSource1', 'color_source');
  const colorItem2 = scene.createAndAddSource('MyColorSource2', 'color_source');

  t.pass();
});

test('Editor with the big amount of sources and scenes', async t => {
  const client = await getApiClient();
  const scenesService = client.getResource<ScenesService>('ScenesService');

  let scenesCount = 10;
  let sourcesCount = 10;

  while (scenesCount--) {
    scenesService.createScene(`My scene with a long name ${scenesCount}`);
  }

  while (sourcesCount--) {
    scenesService.activeScene.createAndAddSource(
      `My source with a long name ${sourcesCount}`,
      'color_source',
    );
  }

  t.pass();
});
