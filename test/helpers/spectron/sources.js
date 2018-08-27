// Source helper functions
import { focusMain, focusChild } from '.';
import { contextMenuClick } from './context-menu';
import { dialogDismiss } from './dialog';

async function clickSourceAction(t, selector) {
  await t.context.app.client
    .$('h2=Sources')
    .$('..')
    .click(selector);
}

export async function clickAddSource(t) {
  await clickSourceAction(t, '.icon-add');
}

export async function clickRemoveSource(t) {
  await clickSourceAction(t, '.icon-subtract');
  await dialogDismiss(t, 'OK');
}

export async function clickSourceProperties(t) {
  await clickSourceAction(t, '.icon-settings');
}

export async function selectSource(t, name) {
  await t.context.app.client.click(`.item-title=${name}`);
}

export async function selectTestSource(t) {
  await t.context.app.client.click('.item-title*=__')
}

export async function rightClickSource(t, name) {
  await t.context.app.client.rightClick(`.item-title=${name}`);
}

export async function addSource(t, type, name, closeProps = true) {
  const app = t.context.app;

  await focusMain(t);
  await clickAddSource(t);

  await focusChild(t);

  if (await app.client.isExisting(`li=${type}`)) {
    await app.client.click(`li=${type}`); // source
  } else {
    await app.client.click(`div=${type}`); // widget
  }

  await app.client.click('button=Add Source');
  await app.client.setValue('input', name);

  if (await app.client.isExisting('button=Done')) {
    await app.client.click('button=Done');
  } else {
    await app.client.click('button=Add New Source');
  }

  // Close source properties too
  if (closeProps) {
    await app.client.click('button=Done');
  } else {
    await focusChild(t);
  }
}

export async function addExistingSource(t, type, name, closeProps = true) {
  const app = t.context.app;

  await focusMain(t);
  await clickAddSource(t);

  await focusChild(t);
  await app.client.click(`li=${type}`);
  await app.client.click('button=Add Source');
  await app.client.click(`div=${name}`);
  await app.client.click('button=Add Existing Source');
}


export async function openRenameWindow(t, sourceName) {
  await focusMain(t);
  await rightClickSource(t, sourceName);
  await contextMenuClick(t, 'Rename');
  await focusChild(t);
}

export async function sourceIsExisting(t, sourceName) {
  const app = t.context.app;
  return app.client.isExisting(`.item-title=${sourceName}`);
}

export async function testSourceExists(t) {
  return t.context.app.client.isExisting('.item-title*=__')
}
