import test from 'ava';
import { useSpectron, focusMain, focusChild } from '../helpers/spectron/index';
import {
  addSource,
  addExistingSource,
  clickRemoveSource,
  selectSource,
  sourceIsExisting,
  waitForSourceExist,
  clickAddSource,
} from '../helpers/spectron/sources';

import { addScene } from '../helpers/spectron/scenes';

useSpectron();

const sourceType = 'nair-rtvc-source';

test('rtvc Adding and removing source', async t => {
  const sourceName = `Example ${sourceType}`;
  await addSource(t, sourceType, sourceName);

  await focusMain(t);

  t.true(await sourceIsExisting(t, sourceName));

  await selectSource(t, sourceName);
  await clickRemoveSource(t);

  await waitForSourceExist(t, sourceName, true);
});

test('rtvc Check conditions that can be added', async t => {
  const sourceName = `Example ${sourceType}`;

  // add rtvc source
  await addSource(t, sourceType, sourceName);
  await focusMain(t);
  t.true(await sourceIsExisting(t, sourceName));

  // can not add more rtvc source
  const app = t.context.app;
  await focusMain(t);
  await clickAddSource(t);
  await focusChild(t);
  await app.client.click(`[data-test="${sourceType}"`);
  t.true((await app.client.$('[data-test="AddSource"]').getAttribute('disabled')) === 'true');
  // can add other souce
  await app.client.click(`[data-test="image_source"`);
  t.true((await app.client.$('[data-test="AddSource"]').getAttribute('disabled')) === null);
  // close
  await app.client.click('[data-test="titlebar-close"]');

  // when other scene, can add rtvc source
  await focusMain(t);
  await addScene(t, 's2');
  await addExistingSource(t, sourceType, sourceName);
  await focusMain(t);
  t.true(await sourceIsExisting(t, sourceName));
});
