import { useSpectron, test, focusMain, TExecutionContext } from './helpers/spectron/index';
import { addSource, sourceIsExisting } from './helpers/spectron/sources';
import { SceneBuilder } from './helpers/scene-builder';
import { getClient } from './helpers/api-client';
import {
  addScene,
  clickRemoveScene,
  selectScene,
  duplicateScene,
  sceneExisting,
} from './helpers/spectron/scenes';
import { sleep } from './helpers/sleep';

useSpectron();

async function undo(t: TExecutionContext) {
  await t.context.app.client.click('.fa-undo');
}

async function redo(t: TExecutionContext) {
  await t.context.app.client.click('.fa-redo');
}

test('Creating some sources with undo/redo', async t => {
  await focusMain(t);

  await addSource(t, 'Color Source', 'Color Source 1');
  await addSource(t, 'Color Source', 'Color Source 2');
  await addSource(t, 'Color Source', 'Color Source 3');

  await focusMain(t);

  t.true(await sourceIsExisting(t, 'Color Source 1'));
  t.true(await sourceIsExisting(t, 'Color Source 2'));
  t.true(await sourceIsExisting(t, 'Color Source 3'));

  await undo(t);

  t.true(await sourceIsExisting(t, 'Color Source 1'));
  t.true(await sourceIsExisting(t, 'Color Source 2'));
  t.false(await sourceIsExisting(t, 'Color Source 3'));

  await undo(t);

  t.true(await sourceIsExisting(t, 'Color Source 1'));
  t.false(await sourceIsExisting(t, 'Color Source 2'));
  t.false(await sourceIsExisting(t, 'Color Source 3'));

  await undo(t);

  t.false(await sourceIsExisting(t, 'Color Source 1'));
  t.false(await sourceIsExisting(t, 'Color Source 2'));
  t.false(await sourceIsExisting(t, 'Color Source 3'));

  await redo(t);
  await redo(t);
  await redo(t);

  t.true(await sourceIsExisting(t, 'Color Source 1'));
  t.true(await sourceIsExisting(t, 'Color Source 2'));
  t.true(await sourceIsExisting(t, 'Color Source 3'));
});

test('Deleting a scene with undo/redo', async t => {
  const client = await getClient();
  const sceneBuilder = new SceneBuilder(client);

  await addScene(t, 'New Scene');

  // Build a complex item and folder hierarchy
  const sketch = `
    Item1:
    Item2:
    Folder1
      Item3:
      Item4:
    Item5:
    Folder2
      Item6:
      Folder3
        Item7:
        Item8:
      Item9:
      Folder4
        Item10:
    Item11:
  `;

  sceneBuilder.build(sketch);

  await focusMain(t);
  await clickRemoveScene(t);

  t.true(sceneBuilder.isEqualTo(''));

  await undo(t);
  await selectScene(t, 'New Scene');

  t.true(sceneBuilder.isEqualTo(sketch));

  await redo(t);
  t.true(sceneBuilder.isEqualTo(''));
});

test('Duplicating a scene with undo/redo', async t => {
  const client = await getClient();
  const sceneBuilder = new SceneBuilder(client);

  // Build a complex item and folder hierarchy
  const sketch = `
    Item1:
    Item2:
    Folder1
      Item3:
      Item4:
    Item5:
    Folder2
      Item6:
      Folder3
        Item7:
        Item8:
      Item9:
      Folder4
        Item10:
    Item11:
  `;

  sceneBuilder.build(sketch);
  await duplicateScene(t, 'Scene', 'Duplicate');
  await focusMain(t);

  await selectScene(t, 'Duplicate');
  t.true(sceneBuilder.isEqualTo(sketch));

  await selectScene(t, 'Scene');
  t.true(sceneBuilder.isEqualTo(sketch));

  await undo(t);

  t.false(await sceneExisting(t, 'Duplicate'));

  await redo(t);

  await selectScene(t, 'Duplicate');
  t.true(sceneBuilder.isEqualTo(sketch));
});
