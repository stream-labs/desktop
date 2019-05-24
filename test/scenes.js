import { useSpectron, focusMain, test } from './helpers/spectron/index';
import { addSource, sourceIsExisting } from './helpers/spectron/sources';
import {
  addScene,
  clickRemoveScene,
  selectScene,
  openRenameWindow,
  openDuplicateWindow
} from './helpers/spectron/scenes';
import { getClient } from './helpers/api-client';

useSpectron();

// Checks for the default audio sources
async function checkDefaultSources(t) {
  const app = t.context.app;
  await focusMain(t);
  t.true(await app.client.isExisting('div=Mic/Aux'));
  t.true(await app.client.isExisting('div=Desktop Audio'));
}

test('The default scene', async t => {
  const app = t.context.app;
  await focusMain(t);
  t.true(await app.client.isExisting('div=Scene'));
  await checkDefaultSources(t);
});

test('Adding and removing a scene', async t => {
  const app = t.context.app;
  const sceneName = 'Coolest Scene Ever';

  await addScene(t, sceneName);

  await focusMain(t);
  t.true(await app.client.isExisting(`div=${sceneName}`));

  await selectScene(t, sceneName);
  await checkDefaultSources(t);
  await clickRemoveScene(t);

  t.false(await app.client.isExisting(`div=${sceneName}`));
});

test('Scene switching with sources', async t => {
  const app = t.context.app;
  const sceneName = 'Coolest Scene Ever';
  const sourceName = 'Awesome Source';

  await addSource(t, 'Color Source', sourceName);

  await focusMain(t);
  t.true(await sourceIsExisting(t, sourceName));

  // Adding a new scene will make that scene active, so we can't see
  // the source we just added.
  await addScene(t, sceneName);
  await focusMain(t);
  t.false(await sourceIsExisting(t, sourceName));

  // Switch back to the default scene
  await selectScene(t, 'Scene');
  t.true(await sourceIsExisting(t, sourceName));
});

test('Restarting the app preserves the default sources', async t => {
  const client = await getClient();
  const app = t.context.app;
  const sceneName = 'Coolest Scene Ever';
  const sceneCollectionsService = client.getResource('SceneCollectionsService');

  await addScene(t, sceneName);

  await focusMain(t);
  t.true(await app.client.isExisting(`div=${sceneName}`));

  // reload config
  await sceneCollectionsService.load(sceneCollectionsService.collections[0].id);

  await focusMain(t);
  await selectScene(t, sceneName);
  await checkDefaultSources(t);
});


test('Rename scene', async t => {
  const app = t.context.app;
  const newSceneName = 'Scene2';

  await openRenameWindow(t, 'Scene');
  await app.client.setValue('input', newSceneName);
  await app.client.click('button=Done');

  await focusMain(t);

  t.true(await app.client.isExisting(`div=${newSceneName}`));
});


test('Duplicate scene', async t => {
  const app = t.context.app;
  const sceneName = 'My Scene';
  await addScene(t, sceneName);
  await focusMain(t);
  t.true(await app.client.isExisting(`div=${sceneName}`));
  await openDuplicateWindow(t, sceneName);
  await app.client.click('button=Done');
  await focusMain(t);
  t.true(await app.client.isExisting(`div=${sceneName} (1)`));
});
