import test from 'ava';
import { useSpectron, focusMain, focusChild } from './helpers/spectron';
import { addSource, clickRemoveSource, clickSourceProperties, selectSource } from './helpers/spectron/sources';

useSpectron();

test('Adding and removing a source', async t => {
  const app = t.context.app;
  const sourceName = 'Example Video Capture';
  const sourceSelector = `li=${sourceName}`;

  await addSource(t, 'Video Capture Device', sourceName);

  await focusMain(t);
  t.true(await app.client.isExisting(sourceSelector));

  await selectSource(t, sourceName);
  await clickRemoveSource(t);

  t.false(await app.client.isExisting(sourceSelector));
});

test('Viewing source properties', async t => {
  const app = t.context.app;
  const sourceName = 'Cool Color Source';

  await addSource(t, 'Color Source', sourceName);

  await focusMain(t);
  await selectSource(t, sourceName);
  await clickSourceProperties(t);

  await focusChild(t);
  t.true(await app.client.isExisting('label=Color'));
});
