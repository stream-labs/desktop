import { FormMonkey } from '../helpers/form-monkey';
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

test('Create/Remove Color Source and view Source Properties', async t => {
  const app = t.context.app;
  const sourceName = 'Color Source';

  await addSource(t, 'Color Source', sourceName);
  await focusMain(t);

  t.true(await sourceIsExisting(t, sourceName));

  await selectSource(t, sourceName);
  await clickSourceProperties(t);

  await focusChild(t);
  t.true(await (await app.client.$('label=Color')).isExisting());
  t.true(await (await app.client.$('label=Width')).isExisting());
  t.true(await (await app.client.$('label=Height')).isExisting());

  await focusMain(t);
  await selectSource(t, sourceName);
  await clickRemoveSource(t);
  await waitForSourceExist(t, sourceName, true);
});

test('Create/Remove Image Source and view Source Properties', async t => {
  const app = t.context.app;
  const sourceName = 'Image Source';

  await addSource(t, 'Image', sourceName);
  await focusMain(t);

  t.true(await sourceIsExisting(t, sourceName));

  await selectSource(t, sourceName);
  await clickSourceProperties(t);

  await focusChild(t);
  t.true(await (await app.client.$('label=Image File')).isExisting());

  await focusMain(t);
  await selectSource(t, sourceName);
  await clickRemoveSource(t);
  await waitForSourceExist(t, sourceName, true);
})

test('Create/Remove Browser Source and view Source Properties', async t => {
  const app = t.context.app;
  const sourceName = 'Browser Source';

  await addSource(t, 'Browser Source', sourceName);
  await focusMain(t);

  t.true(await sourceIsExisting(t, sourceName));

  await selectSource(t, sourceName);
  await clickSourceProperties(t);

  await focusChild(t);
  t.true(await (await app.client.$('label=URL')).isExisting());
  t.true(await (await app.client.$('label=Width')).isExisting());
  t.true(await (await app.client.$('label=Height')).isExisting());

  await (await (await app.client.$('[data-name=fps_custom')).$('[type=checkbox]')).click();
  t.true(await (await app.client.$('label=FPS')).isExisting());
  t.true(await (await app.client.$('label=Custom CSS')).isExisting());

  await focusMain(t);
  await selectSource(t, sourceName);
  await clickRemoveSource(t);
  await waitForSourceExist(t, sourceName, true);
})

test('Create/Remove Media Source and view Source Properties', async t => {
  const app = t.context.app;
  const sourceName = 'Media Source';

  await addSource(t, 'Media Source', sourceName);
  await focusMain(t);

  t.true(await sourceIsExisting(t, sourceName));

  await selectSource(t, sourceName);
  await clickSourceProperties(t);

  await focusChild(t);
  t.true(await (await app.client.$('label=Local File')).isExisting());
  t.true(await (await app.client.$('label=Speed')).isExisting());
  t.true(await (await app.client.$('label=YUV Color Range')).isExisting());

  await (await (await app.client.$('[data-name=is_local_file')).$('[type=checkbox]')).click();
  t.true(await (await app.client.$('label=Network Buffering')).isExisting());
  t.true(await (await app.client.$('label=Input')).isExisting());
  t.true(await (await app.client.$('label=Input Format')).isExisting());
  t.true(await (await app.client.$('label=Reconnect Delay')).isExisting());

  await focusMain(t);
  await selectSource(t, sourceName);
  await clickRemoveSource(t);
  await waitForSourceExist(t, sourceName, true);
})

test('Create/Remove Image Slideshow and view Source Properties', async t => {
  const app = t.context.app;
  const sourceName = 'Image Slide Show';

  await addSource(t, 'Image Slide Show', sourceName);
  await focusMain(t);

  t.true(await sourceIsExisting(t, sourceName));

  await selectSource(t, sourceName);
  await clickSourceProperties(t);

  await focusChild(t);
  t.true(await (await app.client.$('label=Visibility Behavior')).isExisting());
  t.true(await (await app.client.$('label=Slide Mode')).isExisting());
  t.true(await (await app.client.$('label=Transition')).isExisting());
  t.true(await (await app.client.$('label=Time Between Slides (milliseconds)')).isExisting());
  t.true(await (await app.client.$('label=Transition Speed (milliseconds)')).isExisting());
  t.true(await (await app.client.$('label=Bounding Size/Aspect Ratio')).isExisting());
  t.true(await (await app.client.$('label=Image Files')).isExisting());

  await focusMain(t);
  await selectSource(t, sourceName);
  await clickRemoveSource(t);
  await waitForSourceExist(t, sourceName, true);
})

