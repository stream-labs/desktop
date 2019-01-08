import test from 'ava';
import { useSpectron } from '../helpers/spectron';
import { getClient } from '../helpers/api-client';
import { IScenesServiceApi } from '../../app/services/scenes/scenes-api';
import { ISelectionServiceApi } from '../../app/services/selection';
import { ICustomizationServiceApi } from '../../app/services/customization';
import { SceneBuilder } from '../helpers/scene-builder';
import { ISceneApi, ISceneNodeApi } from "../../app/services/scenes";
import { sleep } from '../helpers/sleep';

useSpectron({ restartAppAfterEachTest: false, afterStartCb: afterStart });

let sceneBuilder: SceneBuilder;
let scene: ISceneApi;
let getNode: (name: string) => ISceneNodeApi;
let getNodeId: (name: string) => string;
let selectionService: ISelectionServiceApi;

async function afterStart() {
  const client = await getClient();
  selectionService = client.getResource('SelectionService');
  sceneBuilder = new SceneBuilder(client);
  scene = sceneBuilder.scene;
  getNode = name => scene.getNodeByName(name);
  getNodeId = name => scene.getNodeByName(name).id;
}

test('Selection', async t => {
  const client = await getClient();
  const scenesService = client.getResource<IScenesServiceApi>('ScenesService');
  const selection = client.getResource<ISelectionServiceApi>('SelectionService');
  const scene = scenesService.activeScene;

  const color1 = scene.createAndAddSource('Color1', 'color_source');
  const color2 = scene.createAndAddSource('Color2', 'color_source');
  const color3 = scene.createAndAddSource('Color3', 'color_source');

  selection.select(color2.sceneItemId);

  t.true(!selection.isSelected(color1.sceneItemId));
  t.true(selection.isSelected(color2.sceneItemId));
  t.true(!selection.isSelected(color3.sceneItemId));

  selection.add(color3.sceneItemId);

  t.true(!selection.isSelected(color1.sceneItemId));
  t.true(selection.isSelected(color2.sceneItemId));
  t.true(selection.isSelected(color3.sceneItemId));

  selection.deselect(color3.sceneItemId);

  t.true(!selection.isSelected(color1.sceneItemId));
  t.true(selection.isSelected(color2.sceneItemId));
  t.true(!selection.isSelected(color3.sceneItemId));

  selection.invert();

  t.true(selection.isSelected(color1.sceneItemId));
  t.true(!selection.isSelected(color2.sceneItemId));
  t.true(selection.isSelected(color3.sceneItemId));

  selection.reset();

  t.is(selection.getSize(), 0);

  selection.selectAll();

  t.is(selection.getSize(), 3);

});

test('Selection actions', async t => {
  const client = await getClient();
  const scenesService = client.getResource<IScenesServiceApi>('ScenesService');
  const selection = client.getResource<ISelectionServiceApi>('SelectionService');
  const scene = scenesService.activeScene;

  let [color1, color2, color3] = scene.getItems();

  selection.select([color1.sceneItemId, color2.sceneItemId]);

  selection.setSettings({ visible: false });

  [color1, color2, color3] = scene.getItems();

  t.is(color1.visible, false);
  t.is(color2.visible, false);
  t.is(color3.visible, true);
});

test('Invalid selection', async t => {
  const client = await getClient();
  const scenesService = client.getResource<IScenesServiceApi>('ScenesService');
  const selection = client.getResource<ISelectionServiceApi>('SelectionService');
  const anotherScene = scenesService.createScene('Another scene');
  const colorFromAnotherScene = anotherScene.createAndAddSource('MyColor', 'color_source');
  const [colorSource] = scenesService.activeScene.getItems();

  // invalid ids must be ignored
  selection.select([colorSource.sceneItemId, 'this_is_an_invalid_id']);
  t.deepEqual(selection.getIds(), [colorSource.sceneItemId]);

  // ids must be only from active scene
  selection.select([colorSource.sceneItemId, colorFromAnotherScene.sceneItemId]);
  t.deepEqual(selection.getIds(), [colorSource.sceneItemId]);
});

