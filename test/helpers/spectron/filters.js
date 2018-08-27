// Source helper functions
import { focusMain, focusChild } from '.';
import { rightClickSource } from './sources';
import { contextMenuClick } from './context-menu';
import { setFormDropdown, setFormInput } from './forms';

export async function openFiltersWindow(t, sourceName) {
  await focusMain(t);
  await rightClickSource(t, sourceName);
  await contextMenuClick(t, 'Filters');
  await focusChild(t);
}

export async function openFilterProperties(t, sourceName, filterName) {
  await openFiltersWindow(t, sourceName);
  await t.context.app.client.click(`span=${filterName}`);
}

export async function closeFilterProperties(t) {
  await focusChild(t);
  await t.context.app.client.click('button=Done');
}

export async function addFilter(t, sourceName, filterType, filterName) {
  await openFiltersWindow(t, sourceName);
  await t.context.app.client.click('.icon-add');
  await setFormDropdown(t, 'Filter type', filterType);
  if (filterType !== filterName) {
    await setFormInput(t, 'Filter name', filterName);
  }
  await t.context.app.client.click('button=Done');
  await t.context.app.client.click('button=Done');
}

export async function removeFilter(t, sourceName, filterName) {
  await openFiltersWindow(t, sourceName);
  await t.context.app.client.click(`span=${filterName}`);
  await t.context.app.client
    .$('.nav-menu')
    .click('.icon-subtract');
  await t.context.app.client.click('button=Done');
}
