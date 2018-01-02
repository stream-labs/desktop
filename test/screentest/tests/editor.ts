import test from 'ava';
import { useSpectron } from '../../helpers/spectron';
import { getClient } from '../../helpers/api-client';
import { IScenesServiceApi } from '../../../app/services/scenes/scenes-api';
import { ISourcesServiceApi } from '../../../app/services/sources/sources-api';
import { useScreentest } from '../screenshoter';


useSpectron({ restartAppAfterEachTest: false, initApiClient: true });
useScreentest();

test('Warm up', async t => {
  t.pass();
});


test('Editor without sources', async t => {
  const client = await getClient();
  const scenesService = client.getResource<IScenesServiceApi>('ScenesService');
  const sourcesService = client.getResource<ISourcesServiceApi>('SourcesService');
  const scene = scenesService.activeScene;

  t.pass();
});


test('Editor with sources', async t => {
  const client = await getClient();
  const scenesService = client.getResource<IScenesServiceApi>('ScenesService');
  const sourcesService = client.getResource<ISourcesServiceApi>('SourcesService');
  const scene = scenesService.activeScene;

  const colorSource1 = sourcesService.createSource('MyColorSource1', 'color_source');
  const colorItem2 = scene.createAndAddSource('MyColorSource2', 'color_source');

  t.pass();
});

