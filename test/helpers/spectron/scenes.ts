// Scene helper functions
import { focusMain, focusChild, waitForLoader, TExecutionContext } from '.';
import { contextMenuClick } from './context-menu';
import { dialogDismiss } from './dialog';

async function clickSceneAction(t: TExecutionContext, selector: string) {
  const $el = await (await t.context.app.client.$('[rel=SceneSelector]')).$(selector);
  await $el.click();
}

export async function clickAddScene(t: TExecutionContext) {
  await clickSceneAction(t, '.icon-add');
}

export async function clickRemoveScene(t: TExecutionContext) {
  await clickSceneAction(t, '.icon-subtract');
  await dialogDismiss(t, 'OK');
}

export async function clickSceneTransitions(t: TExecutionContext) {
  await clickSceneAction(t, '.icon-settings');
}

export async function selectScene(t: TExecutionContext, name: string) {
  await (await t.context.app.client.$(`div=${name}`)).click();
}

export async function rightClickScene(t: TExecutionContext, name: string) {
  await (await t.context.app.client.$(`div=${name}`)).click({ button: 'right' });
}

export async function duplicateScene(t: TExecutionContext, sceneName: string, targetName: string) {
  await openDuplicateWindow(t, sceneName);
  await (await t.context.app.client.$('input')).setValue(targetName);
  await (await t.context.app.client.$('button=Done')).click();
}

export async function addScene(t: TExecutionContext, name: string) {
  const app = t.context.app;

  await focusMain(t);
  await clickAddScene(t);
  await focusChild(t);
  await (await app.client.$('input')).setValue(name);
  await (await app.client.$('button=Done')).click();
}

export async function openRenameWindow(t: TExecutionContext, sceneName: string) {
  await focusMain(t);
  await rightClickScene(t, sceneName);
  await contextMenuClick(t, 'Rename');
  await focusChild(t);
}

export async function openDuplicateWindow(t: TExecutionContext, sceneName: string) {
  await focusMain(t);
  await rightClickScene(t, sceneName);
  await contextMenuClick(t, 'Duplicate');
  await focusChild(t);
}

export async function switchCollection(t: TExecutionContext, collectionName: string) {
  const app = t.context.app;
  await focusMain(t);
  await (await app.client.$('.scene-collections-wrapper .dropdown-menu__toggle')).click();
  await (
    await (await app.client.$('.scene-collections-wrapper')).$(`div=${collectionName}`)
  ).click();
  await waitForLoader(t);
}

export async function sceneExisting(t: TExecutionContext, name: string) {
  return (
    await (await t.context.app.client.$('[data-name=scene-selector]')).$(`div=${name}`)
  ).isExisting();
}
