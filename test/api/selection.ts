import test from 'ava';
import { useSpectron } from '../helpers/spectron';
import { getClient } from '../helpers/api-client';
import { IScenesServiceApi } from '../../app/services/scenes/scenes-api';
import { ISelectionServiceApi } from '../../app/services/selection';
import { ICustomizationServiceApi } from '../../app/services/customization';

useSpectron({ restartAppAfterEachTest: false });

test.beforeEach(async t => {
  const client = await getClient();
  const customizationService = client.getResource<ICustomizationServiceApi>('CustomizationService');
  customizationService.setSettings({ experimental: { multiselect: true } });
});

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
