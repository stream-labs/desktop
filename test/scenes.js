import test from 'ava';
import { useSpectron, focusMain } from './helpers/spectron';
import { addSource } from './helpers/spectron/sources';
import { addScene, clickRemoveScene, selectScene } from './helpers/spectron/scenes';

useSpectron();

test('The default scene', async t => {
  const app = t.context.app;
  await focusMain(t);
  t.true(await app.client.isExisting('div=Scene'));
});

test.todo('Default audio sources in the default scene');

test('Adding and removing a scene', async t => {
  const app = t.context.app;
  const sceneName = 'Coolest Scene Ever';

  await addScene(t, sceneName);

  await focusMain(t);
  t.true(await app.client.isExisting(`div=${sceneName}`));

  await selectScene(t, sceneName);
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
