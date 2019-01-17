import test from 'ava';
import { useSpectron, focusChild } from './helpers/spectron/index';
import { addFilter, openFiltersWindow, removeFilter } from './helpers/spectron/filters';
import { addSource } from './helpers/spectron/sources';

useSpectron();


test('Adding and removing a source filter', async t => {
  const app = t.context.app;
  const sourceName = 'Color Source';
  const filterName = 'Color Correction';

  await addSource(t, 'Color Source', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await app.client.isExisting('div=Opacity'));

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await app.client.isExisting('div=Opacity'));
});
