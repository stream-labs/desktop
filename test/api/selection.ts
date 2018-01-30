import test from 'ava';
import { useSpectron } from '../helpers/spectron';
import { ApiClient, getClient } from '../helpers/api-client';
import { IScenesServiceApi } from '../../app/services/scenes/scenes-api';
import { ISelectionServiceApi } from '../../app/services/selection/selection-api';

useSpectron({ restartAppAfterEachTest: false });


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

  const [color1, color2, color3] = scene.getItems();

  selection.select([color1.sceneItemId, color2.sceneItemId]);

  selection.rotate(90);

  t.is(color1.rotation, 90);
  t.is(color2.rotation, 90);
  t.is(color3.rotation, 0);

});
