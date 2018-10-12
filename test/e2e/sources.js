import test from 'ava';
import { useSpectron, focusMain, focusChild } from '../helpers/spectron/index';
import {
  addSource,
  clickRemoveSource,
  clickSourceProperties,
  selectSource,
  openRenameWindow,
  sourceIsExisting
} from '../helpers/spectron/sources';

useSpectron();

const sourceTypes = [
  'dshow_input',
  'wasapi_output_capture',
  'wasapi_input_capture',
  'game_capture',
  'window_capture',
  'monitor_capture',
  'image_source',
  'slideshow',
  'ffmpeg_source',
  'text_gdiplus',
  'color_source',
  'browser_source'
];

test('Adding and removing some sources', async t => {
  for (const sourceType of sourceTypes) {
    const sourceName = `Example ${sourceType}`;

    await addSource(t, sourceType, sourceName);
    await focusMain(t);

    t.true(await sourceIsExisting(t, sourceName));

    await selectSource(t, sourceName);
    await clickRemoveSource(t);

    t.false(await sourceIsExisting(t, sourceName));
  }
});

test('Viewing source properties', async t => {
  const app = t.context.app;
  const sourceName = 'Cool Color Source';

  await addSource(t, 'color_source', sourceName);

  await focusMain(t);
  await selectSource(t, sourceName);
  await clickSourceProperties(t);

  await focusChild(t);
  t.true(await app.client.isExisting('[data-test="Form/Color/color"]'));
});


test('Rename source', async t => {
  const app = t.context.app;
  const sourceName = 'MyColorSource1';
  const newSourceName = 'MyColorSource2';

  await addSource(t, 'color_source', sourceName);

  await openRenameWindow(t, sourceName);
  await app.client.setValue('input', newSourceName);
  await app.client.click('[data-test="Done"]');


  await focusMain(t);
  t.true(await sourceIsExisting(t, newSourceName));
});
