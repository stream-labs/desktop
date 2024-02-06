import test from 'ava';
import { useSpectron, focusMain, focusChild } from '../helpers/spectron/index';
import {
  addSource,
  clickRemoveSource,
  clickSourceProperties,
  selectSource,
  openRenameWindow,
  sourceIsExisting,
  waitForSourceExist,
} from '../helpers/spectron/sources';

useSpectron();

const sourceTypes = ['nair-rtvc-source'];

test('rtvc Adding and removing source', async t => {
  for (const sourceType of sourceTypes) {
    const sourceName = `Example ${sourceType}`;
    await addSource(t, sourceType, sourceName);

    await focusMain(t);

    t.true(await sourceIsExisting(t, sourceName));

    await selectSource(t, sourceName);
    await clickRemoveSource(t);

    await waitForSourceExist(t, sourceName, true);
  }
});
