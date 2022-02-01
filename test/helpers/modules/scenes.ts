// Scene helper functions
import { contextMenuClick } from '../spectron/context-menu';
import { dialogDismiss } from '../spectron/dialog';
import { click, clickButton, focusChild, focusMain, select, waitForLoader } from './core';
import { sleep } from '../sleep';

async function clickSceneAction(selector: string) {
  await click(`[rel=SceneSelector] ${selector}`);
}

export async function clickAddScene() {
  await clickSceneAction('.icon-add');
}

export async function clickRemoveScene() {
  await clickSceneAction('.icon-subtract');
  await dialogDismiss('OK');
}

export async function clickSceneTransitions() {
  await sleep(100);
  await clickSceneAction('.icon-settings');
}

export async function selectScene(name: string) {
  await click(`span=${name}`);
}

export async function rightClickScene(name: string) {
  await click(`span=${name}`, { button: 'right' });
}

export async function duplicateScene(sceneName: string, targetName: string) {
  await openDuplicateWindow(sceneName);
  await (await select('input')).setValue(targetName);
  await clickButton('Done');
}

export async function addScene(name: string) {
  await focusMain();
  await clickAddScene();
  await focusChild();
  await (await select('input')).setValue(name);
  await clickButton('Done');
}

export async function openRenameWindow(sceneName: string) {
  await focusMain();
  await rightClickScene(sceneName);
  await contextMenuClick('Rename');
  await focusChild();
}

export async function openDuplicateWindow(sceneName: string) {
  await focusMain();
  await rightClickScene(sceneName);
  await contextMenuClick('Duplicate');
  await focusChild();
}

export async function switchCollection(collectionName: string) {
  await focusMain();
  await click('.scene-collections-wrapper .dropdown-menu__toggle');
  await (
    await (await select('.scene-collections-wrapper')).$(`[data-name=${collectionName}]`)
  ).click();
  await waitForLoader();
}

export async function sceneExisting(name: string) {
  return (await (await select('[data-name=scene-selector]')).$(`span=${name}`)).isExisting();
}
