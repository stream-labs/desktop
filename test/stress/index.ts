// The stress test will not be run when normally running tests.

import { uniqueId, sample } from 'lodash';
import { runWithSpectron, TExecutionContext, test } from '../helpers/spectron/index';
import { addScene, clickRemoveScene } from '../helpers/modules/scenes';
import { addSource, clickRemoveSource, rightClickSource } from '../helpers/modules/sources';
import { contextMenuClick } from '../helpers/spectron/context-menu';
import { closeWindow, focusMain, focusWindow } from '../helpers/modules/core';

runWithSpectron();

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
  'Audio Output Capture',
];

type TSourceName = string;

// Utilities

async function getSceneElements(t: TExecutionContext) {
  return (await t.context.app.client.$('.selector-list')).$$('li');
}

async function getSourceElements(t: TExecutionContext) {
  return (await (await t.context.app.client.$('h2=Sources')).$('../..')).$$(
    '.sl-vue-tree-node-item',
  );
}

// Actions

async function addRandomScene(t: TExecutionContext) {
  const name = uniqueId('scene_');

  await focusMain();
  await addScene(name);
}

async function removeRandomScene(t: TExecutionContext) {
  await focusMain();
  const scenes = await getSceneElements(t);

  if (scenes.length > 1) {
    const scene = sample(scenes);
    await await scene.click();
    await clickRemoveScene();
  }
}

async function selectRandomScene(t: TExecutionContext) {
  await focusMain();
  const scenes = await getSceneElements(t);

  if (scenes.length > 0) {
    const scene = sample(scenes);
    await await scene.click();
  }
}

async function addRandomSource(t: TExecutionContext) {
  const type = sample(SOURCE_TYPES);
  const name = `${type} ${uniqueId()}`;

  console.log('  Source:', name);

  await focusMain();
  await addSource(type, name);
}

async function removeRandomSource(t: TExecutionContext) {
  await focusMain();
  const sources = await getSourceElements(t);

  if (sources.length > 0) {
    const source = sample(sources);
    const text = await source.getText();

    console.log('  Source:', text);

    await source.click();
    await clickRemoveSource();
  }
}

async function selectRandomSource(t: TExecutionContext): Promise<TSourceName> {
  await focusMain();
  const sources = await getSourceElements(t);

  if (sources.length > 0) {
    const source = sample(sources);
    await source.click();
    const text = await source.getText();

    console.log('  Source:', text);

    return text;
  }

  return '';
}

async function createProjector(t: TExecutionContext) {
  await focusMain();
  const sourceName = await selectRandomSource(t);
  if (!sourceName) return;
  await rightClickSource(sourceName);
  await contextMenuClick(['Projector', 'Create Source Projector']);
}

async function destroyProjector(t: TExecutionContext) {
  if (await focusWindow(/windowId=(?!main)(?!child)/)) {
    await closeWindow('child');
  }
  await focusMain();
}

async function toggleDayNightMode(t: TExecutionContext) {
  await focusMain();
  await (await t.context.app.client.$('button.theme-toggle')).click();
}

async function toggleStudioNode(t: TExecutionContext) {
  await focusMain();
  await (await t.context.app.client.$('.icon-studio-mode-3')).click();
}

const ACTION_FUNCTIONS = [
  addRandomScene,
  removeRandomScene,
  selectRandomScene,
  addRandomSource,
  removeRandomSource,
  selectRandomSource,
  createProjector,
  destroyProjector,
  toggleDayNightMode,
  toggleStudioNode,
];

test('Stress test', async (t: TExecutionContext) => {
  let quit = false;

  // Quit after 1 hour
  setTimeout(() => {
    t.pass();
    quit = true;
  }, 60 * 60 * 1000);

  while (!quit) {
    const action = sample(ACTION_FUNCTIONS);
    console.log(action.name);
    await action(t);
  }
});
