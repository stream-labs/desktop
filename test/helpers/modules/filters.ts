// Source helper functions
import { rightClickSource } from './sources';
import { contextMenuClick } from '../spectron/context-menu';
import { click, clickButton, focusChild, focusMain, select } from './core';
import { useForm } from './forms';

export async function openFiltersWindow(sourceName: string) {
  await focusMain();
  await rightClickSource(sourceName);
  await contextMenuClick(['Filters', 'Edit Filters']);
  await focusChild();
}

export async function openFilterProperties(sourceName: string, filterName: string) {
  await openFiltersWindow(sourceName);
  await click(`span=${filterName}`);
}

export async function closeFilterProperties() {
  await focusChild();
  await clickButton('Close');
}

export async function addFilter(sourceName: string, filterType: string, filterName: string) {
  await openFiltersWindow(sourceName);
  await click('.icon-add');
  const { fillForm } = useForm('addFilterForm');
  await fillForm({
    filterType,
    filterName,
  });
  await clickButton('Add');
}

export async function removeFilter(sourceName: string, filterName: string) {
  await openFiltersWindow(sourceName);
  const $navItem = await (await select(`span=${filterName}`)).$('..');
  await $navItem.moveTo();
  await (await $navItem.$('.icon-trash')).click();
  await clickButton('Close');
}
