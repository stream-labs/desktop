import { startApp, stopApp, test, useSpectron } from './helpers/spectron';

import { getClient } from './helpers/api-client';
import { ScenesService } from 'services/scenes';
import { sleep } from './helpers/sleep';
const path = require('path');
import fse = require('fs-extra');
import fs = require('fs');
import os = require('os');
import { logIn } from './helpers/spectron/user';
import { SceneCollectionsService } from 'services/api/external-api/scene-collections';

useSpectron({ appArgs: '--nosync' });

test('Media backup', async t => {
  // copy images to the temporary folder
  console.log('copy');
  const imagesDir = path.resolve(__dirname, '..', '..', 'test', 'data', 'sources-files', 'images');
  const tmpDir = fs.mkdtempSync(os.tmpdir());
  fse.copySync(imagesDir, tmpDir);

  await logIn(t);
  const api = await getClient();
  const collectionsService = api.getResource<SceneCollectionsService>('SceneCollectionsService');
  const collection = await collectionsService.create({ name: 'Test collection' });
  const scene = api.getResource<ScenesService>('ScenesService').activeScene;

  const item1 = scene.createAndAddSource('image', 'image_source', {
    file: path.resolve(tmpDir, 'moon.png'),
  });

  const item2 = scene.addSource(item1.getSource().duplicate().sourceId);
  item2.getSource().updateSettings({
    file: path.resolve(tmpDir, 'sun.png'),
  });

  await stopApp(false);

  fse.removeSync(tmpDir);

  await startApp(t);

  await sleep(20000);
  await collectionsService.delete(collection.id);
  await sleep(20000);
  t.pass();
});
