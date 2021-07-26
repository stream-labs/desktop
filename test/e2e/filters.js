import { useSpectron, focusChild, test } from '../helpers/spectron/index';
import { addFilter, openFiltersWindow, removeFilter } from '../helpers/spectron/filters';
import { addSource } from '../helpers/spectron/sources';

useSpectron({ restartAppAfterEachTest: false });

test('Adding and removing a source filter', async t => {
  const app = t.context.app;
  const sourceName = 'Color Source';
  const filterName = 'Color Correction';

  await addSource(t, 'color_source', sourceName);
  await addFilter(t, sourceName, 'color_filter', filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await app.client.isExisting('[data-test="Form/Slider/opacity"]'));

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await app.client.isExisting('[data-test="Form/Slider/opacity"]'));
});