test('Place after', async t => {
  sceneBuilder.build(`
    Item1:
    Folder1
      Item2:
      Item3:
    Item4:
  `);

  selectionService.select([getNodeId('Item1'), getNodeId('Folder1')]);
  selectionService.placeAfter(getNodeId('Item4'));

  t.true(
    sceneBuilder.isEqualTo(`
    Item4:
    Item1:
    Folder1
      Item2:
      Item3:
  `),
  );
});

test('Place after folder with deep nesting', async t => {
  sceneBuilder.build(`
    Folder1
      Item1:
      Folder2
        Item2:
    Item4:
  `);

  selectionService.select(getNodeId('Folder1'));
  selectionService.placeAfter(getNodeId('Item4'));

  t.true(
    sceneBuilder.isEqualTo(`
    Item4:
    Folder1
      Item1:
      Folder2
        Item2:
  `),
  );
});

test('Place before', async t => {
  sceneBuilder.build(`
    Item1:
    Item2:
    Folder1
      Item3:
      Item4:
  `);

  selectionService.select([getNodeId('Item2'), getNodeId('Folder1')]);
  selectionService.placeBefore(getNodeId('Item1'));

  t.true(
    sceneBuilder.isEqualTo(`
    Item2:
    Folder1
      Item3:
      Item4:
    Item1:
  `),
  );
});

test('Set parent', async t => {
  sceneBuilder.build(`
    Folder1
    Folder2
      Item1:
      Item2:
    Item3:
  `);

  selectionService.select([getNodeId('Folder2'), getNodeId('Item3')]);
  selectionService.setParent(getNodeId('Folder1'));

  t.true(
    sceneBuilder.isEqualTo(`
    Folder1
      Folder2
        Item1:
        Item2:
      Item3:
  `),
  );
});


test('Scale', async t => {

  // create and select 2 400x400 color sources
  sceneBuilder.build(`
      Item1: color_source
      Item2: color_source
  `);

  // TODO: find a reason why this test fails without `sleep` here
  await sleep(1000);

  selectionService.select([getNodeId('Item1'), getNodeId('Item2')]);
  const item1 = scene.getItem(getNodeId('Item1'));
  const item2 = scene.getItem(getNodeId('Item2'));

  // set the item2 position into the bottom right corner of item 2
  item2.setTransform({ position: { x: 400, y: 400 }});

  // reduce the size of item2 by 2x
  item2.setScale({ x: 0.5, y: 0.5 }, { x: 0, y: 0});

  // check what everything is going well at this point
  t.deepEqual(item2.getModel().transform.position, {
    x: 400,
    y: 400
  });
  t.deepEqual(item2.getModel().transform.scale, {
    x: 0.5,
    y: 0.5
  });

  // reduce the size of selected items by 2x, use the NorthWest anchor
  selectionService.scale({x: 0.5, y: 0.5}, { x: 0, y: 0});
  t.deepEqual(item1.getModel().transform.position, {
    x: 0,
    y: 0
  });
  t.deepEqual(item1.getModel().transform.scale, {
    x: 0.5,
    y: 0.5
  });
  t.deepEqual(item2.getModel().transform.position, {
    x: 200,
    y: 200
  });
  t.deepEqual(item2.getModel().transform.scale, {
    x: 0.25,
    y: 0.25
  });

  // reduce the size of selected items by 2x, use the East anchor
  // scale only X coordinate
  selectionService.scale({x: 0.5, y: 1}, { x: 1, y: 0.5});
  t.deepEqual(item1.getModel().transform.position, {
    x: 150,
    y: 0
  });
  t.deepEqual(item1.getModel().transform.scale, {
    x: 0.25,
    y: 0.5
  });
  t.deepEqual(item2.getModel().transform.position, {
    x: 250,
    y: 200
  });
  t.deepEqual(item2.getModel().transform.scale, {
    x: 0.125,
    y: 0.25
  });

});
