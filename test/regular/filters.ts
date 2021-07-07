import { useSpectron, focusChild, test } from '../helpers/spectron';
import { addFilter, openFiltersWindow, removeFilter } from '../helpers/spectron/filters';
import { addSource } from '../helpers/spectron/sources';

useSpectron({ restartAppAfterEachTest: false });

test('Adding and removing a Color Correction filter', async t => {
  const app = t.context.app;
  const sourceName = 'Color Source';
  const filterName = 'Color Correction';

  await addSource(t, 'Color Source', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await (await app.client.$('label=Gamma')).isExisting());
  t.true(await (await app.client.$('label=Contrast')).isExisting());
  t.true(await (await app.client.$('label=Brightness')).isExisting());
  t.true(await (await app.client.$('label=Saturation')).isExisting());
  t.true(await (await app.client.$('label=Hue Shift')).isExisting());
  t.true(await (await app.client.$('label=Opacity')).isExisting());
  t.true(await (await app.client.$('label=Color')).isExisting());

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await (await app.client.$('label=Gamma')).isExisting());
  t.false(await (await app.client.$('label=Contrast')).isExisting());
  t.false(await (await app.client.$('label=Brightness')).isExisting());
  t.false(await (await app.client.$('label=Saturation')).isExisting());
  t.false(await (await app.client.$('label=Hue Shift')).isExisting());
  t.false(await (await app.client.$('label=Opacity')).isExisting());
  t.false(await (await app.client.$('label=Color')).isExisting());
});

test('Adding and removing a Image Mask filter', async t => {
  const app = t.context.app;
  const sourceName = 'Color Source 2';
  const filterName = 'Image Mask/Blend';

  await addSource(t, 'Color Source', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await (await app.client.$('label=Type')).isExisting());
  t.true(await (await app.client.$('label=Path')).isExisting());
  t.true(await (await app.client.$('label=Color')).isExisting());
  t.true(await (await app.client.$('label=Opacity')).isExisting());

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await (await app.client.$('label=Type')).isExisting());
  t.false(await (await app.client.$('label=Path')).isExisting());
  t.false(await (await app.client.$('label=Color')).isExisting());
  t.false(await (await app.client.$('label=Opacity')).isExisting());
});

test('Adding and removing a Crop Pad filter', async t => {
  const app = t.context.app;
  const sourceName = 'Color Source 3';
  const filterName = 'Crop/Pad';

  await addSource(t, 'Color Source', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await (await app.client.$('label=Left')).isExisting());
  t.true(await (await app.client.$('label=Top')).isExisting());
  t.true(await (await app.client.$('label=Right')).isExisting());
  t.true(await (await app.client.$('label=Bottom')).isExisting());

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await (await app.client.$('label=Left')).isExisting());
  t.false(await (await app.client.$('label=Top')).isExisting());
  t.false(await (await app.client.$('label=Right')).isExisting());
  t.false(await (await app.client.$('label=Bottom')).isExisting());
});

test('Adding and removing a Scaling aspect filter', async t => {
  const app = t.context.app;
  const sourceName = 'Color Source 4';
  const filterName = 'Scaling/Aspect Ratio';

  await addSource(t, 'Color Source', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await (await app.client.$('label=Scale Filtering')).isExisting());
  t.true(await (await app.client.$('label=Resolution')).isExisting());

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await (await app.client.$('label=Scale Filtering')).isExisting());
  t.false(await (await app.client.$('label=Resolution')).isExisting());
});

test('Adding and removing a Scroll filter', async t => {
  const app = t.context.app;
  const sourceName = 'Color Source 5';
  const filterName = 'Scroll';

  await addSource(t, 'Color Source', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);
  t.true(await (await app.client.$('label=Horizontal Speed')).isExisting());
  t.true(await (await app.client.$('label=Vertical Speed')).isExisting());
  t.true(await (await app.client.$('label=Limit Width')).isExisting());
  t.true(await (await app.client.$('label=Limit Height')).isExisting());

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await (await app.client.$('label=Horizontal Speed')).isExisting());
  t.false(await (await app.client.$('label=Vertical Speed')).isExisting());
  t.false(await (await app.client.$('label=Limit Width')).isExisting());
  t.false(await (await app.client.$('label=Limit Height')).isExisting());
});

