import { useSpectron, test, TExecutionContext } from '../helpers/spectron';
import { addSource, sourceIsExisting } from '../helpers/modules/sources';
import { SceneBuilder } from '../helpers/scene-builder';
import { getClient } from '../helpers/api-client';
import {
  addScene,
  clickRemoveScene,
  selectScene,
  duplicateScene,
  sceneExisting,
} from '../helpers/modules/scenes';
import { focusMain } from '../helpers/modules/core';

useSpectron();

async function undo(t: TExecutionContext) {
  await ((t.context.app.client.keys(['Control', 'z']) as any) as Promise<any>);
  await ((t.context.app.client.keys('Control') as any) as Promise<any>);
}

async function redo(t: TExecutionContext) {
  await ((t.context.app.client.keys(['Control', 'y']) as any) as Promise<any>);
  await ((t.context.app.client.keys('Control') as any) as Promise<any>);
}

test('Creating some sources with undo/redo', async t => {
  await focusMain();

  await addSource('Color Source', 'Color Source');
  await addSource('Color Source', 'Color Source 2');
  await addSource('Color Source', 'Color Source 3');

  await focusMain();

  t.true(await sourceIsExisting('Color Source'));
  t.true(await sourceIsExisting('Color Source 2'));
  t.true(await sourceIsExisting('Color Source 3'));

  await undo(t);

  t.true(await sourceIsExisting('Color Source'));
  t.true(await sourceIsExisting('Color Source 2'));
  t.false(await sourceIsExisting('Color Source 3'));

  await undo(t);

  t.true(await sourceIsExisting('Color Source'));
  t.false(await sourceIsExisting('Color Source 2'));
  t.false(await sourceIsExisting('Color Source 3'));

  await undo(t);

  t.false(await sourceIsExisting('Color Source'));
  t.false(await sourceIsExisting('Color Source 2'));
  t.false(await sourceIsExisting('Color Source 3'));

  await redo(t);
  await redo(t);
  await redo(t);

  t.true(await sourceIsExisting('Color Source'));
  t.true(await sourceIsExisting('Color Source 2'));
  t.true(await sourceIsExisting('Color Source 3'));
});

test('Deleting a scene with undo/redo', async t => {
  const client = await getClient();
  const sceneBuilder = new SceneBuilder(client);

  await addScene('New Scene');

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

  await focusMain();
  await clickRemoveScene();

  t.true(sceneBuilder.isEqualTo(''));

  await undo(t);
  await selectScene('New Scene');

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
  await duplicateScene('Scene', 'Duplicate');
  await focusMain();

  await selectScene('Duplicate');
  t.true(sceneBuilder.isEqualTo(sketch));

  await selectScene('Scene');
  t.true(sceneBuilder.isEqualTo(sketch));

  await undo(t);

  t.false(await sceneExisting('Duplicate'));

  await redo(t);

  await selectScene('Duplicate');
  t.true(sceneBuilder.isEqualTo(sketch));
});
