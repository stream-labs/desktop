import test from 'ava';
import { useSpectron, focusChild } from './helpers/spectron/index';
import { addFilter, openFiltersWindow, removeFilter } from './helpers/spectron/filters';
import { addSource } from './helpers/spectron/sources';

useSpectron();

test('Adding and removing a Color Correction filter', async t => {
  const app = t.context.app;
  const sourceName = 'Color Source';
  const filterName = 'Color Correction';

  await addSource(t, 'Color Source', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await app.client.isExisting('label=Gamma'));
  t.true(await app.client.isExisting('label=Contrast'));
  t.true(await app.client.isExisting('label=Brightness'));
  t.true(await app.client.isExisting('label=Saturation'));
  t.true(await app.client.isExisting('label=Hue Shift'));
  t.true(await app.client.isExisting('label=Opacity'));
  t.true(await app.client.isExisting('label=Color'));

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await app.client.isExisting('label=Gamma'));
  t.false(await app.client.isExisting('label=Contrast'));
  t.false(await app.client.isExisting('label=Brightness'));
  t.false(await app.client.isExisting('label=Saturation'));
  t.false(await app.client.isExisting('label=Hue Shift'));
  t.false(await app.client.isExisting('label=Opacity'));
  t.false(await app.client.isExisting('label=Color'));
});

test('Adding and removing a Image Mask filter', async t => {
  const app = t.context.app;
  const sourceName = 'Color Source';
  const filterName = 'Image Mask/Blend';

  await addSource(t, 'Color Source', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await app.client.isExisting('label=Type'));
  t.true(await app.client.isExisting('label=Path'));
  t.true(await app.client.isExisting('label=Color'));
  t.true(await app.client.isExisting('label=Opacity'));

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await app.client.isExisting('label=Type'));
  t.false(await app.client.isExisting('label=Path'));
  t.false(await app.client.isExisting('label=Color'));
  t.false(await app.client.isExisting('label=Opacity'));
});

test('Adding and removing a Crop Pad filter', async t => {
  const app = t.context.app;
  const sourceName = 'Color Source';
  const filterName = 'Crop/Pad';

  await addSource(t, 'Color Source', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await app.client.isExisting('label=Left'));
  t.true(await app.client.isExisting('label=Top'));
  t.true(await app.client.isExisting('label=Right'));
  t.true(await app.client.isExisting('label=Bottom'));

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await app.client.isExisting('label=Left'));
  t.false(await app.client.isExisting('label=Top'));
  t.false(await app.client.isExisting('label=Right'));
  t.false(await app.client.isExisting('label=Bottom'));
});

test('Adding and removing a Scaling aspect filter', async t => {
  const app = t.context.app;
  const sourceName = 'Color Source';
  const filterName = 'Scaling/Aspect Ratio';

  await addSource(t, 'Color Source', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await app.client.isExisting('label=Scale Filtering'));
  t.true(await app.client.isExisting('label=Resolution'));

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await app.client.isExisting('label=Scale Filtering'));
  t.false(await app.client.isExisting('label=Resolution'));
});

test('Adding and removing a Scroll filter', async t => {
  const app = t.context.app;
  const sourceName = 'Color Source';
  const filterName = 'Scroll';

  await addSource(t, 'Color Source', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);
  t.true(await app.client.isExisting('label=Horizontal Speed'));
  t.true(await app.client.isExisting('label=Vertical Speed'));
  t.true(await app.client.isExisting('label=Limit Width'));
  t.true(await app.client.isExisting('label=Limit Height'));

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await app.client.isExisting('label=Horizontal Speed'));
  t.false(await app.client.isExisting('label=Vertical Speed'));
  t.false(await app.client.isExisting('label=Limit Width'));
  t.false(await app.client.isExisting('label=Limit Height'));

});

test('Adding and removing a Render Delay filter', async t => {
  const app = t.context.app;
  const sourceName = 'Color Source';
  const filterName = 'Render Delay';

  await addSource(t, 'Color Source', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);
  t.true(await app.client.isExisting('label=Delay (milliseconds)'));

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await app.client.isExisting('label=Delay (milliseconds)'));
});

test('Adding and removing a Color Key filter', async t => {
  const app = t.context.app;
  const sourceName = 'Color Source';
  const filterName = 'Color Key';

  await addSource(t, 'Color Source', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await app.client.isExisting('label=Key Color Type'));
  t.true(await app.client.isExisting('label=Similarity (1-1000)'));
  t.true(await app.client.isExisting('label=Smoothness (1-1000)'));
  t.true(await app.client.isExisting('label=Opacity'));
  t.true(await app.client.isExisting('label=Contrast'));
  t.true(await app.client.isExisting('label=Brightness'));
  t.true(await app.client.isExisting('label=Gamma'));

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await app.client.isExisting('label=Key Color Type'));
  t.false(await app.client.isExisting('label=Similarity (1-1000)'));
  t.false(await app.client.isExisting('label=Smoothness (1-1000)'));
  t.false(await app.client.isExisting('label=Opacity'));
  t.false(await app.client.isExisting('label=Contrast'));
  t.false(await app.client.isExisting('label=Brightness'));
  t.false(await app.client.isExisting('label=Gamma'));

});

test('Adding and removing a LUT filter', async t => {
  const app = t.context.app;
  const sourceName = 'Color Source';
  const filterName = 'Apply LUT';

  await addSource(t, 'Color Source', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await app.client.isExisting('label=Path'));
  t.true(await app.client.isExisting('label=Amount'));

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await app.client.isExisting('label=Path'));
  t.false(await app.client.isExisting('label=Amount'));
});

test('Adding and removing a Sharpen filter', async t => {
  const app = t.context.app;
  const sourceName = 'Color Source';
  const filterName = 'Sharpen';

  await addSource(t, 'Color Source', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await app.client.isExisting('label=Sharpness'));

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await app.client.isExisting('label=Sharpness'));
});

test('Adding and removing a Chroma Key filter', async t => {
  const app = t.context.app;
  const sourceName = 'Color Source';
  const filterName = 'Chroma Key';

  await addSource(t, 'Color Source', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await app.client.isExisting('label=Similarity (1-1000)'));
  t.true(await app.client.isExisting('label=Smoothness (1-1000)'));
  t.true(await app.client.isExisting('label=Key Color Spill Reduction (1-1000)'));
  t.true(await app.client.isExisting('label=Opacity'));
  t.true(await app.client.isExisting('label=Contrast'));
  t.true(await app.client.isExisting('label=Brightness'));
  t.true(await app.client.isExisting('label=Gamma'));

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await app.client.isExisting('label=Similarity (1-1000)'));
  t.false(await app.client.isExisting('label=Smoothness (1-1000)'));
  t.false(await app.client.isExisting('label=Key Color Spill Reduction (1-1000)'));
  t.false(await app.client.isExisting('label=Opacity'));
  t.false(await app.client.isExisting('label=Contrast'));
  t.false(await app.client.isExisting('label=Brightness'));
  t.false(await app.client.isExisting('label=Gamma'));
});