test('Adding and removing a Render Delay filter', async t => {
  const app = t.context.app;
  const sourceName = 'Color Source 6';
  const filterName = 'Render Delay';

  await addSource(t, 'Color Source', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);
  t.true(await (await app.client.$('label=Delay')).isExisting());

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await (await app.client.$('label=Delay')).isExisting());
});

test('Adding and removing a Color Key filter', async t => {
  const app = t.context.app;
  const sourceName = 'Color Source 7';
  const filterName = 'Color Key';

  await addSource(t, 'Color Source', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await (await app.client.$('label=Key Color Type')).isExisting());
  t.true(await (await app.client.$('label=Similarity (1-1000)')).isExisting());
  t.true(await (await app.client.$('label=Smoothness (1-1000)')).isExisting());
  t.true(await (await app.client.$('label=Opacity')).isExisting());
  t.true(await (await app.client.$('label=Contrast')).isExisting());
  t.true(await (await app.client.$('label=Brightness')).isExisting());
  t.true(await (await app.client.$('label=Gamma')).isExisting());

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await (await app.client.$('label=Key Color Type')).isExisting());
  t.false(await (await app.client.$('label=Similarity (1-1000)')).isExisting());
  t.false(await (await app.client.$('label=Smoothness (1-1000)')).isExisting());
  t.false(await (await app.client.$('label=Opacity')).isExisting());
  t.false(await (await app.client.$('label=Contrast')).isExisting());
  t.false(await (await app.client.$('label=Brightness')).isExisting());
  t.false(await (await app.client.$('label=Gamma')).isExisting());
});

test('Adding and removing a LUT filter', async t => {
  const app = t.context.app;
  const sourceName = 'Color Source 8';
  const filterName = 'Apply LUT';

  await addSource(t, 'Color Source', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await (await app.client.$('label=Path')).isExisting());
  t.true(await (await app.client.$('label=Amount')).isExisting());

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await (await app.client.$('label=Path')).isExisting());
  t.false(await (await app.client.$('label=Amount')).isExisting());
});

test('Adding and removing a Sharpen filter', async t => {
  const app = t.context.app;
  const sourceName = 'Color Source 9';
  const filterName = 'Sharpen';

  await addSource(t, 'Color Source', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await (await app.client.$('label=Sharpness')).isExisting());

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await (await app.client.$('label=Sharpness')).isExisting());
});

test('Adding and removing a Chroma Key filter', async t => {
  const app = t.context.app;
  const sourceName = 'Color Source 10';
  const filterName = 'Chroma Key';

  await addSource(t, 'Color Source', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await (await app.client.$('label=Similarity (1-1000)')).isExisting());
  t.true(await (await app.client.$('label=Smoothness (1-1000)')).isExisting());
  t.true(await (await app.client.$('label=Key Color Spill Reduction (1-1000)')).isExisting());
  t.true(await (await app.client.$('label=Opacity')).isExisting());
  t.true(await (await app.client.$('label=Contrast')).isExisting());
  t.true(await (await app.client.$('label=Brightness')).isExisting());
  t.true(await (await app.client.$('label=Gamma')).isExisting());

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await (await app.client.$('label=Similarity (1-1000)')).isExisting());
  t.false(await (await app.client.$('label=Smoothness (1-1000)')).isExisting());
  t.false(await (await app.client.$('label=Key Color Spill Reduction (1-1000)')).isExisting());
  t.false(await (await app.client.$('label=Opacity')).isExisting());
  t.false(await (await app.client.$('label=Contrast')).isExisting());
  t.false(await (await app.client.$('label=Brightness')).isExisting());
  t.false(await (await app.client.$('label=Gamma')).isExisting());
});

test('Adding and removing a Invert Polarity filter', async t => {
  const app = t.context.app;
  const sourceName = 'Audio Input Capture';
  const filterName = 'Invert Polarity';

  await addSource(t, 'Audio Input Capture', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await (await app.client.$('div=No settings are available for this filter')).isExisting());

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await (await app.client.$('div=No settings are available for this filter')).isExisting());
});

test('Adding and removing a Gain filter', async t => {
  const app = t.context.app;
  const sourceName = 'Audio Input Capture 1';
  const filterName = 'Gain';

  await addSource(t, 'Audio Input Capture', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await (await app.client.$('label=Gain')).isExisting());

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await (await app.client.$('label=Gain')).isExisting());
})

