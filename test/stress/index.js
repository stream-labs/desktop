// The stress test will not be run when normally running tests.

import test from 'ava';
import { uniqueId, random, sample } from 'lodash';
import { useSpectron, focusMain } from '../helpers/spectron';
import { addScene, selectScene, clickRemoveScene } from '../helpers/spectron/scenes';
import { addSource, selectSource, clickRemoveSource } from '../helpers/spectron/sources';

useSpectron();

const SOURCE_TYPES = [
  'Image',
  'Color Source',
  'Image Slide Show',
  'BrowserSource',
  'Media Source',
  'Text (GDI+)',
  'Text (FreeType 2)',
  'Display Capture',
  'Window Capture',
  'Game Capture',
  'Video Capture Device',
  'Audio Input Capture',
  'Audio Output Capture'
];

// Utilities

async function getSceneElements(t) {
  return t.context.app.client.$('h4=Scenes').$('../..').$$('li');
}

async function getSourceElements(t) {
  return t.context.app.client.$('h4=Sources').$('../..').$$('li');
}


// Actions

async function addRandomScene(t) {
  const name = uniqueId('scene_');

  await focusMain(t);
  await addScene(t, name);
}

async function removeRandomScene(t) {
  await focusMain(t);
  const scenes = await getSceneElements(t);

  if (scenes.length > 1) {
    const scene = sample(scenes);
    await t.context.app.client.elementIdClick(scene.value.ELEMENT);
    await clickRemoveScene(t);
  }
}

async function selectRandomScene(t) {
  await focusMain(t);
  const scenes = await getSceneElements(t);

  if (scenes.length > 0) {
    const scene = sample(scenes);
    await t.context.app.client.elementIdClick(scene.value.ELEMENT);
  }
}

async function addRandomSource(t) {
  const type = sample(SOURCE_TYPES);
  const name = uniqueId('source_');

  await focusMain(t);
  await addSource(t, type, name);
}

async function removeRandomSource(t) {
  await focusMain(t);
  const sources = await getSourceElements(t);

  if (sources.length > 0) {
    const source = sample(sources);
    await t.context.app.client.elementIdClick(source.value.ELEMENT);
    await clickRemoveSource(t);
  }
}

async function selectRandomSource(t) {
  await focusMain(t);
  const sources = await getSourceElements(t);

  if (sources.length > 0) {
    const source = sample(sources);
    await t.context.app.client.elementIdClick(source.value.ELEMENT);
  }
}

const ACTION_FUNCTIONS = [
  addRandomScene,
  removeRandomScene,
  selectRandomScene,
  addRandomSource,
  removeRandomSource,
  selectRandomSource
];

test('Stress test', async t => {
  let quit = false;

  // We shouldn't need to wait long for this test
  t.context.app.client.timeouts('implicit', 500);

  // Quit after 1 hour
  setTimeout(() => {
    t.pass();
    quit = true;
  }, 60 * 60 * 1000);

  while(!quit) {
    await sample(ACTION_FUNCTIONS)(t);
  }
});
