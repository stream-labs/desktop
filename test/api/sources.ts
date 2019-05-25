import { useSpectron, test } from '../helpers/spectron';
import { getClient } from '../helpers/api-client';
import { ScenesService } from 'services/scenes';
import { SourcesService } from 'services/api/external-api/sources/sources';

useSpectron({ restartAppAfterEachTest: false });

test('Creating, fetching and removing sources', async t => {
  const client = await getClient();
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

  scene.removeItem(colorItem1.sceneItemId);
  colorItem2.remove();
  sceneItemNames = scene.getItems().map(item => item['name']);

  t.deepEqual(sceneItemNames, []);
});

test('Source events', async t => {
  const client = await getClient();
  const scenesService = client.getResource<ScenesService>('ScenesService');
  const sourcesService = client.getResource<SourcesService>('SourcesService');
  let eventData: Dictionary<any>;

  sourcesService.sourceAdded.subscribe(() => void 0);
  sourcesService.sourceRemoved.subscribe(() => void 0);
  sourcesService.sourceUpdated.subscribe(() => void 0);

  // check `sourceUpdated` event after `createSource` call
  const source1 = sourcesService.createSource('audio1', 'wasapi_output_capture');
  eventData = await client.fetchNextEvent();
  t.is(eventData.name, 'audio1');
  t.truthy(eventData.id); // id field is necessary for Streamdeck

  // check `sourceUpdated` event after `createAndAddSource` call
  const item2 = scenesService.activeScene.createAndAddSource('audio2', 'wasapi_output_capture');
  eventData = await client.fetchNextEvent();
  t.is(eventData.name, 'audio2');

  // check `sourceRemoved` event
  item2.remove();
  eventData = await client.fetchNextEvent();
  t.is(eventData.name, 'audio2');

  // check `sourceUpdated` event when renaming a source
  source1.setName('audio3');
  eventData = await client.fetchNextEvent();
  t.is(eventData.name, 'audio3');
});
