import { runWithSpectron, test } from '../helpers/spectron';
import { addSource, sourceIsExisting } from '../helpers/modules/sources';
import {
  addScene,
  clickRemoveScene,
  selectScene,
  openRenameWindow,
  openDuplicateWindow,
} from '../helpers/modules/scenes';
import { getApiClient } from '../helpers/api-client';
import { SceneCollectionsService } from 'app-services';
import { clickButton, focusMain, select, waitForDisplayed } from '../helpers/modules/core';

runWithSpectron();

// Checks for the default audio sources
async function checkDefaultSources() {
  await focusMain();
  await waitForDisplayed('div=Mic/Aux');
  await waitForDisplayed('div=Desktop Audio');
}

test('The default scene', async t => {
  await focusMain();
  await waitForDisplayed('div=Scene');
  await checkDefaultSources();
  t.pass();
});

test('Adding and removing a scene', async t => {
  const sceneName = 'Coolest Scene Ever';

  await addScene(sceneName);

  await focusMain();
  await waitForDisplayed(`div=${sceneName}`);

  await selectScene(sceneName);
  await checkDefaultSources();
  await clickRemoveScene();

  t.false(await (await select(`div=${sceneName}`)).isExisting());
});

test('Scene switching with sources', async t => {
  const sceneName = 'Coolest Scene Ever';
  const sourceName = 'Awesome Source';

  await addSource('Color Source', sourceName);

  await focusMain();
  t.true(await sourceIsExisting(sourceName));

  // Adding a new scene will make that scene active, so we can't see
  // the source we just added.
  await addScene(sceneName);
  await focusMain();
  t.false(await sourceIsExisting(sourceName));

  // Switch back to the default scene
  await selectScene('Scene');
  t.true(await sourceIsExisting(sourceName));
});

test('Restarting the app preserves the default sources', async t => {
  const client = await getApiClient();
  const sceneName = 'Coolest Scene Ever';
  const sceneCollectionsService = client.getResource<SceneCollectionsService>(
    'SceneCollectionsService',
  );

  await addScene(sceneName);

  await focusMain();
  await waitForDisplayed(`div=${sceneName}`);

  // reload config
  await sceneCollectionsService.load(sceneCollectionsService.collections[0].id);

  await focusMain();
  await selectScene(sceneName);
  await checkDefaultSources();
  t.pass();
});

test('Rename scene', async t => {
  const newSceneName = 'Scene2';
  await openRenameWindow('Scene');
  await (await select('input')).setValue(newSceneName);
  await clickButton('Done');
  await focusMain();
  await waitForDisplayed(`div=${newSceneName}`);
  t.pass();
});

test('Duplicate scene', async t => {
  const sceneName = 'My Scene';
  await addScene(sceneName);
  await focusMain();
  await waitForDisplayed(`div=${sceneName}`);
  await openDuplicateWindow(sceneName);
  await clickButton('Done');
  await focusMain();
  await waitForDisplayed(`div=${sceneName} (1)`);
  t.pass();
});
