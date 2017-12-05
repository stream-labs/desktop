import test from 'ava';
import { useSpectron } from '../helpers/spectron';
import { getClient } from '../helpers/api-client';

useSpectron({ restartAppAfterEachTest: false, initApiClient: true });



test('The default scene exists', async t => {
  const client = await getClient();
  const scenes = await client.request('ScenesService', 'getScenes');

  t.true(scenes.length === 1);

});


test('Creating, fetching and removing scenes', async t => {
  const client = await getClient();

  const scene2 = await client.request('ScenesService', 'createScene', 'Scene2');
  t.is(scene2.name, 'Scene2');

  let scenes = await client.request('ScenesService', 'getScenes');
  let scenesNames = scenes.map(scene => scene.name);

  t.deepEqual(scenesNames, ['Scene', 'Scene2']);

  await client.request('ScenesService', 'removeScene', scenes[1].id);
  scenes = await client.request('ScenesService', 'getScenes');
  scenesNames = scenes.map(scene => scene.name);

  t.deepEqual(scenesNames, ['Scene']);
});


test('Switching between scenes', async t => {
  const client = await getClient();
  const scene = await client.request('ScenesService', 'getSceneByName', 'Scene');
  const scene2 = await client.request('ScenesService', 'createScene', 'Scene2');
  let activeSceneId = await client.request('ScenesService', 'activeSceneId');

  t.is(scene.id, activeSceneId);

  await client.request('ScenesService', 'makeSceneActive', scene2.id);
  activeSceneId = await client.request('ScenesService', 'activeSceneId');

  t.is(scene2.id, activeSceneId);

  await client.request('ScenesService', 'removeScene', scene2.id);
  activeSceneId = await client.request('ScenesService', 'activeSceneId');

  t.is(scene.id, activeSceneId);

});

test('Creating, fetching and removing scene-items', async t => {
  const client = await getClient();

  const scene = await client.request('ScenesService', 'getSceneByName', 'Scene');
  const image1 = await client.request(scene.resourceId, 'createAndAddSource', 'Image1', 'image_source');
  const image2 = await client.request(scene.resourceId, 'createAndAddSource', 'Image2', 'image_source');
  t.is(image1.name, 'Image1');

  let items = await client.request(scene.resourceId, 'getItems');
  let itemsNames = items.map(item => item.name);
  t.deepEqual(itemsNames, ['Image2', 'Image1']);


  await client.request(scene.resourceId, 'removeItem', image2.sceneItemId);
  items = await client.request(scene.resourceId, 'getItems');
  itemsNames = items.map(item => item.name);
  t.deepEqual(itemsNames, ['Image1']);

});


test('Scenes events', async t => {
  const client = await getClient();
  let lastEventData = null;
  const onEventHandler = (event) => {
    lastEventData = event;
  };

  await client.subscribe('ScenesService', 'sceneSwitched', onEventHandler);
  await client.subscribe('ScenesService', 'sceneAdded', onEventHandler);
  await client.subscribe('ScenesService', 'sceneRemoved', onEventHandler);
  await client.subscribe('ScenesService', 'itemAdded', onEventHandler);
  await client.subscribe('ScenesService', 'itemRemoved', onEventHandler);
  await client.subscribe('ScenesService', 'itemUpdated', onEventHandler);

  const scene2 = await client.request('ScenesService', 'createScene', 'Scene2');
  t.is(lastEventData.name, 'Scene2');

  const scene3 = await client.request('ScenesService', 'createScene', 'Scene3');
  t.is(lastEventData.name, 'Scene3');

  await client.request('ScenesService', 'makeSceneActive', scene2.id);
  t.is(lastEventData.name, 'Scene2');

  await client.request('ScenesService', 'removeScene', scene3.id);
  t.is(lastEventData.name, 'Scene3');


  const audioInput = await client.request(
    scene2.resourceId, 'createAndAddSource', 'AudioInput', 'wasapi_input_capture'
  );
  t.is(lastEventData.sceneItemId, audioInput.sceneItemId);


  await client.request(audioInput.resourceId, 'setVisibility', false);
  t.is(lastEventData.visible, false);

  lastEventData = null;
  await client.request(audioInput.resourceId, 'remove');
  t.is(lastEventData.sceneItemId, audioInput.sceneItemId);


  // test unsubscribing
  lastEventData = null;
  await client.unsubscribeAll();
  await client.request('ScenesService', 'removeScene', scene2.id);
  t.is(lastEventData, null);


});


test('Creating nested scenes', async t => {
  const client = await getClient();

  const sceneA = await client.request('ScenesService', 'createScene', 'SceneA');
  const sceneB = await client.request('ScenesService', 'createScene', 'SceneB');
  const sceneC = await client.request('ScenesService', 'createScene', 'SceneC');

  await client.request(sceneA.resourceId, 'addSource', sceneB.id);
  let sceneAItems = await client.request(sceneA.resourceId, 'getItems');
  let itemsANames = sceneAItems.map(item => item.name);

  t.deepEqual(itemsANames, ['SceneB']);

  await client.request(sceneC.resourceId, 'addSource', sceneA.id);
  const sceneCItems = await client.request(sceneC.resourceId, 'getItems');
  const itemsCNames = sceneCItems.map(item => item.name);

  t.deepEqual(itemsCNames, ['SceneA']);

  // Unable to add a source when the scene you are trying to add already contains your current scene
  await client.request(sceneA.resourceId, 'addSource', sceneC.id);
  sceneAItems = await client.request(sceneA.resourceId, 'getItems');
  itemsANames = sceneAItems.map(item => item.name);

  t.deepEqual(itemsANames, ['SceneB']);

});
