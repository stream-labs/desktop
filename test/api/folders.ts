import test from 'ava';
import { useSpectron } from '../helpers/spectron';
import { getClient } from '../helpers/api-client';
import { IScenesServiceApi } from '../../app/services/scenes/scenes-api';
import { ISelectionServiceApi } from '../../app/services/selection';
import { ICustomizationServiceApi } from '../../app/services/customization';
import { SceneBuilder } from '../helpers/scene-builder';
import { sleep } from '../helpers/sleep';
import { ISceneApi } from "../../app/services/scenes";

useSpectron({ restartAppAfterEachTest: false, afterStartCb: afterStart });

let sceneBuilder: SceneBuilder;
let scene: ISceneApi;

async function afterStart() {
  const client = await getClient();
  sceneBuilder = new SceneBuilder(client);
  scene = sceneBuilder.scene;
}

test('Selection', async t => {


  // const client = await getClient();
  // const scenesService = client.getResource<IScenesServiceApi>('ScenesService');
  // const selection = client.getResource<ISelectionServiceApi>('SelectionService');
  // const scene = scenesService.activeScene;

  const nodes = sceneBuilder.build(`
    Folder1
    Folder2
      Item1:
      Item2:
  `);

  scene.getNodeByName('Item')

  await sleep(200000);
  t.pass();
});

