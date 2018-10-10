import test from 'ava';
import { useSpectron } from '../helpers/spectron';
import { getClient } from '../helpers/api-client';
import { IScenesServiceApi } from '../../app/services/scenes/scenes-api';
import { ISourcesServiceApi } from '../../app/services/sources/sources-api';


useSpectron({ restartAppAfterEachTest: false });


test('Creating, fetching and removing sources', async t => {
  const client = await getClient();
  const scenesService = client.getResource<IScenesServiceApi>('ScenesService');
  const sourcesService = client.getResource<ISourcesServiceApi>('SourcesService');
  const scene = scenesService.activeScene;

  const colorSource1 = sourcesService.createSource('MyColorSource1', 'color_source');
  const colorItem2 = scene.createAndAddSource('MyColorSource2', 'color_source');

  const sources = sourcesService.getSources();

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
  const scenesService = client.getResource<IScenesServiceApi>('ScenesService');
  const sourcesService = client.getResource<ISourcesServiceApi>('SourcesService');
  let eventData: Dictionary<any>;

  sourcesService.sourceAdded.subscribe(() => void 0);
  sourcesService.sourceRemoved.subscribe(() => void 0);
  sourcesService.sourceUpdated.subscribe(() => void 0);


  const source1 = sourcesService.createSource('audio1', 'wasapi_output_capture');
  eventData = await client.fetchNextEvent();

  t.is(eventData.name, 'audio1');

  const item2 = scenesService.activeScene.createAndAddSource('audio2', 'wasapi_output_capture');
  eventData = await client.fetchNextEvent();

  t.is(eventData.name, 'audio2');

  item2.remove();
  eventData = await client.fetchNextEvent();

  t.is(eventData.name, 'audio2');

  source1.setName('audio3');
  eventData = await client.fetchNextEvent();

  t.is(eventData.name, 'audio3');

});
