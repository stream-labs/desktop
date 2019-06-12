import { useSpectron, test, focusChild } from '../../helpers/spectron';
import { getClient } from '../../helpers/api-client';
import { ISourcesServiceApi } from '../../../app/services/sources/sources-api';
import { makeScreenshots, useScreentest } from '../screenshoter';
import { ScenesService } from '../../../app/services/scenes';

useSpectron({ restartAppAfterEachTest: false });
useScreentest();

test('Sources showcase window', async t => {
  const client = await getClient();
  const sourcesService = client.getResource<ISourcesServiceApi>('SourcesService');
  sourcesService.showShowcase();
  await focusChild(t);
  t.pass();
});

test('AddSource window', async t => {
  const client = await getClient();
  const sourcesService = client.getResource<ISourcesServiceApi>('SourcesService');
  sourcesService.showAddSource('color_source');
  await focusChild(t);
  t.pass();
});

test('AddSource window with suggestions', async t => {
  const client = await getClient();
  const sourcesService = client.getResource<ISourcesServiceApi>('SourcesService');
  const scenesService = client.getResource<ScenesService>('ScenesService');
  scenesService.activeScene.createAndAddSource('MySource', 'color_source');
  sourcesService.showAddSource('color_source');
  await focusChild(t);
  t.pass();
});

