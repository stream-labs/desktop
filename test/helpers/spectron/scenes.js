// Scene helper functions
import { focusMain, focusChild } from '.';
import { contextMenuClick } from './context-menu';
import { dialogDismiss } from './dialog';

async function clickSceneAction(t, selector) {
  await t.context.app.client
    .$('[data-test="SceneSelector"]')
    .click(selector);
}

export async function clickAddScene(t) {
  await clickSceneAction(t, '[data-test="Add"]');
}

export async function clickRemoveScene(t) {
  await clickSceneAction(t, '[data-test="Remove"]');
  await dialogDismiss(t, 'OK');
}

export async function clickSceneTransitions(t) {
  await clickSceneAction(t, '[data-test="Edit"]');
}

export async function selectScene(t, name) {
  const sel = `[data-test="SceneSelector"] [data-test="${name}"]`;
  t.context.app.client.execute((selector) => {
    const el = document.querySelector(selector);
    el.dispatchEvent(new MouseEvent('down', { button: 0 }));
    el.dispatchEvent(new MouseEvent('up', { button: 0 }));
  }, sel);
  await t.context.app.client.click(sel);
}

export async function rightClickScene(t, name) {
  const sel = `[data-test="SceneSelector"] [data-test="${name}"]`;
  t.context.app.client.execute((selector) => {
    const el = document.querySelector(selector);
    el.dispatchEvent(new MouseEvent('down', { button: 2 }));
    el.dispatchEvent(new MouseEvent('up', { button: 2 }));
  }, sel);
  await t.context.app.client.rightClick(sel);
}

export async function addScene(t, name) {
  const app = t.context.app;

  await focusMain(t);
  await clickAddScene(t);
  await focusChild(t);
  await app.client.setValue('input', name);
  await app.client.click('[data-test="Done"]');
}

export async function openRenameWindow(t, sceneName) {
  await focusMain(t);
  await rightClickScene(t, sceneName);
  await contextMenuClick(t, 'Rename');
  await focusChild(t);
}

export async function sceneIsExisting(t, sceneName) {
  return t.context.app.client
    .$('[data-test="SceneSelector"]')
    .isExisting(`[data-test="${sceneName}"]`);
}