test('Create/Remove Text Source and view Source Properties', async t => {
  const app = t.context.app;
  const sourceName = 'Text Source';

  await addSource(t, 'Text (GDI+)', sourceName);
  await focusMain(t);

  t.true(await sourceIsExisting(t, sourceName));

  await selectSource(t, sourceName);
  await clickSourceProperties(t);

  await focusChild(t);
  t.true(await (await app.client.$('label=Use Google Font')).isExisting());
  t.true(await (await app.client.$('label=Font Family')).isExisting());
  t.true(await (await app.client.$('label=Font Style')).isExisting());
  t.true(await (await app.client.$('label=Font Size')).isExisting());
  t.true(await (await app.client.$('label=Text')).isExisting());

  await (await (await app.client.$('[data-name=read_from_file')).$('[type=checkbox]')).click();
  t.true(await (await app.client.$('label=Text File (UTF-8)')).isExisting());

  t.true(await (await app.client.$('label=Text Transform')).isExisting());
  t.true(await (await app.client.$('label=Color')).isExisting());
  t.true(await (await app.client.$('label=Opacity')).isExisting());

  await (await (await app.client.$('[data-name=gradient')).$('[type=checkbox]')).click();
  t.true(await (await app.client.$('label=Gradient Color')).isExisting());
  t.true(await (await app.client.$('label=Gradient Opacity')).isExisting());
  t.true(await (await app.client.$('label=Gradient Direction')).isExisting());

  t.true(await (await app.client.$('label=Background Color')).isExisting());
  t.true(await (await app.client.$('label=Background Opacity')).isExisting());
  t.true(await (await app.client.$('label=Alignment')).isExisting());
  t.true(await (await app.client.$('label=Vertical Alignment')).isExisting());

  await (await (await app.client.$('[data-name=outline')).$('[type=checkbox]')).click();
  t.true(await (await app.client.$('label=Outline Size')).isExisting());
  t.true(await (await app.client.$('label=Outline Color')).isExisting());
  t.true(await (await app.client.$('label=Outline Opacity')).isExisting());

  await (await (await app.client.$('[data-name=chatlog')).$('[type=checkbox]')).click();
  t.true(await (await app.client.$('label=Chatlog Line Limit')).isExisting());

  await (await (await app.client.$('[data-name=extents')).$('[type=checkbox]')).click();
  t.true(await (await app.client.$('label=Width')).isExisting());
  t.true(await (await app.client.$('label=Height')).isExisting());

  await focusMain(t);
  await selectSource(t, sourceName);
  await clickRemoveSource(t);
  await waitForSourceExist(t, sourceName, true);
})

test('Create/Remove Display Capture and view Source Properties', async t => {
  const app = t.context.app;
  const sourceName = 'Display Capture';

  await addSource(t, 'Display Capture', sourceName);
  await focusMain(t);

  t.true(await sourceIsExisting(t, sourceName));

  await selectSource(t, sourceName);
  await clickSourceProperties(t);

  await focusChild(t);
  // this feature is in v1.3.0, uncomment once it is fully shipped
  // t.true(await (await app.client.$('label=Capture Method')).isExisting());
  t.true(await (await app.client.$('label=Display')).isExisting());

  await focusMain(t);
  await selectSource(t, sourceName);
  await clickRemoveSource(t);
  await waitForSourceExist(t, sourceName, true);
})

test('Create/Remove Window Capture and view Source Properties', async t => {
  const app = t.context.app;
  const sourceName = 'Window Capture';

  await addSource(t, 'Window Capture', sourceName);
  await focusMain(t);

  t.true(await sourceIsExisting(t, sourceName));

  await selectSource(t, sourceName);
  await clickSourceProperties(t);

  await focusChild(t);
  t.true(await (await app.client.$('label=Window')).isExisting());
  t.true(await (await app.client.$('label=Capture Method')).isExisting());
  t.true(await (await app.client.$('label=Window Match Priority')).isExisting());

  await focusMain(t);
  await selectSource(t, sourceName);
  await clickRemoveSource(t);
  await waitForSourceExist(t, sourceName, true);
})

