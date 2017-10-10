import test from 'ava';
import { sleep } from './helpers/sleep';
import { useSpectron, focusMain } from './helpers/spectron';
import { addSource } from './helpers/spectron/sources';
import { addScene, clickRemoveScene, selectScene } from './helpers/spectron/scenes';

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
  t.true(await app.client.isExisting(`li=${sourceName}`));

  // Adding a new scene will make that scene active, so we can't see
  // the source we just added.
  await addScene(t, sceneName);
  await focusMain(t);
  t.false(await app.client.isExisting(`li=${sourceName}`));

  // Switch back to the default scene
  await selectScene(t, 'Scene');
  t.true(await app.client.isExisting(`li=${sourceName}`));
});

test('Restarting the app preserves the default sources', async t => {
  const app = t.context.app;
  const sceneName = 'Coolest Scene Ever';

  await addScene(t, sceneName);

  await focusMain(t);
  t.true(await app.client.isExisting(`div=${sceneName}`));

  await t.context.app.restart();
  await sleep(5000);

  await focusMain(t);
  await selectScene(t, sceneName);
  await checkDefaultSources(t);
});
