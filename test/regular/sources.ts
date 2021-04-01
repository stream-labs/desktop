import { useSpectron, focusMain, focusChild, test } from '../helpers/spectron';
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
  'Browser Source',
];

test('Adding and removing some sources', async t => {
  const app = t.context.app;

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

test('Viewing source properties', async t => {
  const app = t.context.app;
  const sourceName = 'Cool Color Source';

  await addSource(t, 'Color Source', sourceName);

  await focusMain(t);
  await selectSource(t, sourceName);
  await clickSourceProperties(t);

  await focusChild(t);
  t.true(await (await app.client.$('label=Color')).isExisting());
});

test('Rename source', async t => {
  const app = t.context.app;
  const sourceName = 'MyColorSource1';
  const newSourceName = 'MyColorSource2';

  await addSource(t, 'Color Source', sourceName);

  await openRenameWindow(t, sourceName);
  await (await app.client.$('input')).setValue(newSourceName);
  await (await app.client.$('button=Done')).click();

  await focusMain(t);
  t.true(await sourceIsExisting(t, newSourceName));
});
