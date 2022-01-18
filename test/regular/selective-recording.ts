import { readdir } from 'fs-extra';
import { test, runWithSpectron } from '../helpers/spectron';
import { addSource } from '../helpers/modules/sources';
import {
  setOutputResolution,
  setTemporaryRecordingPath,
} from '../helpers/modules/settings/settings';
import { focusMain } from '../helpers/modules/core';

runWithSpectron();

test('Selective Recording', async t => {
  const sourceType = 'Browser Source';
  const sourceName = `Example ${sourceType}`;
  const { client } = t.context.app;
  const tmpDir = await setTemporaryRecordingPath();

  // set lower resolution for better performance in CI
  await setOutputResolution('100x100');

  // Add a browser source
  await addSource(sourceType, sourceName);

  // Toggle selective recording
  await focusMain();
  await (await client.$('.studio-controls-top .icon-smart-record')).click();

  // Check that selective recording icon is active
  await (await client.$('.icon-smart-record.icon--active')).waitForExist();

  // Check that browser source has a selective recording toggle
  t.true(
    await (
      await client.$('.sl-vue-tree-sidebar .source-selector-action.icon-smart-record')
    ).isExisting(),
  );

  // Cycle selective recording mode on browser source
  await (await client.$('.sl-vue-tree-sidebar .source-selector-action.icon-smart-record')).click();

  // Check that source is set to stream only
  await (
    await client.$('.sl-vue-tree-sidebar .source-selector-action.icon-broadcast')
  ).waitForExist();

  // Cycle selective recording mode to record only
  await (await client.$('.sl-vue-tree-sidebar .source-selector-action.icon-broadcast')).click();

  // Check that source is set to record only
  await (await client.$('.sl-vue-tree-sidebar .source-selector-action.icon-studio')).waitForExist();

  // Start recording and wait
  await (await client.$('.record-button')).click();

  // Ensure recording indicator is active
  await (await client.$('.record-button.active')).waitForDisplayed({ timeout: 15000 });

  // Stop recording
  await (await client.$('.record-button')).click();
  await (await client.$('.record-button:not(.active)')).waitForDisplayed({ timeout: 40000 }); // stopping recording takes too much time on CI

  // Check that file exists
  const files = await readdir(tmpDir);
  t.is(files.length, 1);
});