test('Adding and removing a Noise Suppression filter', async t => {
  const app = t.context.app;
  const sourceName = 'Audio Input Capture 2';
  const filterName = 'Noise Suppression';

  await addSource(t, 'Audio Input Capture', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await (await app.client.$('label=Method')).isExisting());
  t.true(await (await app.client.$('label=Suppression Level')).isExisting());

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await (await app.client.$('label=Method')).isExisting());
  t.false(await (await app.client.$('label=Suppression Level')).isExisting());
})

test('Adding and removing a Noise Gate filter', async t => {
  const app = t.context.app;
  const sourceName = 'Audio Input Capture 3';
  const filterName = 'Noise Gate';

  await addSource(t, 'Audio Input Capture', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await (await app.client.$('label=Close Threshold')).isExisting());
  t.true(await (await app.client.$('label=Open Threshold')).isExisting());
  t.true(await (await app.client.$('label=Attack Time')).isExisting());
  t.true(await (await app.client.$('label=Hold Time')).isExisting());
  t.true(await (await app.client.$('label=Release Time')).isExisting());

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await (await app.client.$('label=Close Threshold')).isExisting());
  t.false(await (await app.client.$('label=Open Threshold')).isExisting());
  t.false(await (await app.client.$('label=Attack Time')).isExisting());
  t.false(await (await app.client.$('label=Hold Time')).isExisting());
  t.false(await (await app.client.$('label=Release Time')).isExisting());
})

test('Adding and removing a Compressor filter', async t => {
  const app = t.context.app;
  const sourceName = 'Audio Input Capture 4';
  const filterName = 'Compressor';

  await addSource(t, 'Audio Input Capture', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await (await app.client.$('label=Ratio')).isExisting());
  t.true(await (await app.client.$('label=Threshold')).isExisting());
  t.true(await (await app.client.$('label=Attack')).isExisting());
  t.true(await (await app.client.$('label=Release')).isExisting());
  t.true(await (await app.client.$('label=Output Gain')).isExisting());
  t.true(await (await app.client.$('label=Sidechain/Ducking Source')).isExisting());

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await (await app.client.$('label=Ratio')).isExisting());
  t.false(await (await app.client.$('label=Threshold')).isExisting());
  t.false(await (await app.client.$('label=Attack')).isExisting());
  t.false(await (await app.client.$('label=Release')).isExisting());
  t.false(await (await app.client.$('label=Output Gain')).isExisting());
  t.false(await (await app.client.$('label=Sidechain/Ducking Source')).isExisting());
})

test('Adding and removing a Limiter filter', async t => {
  const app = t.context.app;
  const sourceName = 'Audio Input Capture 5';
  const filterName = 'Limiter';

  await addSource(t, 'Audio Input Capture', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await (await app.client.$('label=Threshold')).isExisting());
  t.true(await (await app.client.$('label=Release')).isExisting());

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await (await app.client.$('label=Threshold')).isExisting());
  t.false(await (await app.client.$('label=Release')).isExisting());
})

test('Adding and removing an Expander filter', async t => {
  const app = t.context.app;
  const sourceName = 'Audio Input Capture 6';
  const filterName = 'Expander';

  await addSource(t, 'Audio Input Capture', sourceName);
  await addFilter(t, sourceName, filterName, filterName);
  await openFiltersWindow(t, sourceName);
  await focusChild(t);

  t.true(await (await app.client.$('label=Presets')).isExisting());
  t.true(await (await app.client.$('label=Ratio')).isExisting());
  t.true(await (await app.client.$('label=Threshold')).isExisting());
  t.true(await (await app.client.$('label=Attack')).isExisting());
  t.true(await (await app.client.$('label=Release')).isExisting());
  t.true(await (await app.client.$('label=Output Gain')).isExisting());
  t.true(await (await app.client.$('label=Detection')).isExisting());

  await removeFilter(t, sourceName, filterName);
  await openFiltersWindow(t, sourceName);

  t.false(await (await app.client.$('label=Presets')).isExisting());
  t.false(await (await app.client.$('label=Ratio')).isExisting());
  t.false(await (await app.client.$('label=Threshold')).isExisting());
  t.false(await (await app.client.$('label=Attack')).isExisting());
  t.false(await (await app.client.$('label=Release')).isExisting());
  t.false(await (await app.client.$('label=Output Gain')).isExisting());
  t.false(await (await app.client.$('label=Detection')).isExisting());
})