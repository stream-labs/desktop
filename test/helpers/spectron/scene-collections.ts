import { focusMain, focusChild } from '.';

export async function openSceneCollectionsWindow(t: any) {
  await focusMain(t);
  t.context.app.client.click('button=Scenes');
  t.context.app.client.click('div=Manage All');
}

export async function createNewSceneCollection(t: any, name: string) {
  await openSceneCollectionsWindow(t);
  await focusChild(t);
  t.context.app.client.click('button=Create New');
}
