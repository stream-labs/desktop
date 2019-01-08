import test from 'ava';
import { useSpectron } from '../helpers/spectron';
import { getClient } from '../helpers/api-client';
import { SceneBuilder } from '../helpers/scene-builder';
import { ISceneApi, ISceneNodeApi } from '../../app/services/scenes';
import { sleep } from '../helpers/sleep';

useSpectron({ restartAppAfterEachTest: false, afterStartCb: afterStart });

let sceneBuilder: SceneBuilder;
let scene: ISceneApi;
let getNode: (name: string) => ISceneNodeApi;
let getNodeId: (name: string) => string;

async function afterStart() {
  const client = await getClient();
  sceneBuilder = new SceneBuilder(client);
  scene = sceneBuilder.scene;
  getNode = name => scene.getNodeByName(name);
  getNodeId = name => scene.getNodeByName(name).id;
}

test('Place after and place before', async t => {
  sceneBuilder.build(`
    Folder1
    Item1:
    Item2:
    Folder2
  `);

  getNode('Item1').placeBefore(getNodeId('Folder1'));
  getNode('Item2').placeAfter(getNodeId('Folder2'));

  await sleep(2000);

  t.true(
    sceneBuilder.isEqualTo(`
    Item1:
    Folder1
    Folder2
    Item2:
  `)
  );
});

test('Place item after non-empty folder', async t => {
  sceneBuilder.build(`
    Item1:
    Item2:
    Folder1
      Item3:
      Item4:
    Folder2
  `);

  getNode('Item1').placeAfter(getNodeId('Folder1'));
  getNode('Item2').setParent(getNodeId('Folder1'));
  getNode('Item2').placeAfter(getNodeId('Folder1'));

  t.true(
    sceneBuilder.isEqualTo(`
    Folder1
      Item2:
      Item3:
      Item4:
    Item1:
    Folder2
  `)
  );
});

test('Move a folder with deep nesting', async t => {
  sceneBuilder.build(`
    Folder1
      Item1
      Folder3
        item4:
        Folder4
          item5:
    Folder2
  `);

  getNode('Folder1').setParent(getNodeId('Folder2'));

  t.true(
    sceneBuilder.isEqualTo(`
    Folder2
      Folder1
        Item1
        Folder3
          item4:
          Folder4
            item5:
  `)
  );
});

test('Remove non-empty folder', async t => {
  sceneBuilder.build(`
    Folder1
      Item1
      Folder3
        item4:
        Folder4
          item5:
    Folder2
  `);

  getNode('Folder1').remove();

  t.true(
    sceneBuilder.isEqualTo(`
    Folder2
  `)
  );
});

test('Try to insert a folder inside itself', async t => {
  sceneBuilder.build(`
    Folder1
      Folder2
  `);

  getNode('Folder1').setParent(getNodeId('Folder2'));

  t.true(
    sceneBuilder.isEqualTo(`
    Folder1
      Folder2
  `)
  );
});

test('Move multiple items', async t => {
  sceneBuilder.build(`
    Folder1
      Item1
    Folder2
      Item2
    Folder3
  `);

  const selection = scene.getSelection([getNodeId('Item1'), getNodeId('Item2')]);
  selection.placeAfter(getNodeId('Folder3'));

  t.true(
    sceneBuilder.isEqualTo(`
    Folder1
    Folder2
    Folder3
    Item1
    Item2
  `)
  );
});