test('Create/Remove Game Capture and view Source Properties', async t => {
  const app = t.context.app;
  const sourceName = 'Game Capture';

  await addSource(t, 'Game Capture', sourceName);
  await focusMain(t);

  t.true(await sourceIsExisting(t, sourceName));

  await selectSource(t, sourceName);
  await clickSourceProperties(t);

  await focusChild(t);
  t.true(await (await app.client.$('label=Mode')).isExisting());
  t.true(await (await app.client.$('label=Hook Rate')).isExisting());

  await (await (await app.client.$('[data-name=user_placeholder_use')).$('[type=checkbox]')).click();
  t.true(await (await app.client.$('label=Placeholder Image')).isExisting());

  await focusMain(t);
  await selectSource(t, sourceName);
  await clickRemoveSource(t);
  await waitForSourceExist(t, sourceName, true);
})

test('Create/Remove Video Capture Device and view Source Properties', async t => {
  const app = t.context.app;
  const sourceName = 'Video Capture Device';

  await addSource(t, 'Video Capture Device', sourceName);
  await focusMain(t);

  t.true(await sourceIsExisting(t, sourceName));

  await selectSource(t, sourceName);
  await clickSourceProperties(t);

  await focusChild(t);
  t.true(await (await app.client.$('label=Device')).isExisting());
  t.true(await (await app.client.$('label=Resolution/FPS Type')).isExisting());
  t.true(await (await app.client.$('label=Resolution')).isExisting());
  t.true(await (await app.client.$('label=FPS')).isExisting());
  t.true(await (await app.client.$('label=Video Format')).isExisting());
  t.true(await (await app.client.$('label=Color Space')).isExisting());
  t.true(await (await app.client.$('label=Color Range')).isExisting());
  t.true(await (await app.client.$('label=Buffering')).isExisting());
  t.true(await (await app.client.$('label=Audio Output Mode')).isExisting());

  await (await (await app.client.$('[data-name=use_custom_audio_device')).$('[type=checkbox]')).click();
  t.true(await (await app.client.$('label=Audio Device')).isExisting());

  await focusMain(t);
  await selectSource(t, sourceName);
  await clickRemoveSource(t);
  await waitForSourceExist(t, sourceName, true);
})

test('Create/Remove Audio Input Capture and view Source Properties', async t => {
  const app = t.context.app;
  const sourceName = 'Audio Input Capture';

  await addSource(t, 'Audio Input Capture', sourceName);
  await focusMain(t);

  t.true(await sourceIsExisting(t, sourceName));

  await selectSource(t, sourceName);
  await clickSourceProperties(t);

  await focusChild(t);
  t.true(await (await app.client.$('label=Device')).isExisting());

  await focusMain(t);
  await selectSource(t, sourceName);
  await clickRemoveSource(t);
  await waitForSourceExist(t, sourceName, true);
})

test('Create/Remove Audio Output Capture and view Source Properties', async t => {
  const app = t.context.app;
  const sourceName = 'Audio Output Capture';

  await addSource(t, 'Audio Output Capture', sourceName);
  await focusMain(t);

  t.true(await sourceIsExisting(t, sourceName));

  await selectSource(t, sourceName);
  await clickSourceProperties(t);

  await focusChild(t);
  t.true(await (await app.client.$('label=Device')).isExisting());

  await focusMain(t);
  await selectSource(t, sourceName);
  await clickRemoveSource(t);
  await waitForSourceExist(t, sourceName, true);
})

test('Rename source', async t => {
  const app = t.context.app;
  const sourceName = 'MyColorSource1';
  const newSourceName = 'MyColorSource2';

  await addSource(t, 'Color Source', sourceName);

  await openRenameWindow(t, sourceName);

  await focusChild(t);
  const form = new FormMonkey(t);
  await form.setInputValue('[data-name=sourceName]', newSourceName);
  await (await app.client.$('button=Done')).click();

  await focusMain(t);
  t.true(await sourceIsExisting(t, newSourceName));
});
