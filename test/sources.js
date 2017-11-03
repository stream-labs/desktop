import test from 'ava';
import { useSpectron, focusMain, focusChild } from './helpers/spectron';
import { addSource, clickRemoveSource, clickSourceProperties, selectSource } from './helpers/spectron/sources';

useSpectron();

const sourceTypes = [
  'Video Capture Device',
  'Audio Output Capture',
  'Audio Input Capture',
  'Game Capture',
  'Window Capture',
  'Display Capture',
  'Image',
  'Image Slide Show',
  'Media Source',
  'Text (GDI+)',
  'Color Source',
  'Browser Source'
];


test('Adding and removing some sources', async t => {
  const app = t.context.app;

  for (const sourceType of sourceTypes) {
    const sourceName = `Example ${sourceType}`;
    const sourceSelector = `li=${sourceName}`;

    await addSource(t, sourceType, sourceName);
    await focusMain(t);

    t.true(await app.client.isExisting(sourceSelector));

    await selectSource(t, sourceName);
    await clickRemoveSource(t);

    t.false(await app.client.isExisting(sourceSelector));
  }
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
