import test from 'ava';
import { useSpectron, focusMain } from './helpers/spectron/index';
import { addSource } from './helpers/spectron/sources';
import { addScene, clickRemoveScene, selectScene, openRenameWindow } from './helpers/spectron/scenes';
import { createNewSceneCollection } from './helpers/spectron/scene-collections';
import { getClient } from './helpers/api-client';
import { sleep } from './helpers/sleep';

useSpectron();

test.only('Creating a new scene collection', async t => {
  const app = t.context.app;
  await createNewSceneCollection(t, 'Test Collection');
  await sleep(10 * 1000);
});
