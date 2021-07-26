// Source helper functions
import { focusMain, focusChild } from '.';
import { selectSource, rightClickSource } from './sources';
import { contextMenuClick } from './context-menu';
import { setFormDropdown, setFormInput } from './forms';

export async function openFiltersWindow(t, sourceName) {
  await focusMain(t);
  //await selectSource(t, sourceName);
  await rightClickSource(t, sourceName);
  //await new Promise(x => setTimeout(x, 250));
  await contextMenuClick(t, 'Filters');
  await focusChild(t);
}

export async function openFilterProperties(t, sourceName, filterName) {
  await openFiltersWindow(t, sourceName);
  await t.context.app.client.click(`[data-test="${filterName}"]`);
}

export async function closeFilterProperties(t) {
  await focusChild(t);
  await t.context.app.client.click('[data-test="Done"]');
}

export async function addFilter(t, sourceName, filterType, filterName) {
  await openFiltersWindow(t, sourceName);
  await t.context.app.client.click('[data-test="Add"]');
  await setFormDropdown(t, '[data-test="Form/List/type"]', filterType);
  if (filterType !== filterName) {
    await setFormInput(t, '[data-test="Form/Text/name"]', filterName);
  }
  await t.context.app.client.click('[data-test="Done"]');
  await t.context.app.client.click('[data-test="Done"]');
}

export async function removeFilter(t, sourceName, filterName) {
  await openFiltersWindow(t, sourceName);
  await t.context.app.client.click(`[data-test="${filterName}"]`);
  await t.context.app.client.click('[data-test="Remove"]');
  await t.context.app.client.click('[data-test="Done"]');
}
