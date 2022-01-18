import { runWithSpectron, test } from '../../helpers/spectron';
import { getApiClient } from '../../helpers/api-client';
import { SceneCollectionsService } from 'services/scene-collections';

runWithSpectron({ restartAppAfterEachTest: false });

test('SceneCollection events', async t => {
  const client = await getApiClient();
  const collectionService = client.getResource<SceneCollectionsService>('SceneCollectionsService');

  // create a new collection
  let eventWatcher = client.watchForEvents([
    'SceneCollectionsService.collectionWillSwitch',
    'SceneCollectionsService.collectionAdded',
    'SceneCollectionsService.collectionSwitched',
  ]);
  collectionService.create({ name: 'New Collection' });
  await eventWatcher.waitForAll();

  // rename the collection
  eventWatcher = client.watchForEvents(['SceneCollectionsService.collectionUpdated']);
  const collection = collectionService.collections.find(col => col.name === 'New Collection');
  await collectionService.rename('Renamed Collection', collection.id);
  await eventWatcher.waitForAll();

  // remove the collection
  eventWatcher = client.watchForEvents([
    'SceneCollectionsService.collectionRemoved',
    'SceneCollectionsService.collectionWillSwitch',
    'SceneCollectionsService.collectionSwitched',
  ]);
  await collectionService.delete(collection.id);
  await eventWatcher.waitForAll();

  // load collection
  const firstCollection = collectionService.collections[0];
  await collectionService.create({ name: 'New Collection' });
  eventWatcher = client.watchForEvents([
    'SceneCollectionsService.collectionWillSwitch',
    'SceneCollectionsService.collectionSwitched',
  ]);
  collectionService.load(firstCollection.id);
  await eventWatcher.waitForAll();

  t.pass();
});
