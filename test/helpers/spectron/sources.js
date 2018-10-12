// Source helper functions
import { focusMain, focusChild } from '.';
import { contextMenuClick } from './context-menu';

async function clickSourceAction(t, selector) {
  await t.context.app.client
    .$('[data-test="SourceSelector"]')
    .click(selector);
}

export async function clickAddSource(t) {
  await clickSourceAction(t, '[data-test="Add"]');
}

export async function clickRemoveSource(t) {
  await clickSourceAction(t, '[data-test="Remove"]');
}

export async function clickSourceProperties(t) {
  await clickSourceAction(t, '[data-test="Edit"]');
}

export async function selectSource(t, name) {
  const sel = `[data-test="SourceSelector"] [data-test="${name}"]`;
  t.context.app.client.execute((selector) => {
    const el = document.querySelector(selector);
    el.dispatchEvent(new MouseEvent('down', { button: 0 }));
    el.dispatchEvent(new MouseEvent('up', { button: 0 }));
  }, sel);
  await t.context.app.client.click(sel);
}

export async function rightClickSource(t, name) {
  const sel = `[data-test="SourceSelector"] [data-test="${name}"]`;
  t.context.app.client.execute((selector) => {
    const el = document.querySelector(selector);
    el.dispatchEvent(new MouseEvent('down', { button: 2 }));
    el.dispatchEvent(new MouseEvent('up', { button: 2 }));
  }, sel);
  await t.context.app.client.rightClick(sel);
}

export async function addSource(t, type, name, closeProps = true) {
  const app = t.context.app;

  await focusMain(t);
  await clickAddSource(t);
  await focusChild(t);
  await app.client.click(`[data-test="${type}"`);
  await app.client.click('[data-test="AddSource"]');
  await app.client.setValue('input', name);

  if (await app.client.isExisting('[data-test="Done"]')) {
    await app.client.click('[data-test="Done"]');
  } else {
    await app.client.click('[data-test="AddNewSource"]');
  }

  // Close source properties too
  if (closeProps) {
    await app.client.click('[data-test="Done"]');
  }
}

export async function addExistingSource(t, type, name, closeProps = true) {
  const app = t.context.app;

  await focusMain(t);
  await clickAddSource(t);

  await focusChild(t);
  await app.client.click(`[data-test="${type}"`);
  await app.client.click('[data-test="AddSource"]');
  await app.client.click(`div=${name}`);
  await app.client.click('[data-test="AddExistingSource"]');
}


export async function openRenameWindow(t, sourceName) {
  await focusMain(t);
  await rightClickSource(t, sourceName);
  await contextMenuClick(t, 'Rename');
  await focusChild(t);
}

export async function sourceIsExisting(t, sourceName) {
  const app = t.context.app;
  return app.client
    .$('[data-test="SourceSelector"]')
    .isExisting(`[data-test="${sourceName}"]`);
}
