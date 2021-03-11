// Source helper functions
import { focusMain, focusChild, TExecutionContext } from '.';
import { rightClickSource } from './sources';
import { contextMenuClick } from './context-menu';
import { setFormDropdown, setFormInput } from './forms';

export async function openFiltersWindow(t: TExecutionContext, sourceName: string) {
  await focusMain(t);
  await rightClickSource(t, sourceName);
  await contextMenuClick(t, 'Filters');
  await focusChild(t);
}

export async function openFilterProperties(
  t: TExecutionContext,
  sourceName: string,
  filterName: string,
) {
  await openFiltersWindow(t, sourceName);
  await (await t.context.app.client.$(`span=${filterName}`)).click();
}

export async function closeFilterProperties(t: TExecutionContext) {
  await focusChild(t);
  await (await t.context.app.client.$('button=Done')).click();
}

export async function addFilter(
  t: TExecutionContext,
  sourceName: string,
  filterType: string,
  filterName: string,
) {
  await openFiltersWindow(t, sourceName);
  await (await t.context.app.client.$('.icon-add')).click();
  await setFormDropdown(t, 'Filter type', filterType);
  if (filterType !== filterName) {
    await setFormInput(t, 'Filter name', filterName);
  }
  await (await t.context.app.client.$('button=Done')).click();
  await (await t.context.app.client.$('button=Done')).click();
}

export async function removeFilter(t: TExecutionContext, sourceName: string, filterName: string) {
  await openFiltersWindow(t, sourceName);
  await (await t.context.app.client.$(`span=${filterName}`)).click();
  await (await (await t.context.app.client.$('.nav-menu')).$('.icon-subtract')).click();
  await (await t.context.app.client.$('button=Done')).click();
}
