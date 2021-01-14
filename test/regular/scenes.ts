import { useSpectron, focusMain, test, TExecutionContext } from '../helpers/spectron';
import { addSource, sourceIsExisting } from '../helpers/spectron/sources';
import {
  addScene,
  clickRemoveScene,
  selectScene,
  openRenameWindow,
  openDuplicateWindow,
} from '../helpers/spectron/scenes';
import { getClient } from '../helpers/api-client';
import { SceneCollectionsService } from 'app-services';

useSpectron();

// Checks for the default audio sources
async function checkDefaultSources(t: TExecutionContext) {
  const app = t.context.app;
  await focusMain(t);
  t.true(await (await app.client.$('div=Mic/Aux')).isExisting());
  t.true(await (await app.client.$('div=Desktop Audio')).isExisting());
}

test('The default scene', async t => {
  const app = t.context.app;
  await focusMain(t);
  t.true(await (await app.client.$('div=Scene')).isExisting());
  await checkDefaultSources(t);
});

test('Adding and removing a scene', async t => {
  const app = t.context.app;
  const sceneName = 'Coolest Scene Ever';

  await addScene(t, sceneName);

  await focusMain(t);
  t.true(await (await app.client.$(`div=${sceneName}`)).isExisting());

  await selectScene(t, sceneName);
  await checkDefaultSources(t);
  await clickRemoveScene(t);

  t.false(await (await app.client.$(`div=${sceneName}`)).isExisting());
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
  const sceneCollectionsService = client.getResource<SceneCollectionsService>(
    'SceneCollectionsService',
  );

  await addScene(t, sceneName);

  await focusMain(t);
  t.true(await (await app.client.$(`div=${sceneName}`)).isExisting());

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
  await (await app.client.$('input')).setValue(newSceneName);
  await (await app.client.$('button=Done')).click();

  await focusMain(t);

  t.true(await (await app.client.$(`div=${newSceneName}`)).isExisting());
});

test('Duplicate scene', async t => {
  const app = t.context.app;
  const sceneName = 'My Scene';
  await addScene(t, sceneName);
  await focusMain(t);
  t.true(await (await app.client.$(`div=${sceneName}`)).isExisting());
  await openDuplicateWindow(t, sceneName);
  await (await app.client.$('button=Done')).click();
  await focusMain(t);
  t.true(await (await app.client.$(`div=${sceneName} (1)`)).isExisting());
});
