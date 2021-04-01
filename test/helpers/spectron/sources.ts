// Source helper functions
import { focusMain, focusChild, TExecutionContext } from '.';
import { contextMenuClick } from './context-menu';
import { dialogDismiss } from './dialog';

async function clickSourceAction(t: TExecutionContext, selector: string) {
  const $el = await (await (await t.context.app.client.$('h2=Sources')).$('..')).$(selector);
  await $el.click();
}

export async function clickAddSource(t: TExecutionContext) {
  await clickSourceAction(t, '.icon-add');
}

export async function clickRemoveSource(t: TExecutionContext) {
  await clickSourceAction(t, '.icon-subtract');
  await dialogDismiss(t, 'OK');
}

export async function clickSourceProperties(t: TExecutionContext) {
  await clickSourceAction(t, '.icon-settings');
}

export async function selectSource(t: TExecutionContext, name: string) {
  await (await t.context.app.client.$(`.item-title=${name}`)).click();
}

export async function selectTestSource(t: TExecutionContext) {
  await (await t.context.app.client.$('.item-title*=__')).click();
}

export async function rightClickSource(t: TExecutionContext, name: string) {
  await (await t.context.app.client.$(`.item-title=${name}`)).click({ button: 'right' });
}

export async function addSource(
  t: TExecutionContext,
  type: string,
  name: string,
  closeProps = true,
) {
  const app = t.context.app;

  await focusMain(t);
  await clickAddSource(t);

  await focusChild(t);

  if (await (await app.client.$(`li=${type}`)).isExisting()) {
    await (await app.client.$(`li=${type}`)).click(); // source
  } else {
    await (await app.client.$(`div=${type}`)).click(); // widget
  }

  await (await app.client.$('button=Add Source')).click();

  if (name !== type && (await (await app.client.$('[data-type="toggle"]')).isExisting())) {
    await (await app.client.$('[data-type="toggle"]')).click();
  }

  if (await (await app.client.$('input')).isExisting()) {
    await (await app.client.$('input')).setValue(name);
  }

  if (await (await app.client.$('button=Add Source')).isExisting()) {
    await (await app.client.$('button=Add Source')).click();
  }

  // Close source properties too
  if (closeProps) {
    await (await app.client.$('button=Done')).click();
  } else {
    await focusChild(t);
  }
}

export async function addExistingSource(t: TExecutionContext, type: string, name: string) {
  const app = t.context.app;

  await focusMain(t);
  await clickAddSource(t);

  await focusChild(t);
  await (await app.client.$(`li=${type}`)).click();
  await (await app.client.$('button=Add Source')).click();
  await (await app.client.$(`div=${name}`)).click();
  await (await app.client.$('button=Add Source')).click();
}

export async function openRenameWindow(t: TExecutionContext, sourceName: string) {
  await focusMain(t);
  await rightClickSource(t, sourceName);
  await contextMenuClick(t, 'Rename');
  await focusChild(t);
}

export async function sourceIsExisting(t: TExecutionContext, sourceName: string) {
  const app = t.context.app;
  return (await app.client.$(`.item-title=${sourceName}`)).isExisting();
}

export async function waitForSourceExist(
  t: TExecutionContext,
  sourceName: string,
  invert: boolean,
) {
  const app = t.context.app;
  return (await app.client.$(`.item-title=${sourceName}`)).waitForExist({
    timeout: 5000,
    reverse: invert,
  });
}

export async function testSourceExists(t: TExecutionContext) {
  return (await t.context.app.client.$('.item-title*=__')).isExisting();
}
