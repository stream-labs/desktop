import { useSpectron, test } from '../../helpers/spectron';
import { getApiClient } from '../../helpers/api-client';
import { ISourcesServiceApi } from '../../../app/services/sources/sources-api';
import { useScreentest } from '../screenshoter';
import { ScenesService } from 'services/api/external-api/scenes';
import { focusChild } from '../../helpers/modules/core';

useSpectron({ restartAppAfterEachTest: false });
useScreentest();

test('Sources showcase window', async t => {
  const client = await getApiClient();
  const sourcesService = client.getResource<ISourcesServiceApi>('SourcesService');
  sourcesService.showShowcase();
  await focusChild();
  t.pass();
});

test('AddSource window', async t => {
  const client = await getApiClient();
  const sourcesService = client.getResource<ISourcesServiceApi>('SourcesService');
  sourcesService.showAddSource('color_source');
  await focusChild();
  t.pass();
});

test('AddSource window with suggestions', async t => {
  const client = await getApiClient();
  const sourcesService = client.getResource<ISourcesServiceApi>('SourcesService');
  const scenesService = client.getResource<ScenesService>('ScenesService');
  scenesService.activeScene.createAndAddSource('MySource', 'color_source');
  sourcesService.showAddSource('color_source');
  await focusChild();
  t.pass();
});
