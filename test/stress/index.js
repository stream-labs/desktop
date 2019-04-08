// The stress test will not be run when normally running tests.

import test from 'ava';
import uniqueId from 'lodash/uniqueId';
import sample from 'lodash/sample';
import { useSpectron, focusMain } from '../helpers/spectron/index';
import { addScene, clickRemoveScene } from '../helpers/spectron/scenes';
import { addSource, clickRemoveSource } from '../helpers/spectron/sources';

useSpectron();

const SOURCE_TYPES = [
  'Image',
  'Color Source',
  'Image Slide Show',
  'Browser Source',
  'Media Source',
  'Text (GDI+)',
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
  const name = `${type} ${uniqueId()}`;

  console.log('  Source:', name);

  await focusMain(t);
  await addSource(t, type, name);
}

async function removeRandomSource(t) {
  await focusMain(t);
  const sources = await getSourceElements(t);

  if (sources.length > 0) {
    const source = sample(sources);
    const text = await t.context.app.client.elementIdText(source.value.ELEMENT);

    console.log('  Source:', text.value);

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

  // Quit after 1 hour
  setTimeout(() => {
    t.pass();
    quit = true;
  }, 60 * 60 * 1000);

  while(!quit) {
    const action = sample(ACTION_FUNCTIONS);
    console.log(action.name);
    await action(t);
  }
});
