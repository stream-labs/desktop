import test from 'ava';
import { useSpectron } from '../helpers/spectron';
import { addSource } from '../helpers/spectron/sources';
import { addFilter, openFilterProperties, closeFilterProperties, removeFilter } from '../helpers/spectron/filters';
import { setFormInput } from '../helpers/spectron/forms';

useSpectron();

test('Adding and modifying a filter', async t => {
  const sourceName = 'Example Video Capture';
  const filterName = 'Example Crop';

  await addSource(t, 'Video Capture Device', sourceName);

  await addFilter(t, sourceName, 'Crop/Pad', filterName);
  await openFilterProperties(t, sourceName, filterName);
  await setFormInput(t, 'Left', 100);
  await closeFilterProperties(t);
  await removeFilter(t, sourceName, filterName);

  // TODO: Remove this when we have actually assertions
  t.pass();
});
