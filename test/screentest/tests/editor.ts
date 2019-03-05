import test from 'ava';
import { useSpectron } from '../../helpers/spectron';
import { getClient } from '../../helpers/api-client';
import { IScenesServiceApi } from '../../../app/services/scenes/scenes-api';
import { ISourcesServiceApi } from '../../../app/services/sources/sources-api';
import { useScreentest } from '../screenshoter';

useSpectron({ restartAppAfterEachTest: false });
useScreentest();

test('Editor without sources', async t => {
  const client = await getClient();
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

test('Editor with the big amount of sources and scenes', async t => {
  const client = await getClient();
  const scenesService = client.getResource<IScenesServiceApi>('ScenesService');

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
