import { readdir } from 'fs-extra';
import { focusMain, test, useSpectron } from './helpers/spectron';
import { sleep } from './helpers/sleep';
import { setTemporaryRecordingPath } from './helpers/spectron/output';
import { addSource } from './helpers/spectron/sources';

useSpectron();

test('Selective Recording', async t => {
  const sourceType = 'Browser Source';
  const sourceName = `Example ${sourceType}`;
  const { client } = t.context.app;
  const tmpDir = await setTemporaryRecordingPath(t);

  // Add a browser source
  await addSource(t, sourceType, sourceName);

  // Toggle selective recording
  await focusMain(t);
  await client.click('.studio-controls-top .icon-smart-record');

  // Check that selective recording icon is active
  t.true(await client.isExisting('.icon-smart-record.icon--active'));

  // Check that browser source has a selective recording toggle
  t.true(await client.isExisting('.sl-vue-tree-sidebar .source-selector-action.icon-smart-record'));

  // Cycle selective recording mode on browser source
  await client.click('.sl-vue-tree-sidebar .source-selector-action.icon-smart-record');

  // Check that source is set to stream only
  t.true(await client.isExisting('.sl-vue-tree-sidebar .source-selector-action.icon-broadcast'));

  // Cycle selective recording mode to record only
  await client.click('.sl-vue-tree-sidebar .source-selector-action.icon-broadcast');

  // Check that source is set to record only
  t.true(await client.isExisting('.sl-vue-tree-sidebar .source-selector-action.icon-studio'));

  // Start recording
  await client.click('.record-button');
  await sleep(2000);

  // Ensure recording indicator is active
  t.true(await client.isExisting('.record-button.active'));

  // Stop recording
  await client.click('.record-button');
  await client.waitForVisible('.record-button:not(.active)', 60000);

  // Check that file exists
  const files = await readdir(tmpDir);
  t.is(files.length, 1);
});
