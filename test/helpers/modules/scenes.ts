// Scene helper functions
import { contextMenuClick } from '../spectron/context-menu';
import { dialogDismiss } from '../spectron/dialog';
import { click, clickButton, focusChild, focusMain, select, waitForLoader } from './core';
import { sleep } from '../sleep';
import { useForm } from './forms';

async function clickSceneAction(selector: string) {
  await click(`[data-name=SceneSelector] ${selector}`);
}

export async function clickAddScene() {
  await clickSceneAction('.icon-add-circle');
}

export async function clickRemoveScene(name: string) {
  const $el = await (await select(`[data-name="${name}"]`)).$('.icon-trash');
  await $el.click();
  await dialogDismiss('OK');
}

export async function clickSceneTransitions() {
  await sleep(100);
  await clickSceneAction('.icon-transition');
}

export async function selectScene(name: string) {
  await click(`span=${name}`);
}

export async function rightClickScene(name: string) {
  await click(`span=${name}`, { button: 'right' });
}

export async function duplicateScene(sceneName: string, targetName: string) {
  await openDuplicateWindow(sceneName);
  const { fillForm } = useForm('nameSceneForm');
  await fillForm({ sceneName: targetName });
  await clickButton('Done');
}

export async function addScene(name: string) {
  await focusMain();
  await clickAddScene();
  await focusChild();
  const { fillForm } = useForm('nameSceneForm');
  await fillForm({ sceneName: name });
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
  await click('[data-name=SceneSelectorDropdown]');
  await (await (await select('.ant-dropdown')).$(`[data-name="${collectionName}"]`)).click();
  await waitForLoader();
}

export async function sceneExisting(name: string) {
  return (await (await select('[data-name=SceneSelector]')).$(`span=${name}`)).isExisting();
}
