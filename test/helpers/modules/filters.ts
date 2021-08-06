// Source helper functions
import { rightClickSource } from './sources';
import { contextMenuClick } from '../spectron/context-menu';
import { setFormDropdown, setFormInput } from '../spectron/forms';
import { click, clickButton, focusChild, focusMain } from './core';

export async function openFiltersWindow(sourceName: string) {
  await focusMain();
  await rightClickSource(sourceName);
  await contextMenuClick('Filters');
  await focusChild();
}

export async function openFilterProperties(sourceName: string, filterName: string) {
  await openFiltersWindow(sourceName);
  await click(`span=${filterName}`);
}

export async function closeFilterProperties() {
  await focusChild();
  await clickButton('Done');
}

export async function addFilter(sourceName: string, filterType: string, filterName: string) {
  await openFiltersWindow(sourceName);
  await click('.icon-add');
  await setFormDropdown('Filter type', filterType);
  if (filterType !== filterName) {
    await setFormInput('Filter name', filterName);
  }
  await clickButton('Done');
  await clickButton('Done');
}

export async function removeFilter(sourceName: string, filterName: string) {
  await openFiltersWindow(sourceName);
  await click(`span=${filterName}`);
  await click('.nav-menu .icon-subtract');
  await clickButton('Done');
}
