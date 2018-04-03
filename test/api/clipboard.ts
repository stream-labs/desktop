import test from 'ava';
import { useSpectron } from '../helpers/spectron';
import { getClient } from '../helpers/api-client';
import { SceneBuilder } from '../helpers/scene-builder';
import { ISceneApi, ISceneNodeApi } from '../../app/services/scenes';
import { ISelectionServiceApi } from 'services/selection';
import { IClipboardServiceApi } from 'services/clipboard';

useSpectron({ restartAppAfterEachTest: false, afterStartCb: afterStart });

let sceneBuilder: SceneBuilder;
let scene: ISceneApi;
let getNode: (name: string) => ISceneNodeApi;
let getNodeId: (name: string) => string;
let selectionService: ISelectionServiceApi;
let clipboardService: IClipboardServiceApi;

async function afterStart() {
  const client = await getClient();
  selectionService = client.getResource('SelectionService');
  clipboardService = client.getResource('ClipboardService');
  sceneBuilder = new SceneBuilder(client);
  scene = sceneBuilder.scene;
  getNode = (name) => scene.getNodeByName(name);
  getNodeId = (name) => scene.getNodeByName(name).id;
}

test('Simple copy/paste', async t => {

  sceneBuilder.build(`
    Folder1
    Item1: color_source
    Item2: image
  `);

  selectionService.select([getNodeId('Folder1'), getNodeId('Item2')]);
  clipboardService.copy();
  clipboardService.pasteReference();

  t.true(sceneBuilder.isEqualTo(`
    Folder1
    Item2: image
    Folder1
    Item1: color_source
    Item2: image
  `));


});


test('Copy/paste folder with items', async t => {

  sceneBuilder.build(`
    Folder1
    Folder2
      Item1:
      Folder3
        Item2:
  `);

  selectionService.select(getNodeId('Folder2'));
  clipboardService.copy();
  clipboardService.pasteReference();

  t.true(sceneBuilder.isEqualTo(`
    Folder2
      Item1:
      Folder3
        Item2:
    Folder1
    Folder2
      Item1:
      Folder3
        Item2:
  `));
});



test('Clear clipboard', async t => {

  sceneBuilder.build(`
    Folder1
    Item1:
  `);

  selectionService.selectAll();
  clipboardService.copy();
  clipboardService.clear();
  clipboardService.pasteReference();

  t.true(sceneBuilder.isEqualTo(`
    Folder1
    Item1:
  `));
});

