import { runWithSpectron, test } from '../../helpers/spectron';
import { getApiClient } from '../../helpers/api-client';
import { ScenesService } from 'services/api/external-api/scenes/scenes';
import { SourcesService } from 'services/api/external-api/sources/sources';
import { sleep } from '../../helpers/sleep';

runWithSpectron({ restartAppAfterEachTest: false });

test('Creating, fetching and removing sources', async t => {
  const client = await getApiClient();
  const scenesService = client.getResource<ScenesService>('ScenesService');
  const sourcesService = client.getResource<SourcesService>('SourcesService');
  const scene = scenesService.activeScene;

  const colorSource1 = sourcesService.createSource('MyColorSource1', 'color_source');
  const colorItem2 = scene.createAndAddSource('MyColorSource2', 'color_source');

  const sources = sourcesService.getSources();

  t.truthy(colorSource1.id); // id field is necessary for Streamdeck
  t.truthy(sources.find(source => source.name === 'MyColorSource1'));
  t.truthy(sources.find(source => source.name === 'MyColorSource2'));

  const colorItem1 = scene.addSource(colorSource1.sourceId);
  let sceneItemNames = scene.getItems().map(item => item['name']);

  t.deepEqual(sceneItemNames, ['MyColorSource1', 'MyColorSource2']);

  scene.removeItem(colorItem1.id);
  colorItem2.remove();
  sceneItemNames = scene.getItems().map(item => item['name']);

  t.deepEqual(sceneItemNames, []);
});

test('Source events', async t => {
  const client = await getApiClient();
  const scenesService = client.getResource<ScenesService>('ScenesService');
  const sourcesService = client.getResource<SourcesService>('SourcesService');

  sourcesService.sourceAdded.subscribe(() => void 0);
  sourcesService.sourceRemoved.subscribe(() => void 0);
  sourcesService.sourceUpdated.subscribe(() => void 0);

  // check `sourceUpdated` event after `createSource` call
  const source1 = sourcesService.createSource('audio1', 'wasapi_output_capture');
  let event = await client.fetchNextEvent();
  t.is(event.data.name, 'audio1');
  t.truthy(event.data.id); // id field is necessary for Streamdeck

  // check `sourceUpdated` event after `createAndAddSource` call
  const item2 = scenesService.activeScene.createAndAddSource('audio2', 'wasapi_output_capture');
  event = await client.fetchNextEvent();
  t.is(event.data.name, 'audio2');

  // check `sourceRemoved` event
  item2.remove();
  event = await client.fetchNextEvent();
  t.is(event.data.name, 'audio2');

  // check `sourceUpdated` event when renaming a source
  source1.setName('audio3');
  event = await client.fetchNextEvent();

  // the remote control app requires these fields to be in the event
  t.is(event.data.name, 'audio3');
  t.is(event.data.configurable, true);
  t.truthy(event.data.resourceId);
});
