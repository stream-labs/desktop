// Scene helper functions
import { focusMain, focusChild } from '.';
import { contextMenuClick } from './context-menu';
import { dialogDismiss } from './dialog';

async function clickSceneAction(t, selector) {
  await t.context.app.client
    .$('[rel=SceneSelector]')
    .click(selector);
}

export async function clickAddScene(t) {
  await clickSceneAction(t, '.icon-add');
}

export async function clickRemoveScene(t) {
  await clickSceneAction(t, '.icon-subtract');
  await dialogDismiss(t, 'OK');
}

export async function clickSceneTransitions(t) {
  await clickSceneAction(t, '.icon-settings');
}

export async function selectScene(t, name) {
  await t.context.app.client.click(`div=${name}`);
}

export async function rightClickScene(t, name) {
  await t.context.app.client.rightClick(`div=${name}`);
}

export async function addScene(t, name) {
  const app = t.context.app;

  await focusMain(t);
  await clickAddScene(t);
  await focusChild(t);
  await app.client.setValue('input', name);
  await app.client.click('button=Done');
}

export async function openRenameWindow(t, sourceName) {
  await focusMain(t);
  await rightClickScene(t, sourceName);
  await contextMenuClick(t, 'Rename');
  await focusChild(t);
}

export async function openDuplicateWindow(t, sourceName) {
  await focusMain(t);
  await rightClickScene(t, sourceName);
  await contextMenuClick(t, 'Duplicate');
  await focusChild(t);
}
