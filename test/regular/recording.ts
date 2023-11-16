import { readdir } from 'fs-extra';
import { test, useWebdriver } from '../helpers/webdriver';
import { sleep } from '../helpers/sleep';
import { startRecording, stopRecording } from '../helpers/modules/streaming';
import { FormMonkey } from '../helpers/form-monkey';
import {
  setOutputResolution,
  setTemporaryRecordingPath,
  showSettingsWindow,
} from '../helpers/modules/settings/settings';
import { clickButton, focusMain, selectElements, isDisplayed } from '../helpers/modules/core';
import { logIn } from '../helpers/webdriver/user';
import { toggleDualOutputMode } from '../helpers/modules/dual-output';
import { showPage } from '../helpers/modules/navigation';
import { setFormDropdown } from '../helpers/webdriver/forms';

useWebdriver();

/**
 * Records all formats in single output mode with a vanilla scene collection
 * and dual output mode with a dual output scene collection
 */
test('Recording', async t => {
  const tmpDir = await setTemporaryRecordingPath();

  // low resolution reduces CPU usage
  await setOutputResolution('100x100');

  const formats = ['flv', 'mp4', 'mov', 'mkv', 'ts', 'm3u8'];

  await showSettingsWindow('Output', async () => {
    await setFormDropdown('Recording Quality', 'High Quality, Medium File Size');
    await sleep(500);
  });

  // Record 0.5s video in every format
  for (const format of formats) {
    await showSettingsWindow('Output', async () => {
      const form = new FormMonkey(t);
      await form.setInputValue(await form.getInputSelectorByTitle('Recording Format'), format);
      await clickButton('Done');
    });
    await focusMain();
    await startRecording();
    await sleep(500);
    await stopRecording();

    // Wait to ensure that output setting are editable
    await sleep(500);
  }

  // Check that every file was created
  const singleOutputFiles = await readdir(tmpDir);

  // M3U8 creates multiple TS files in addition to the catalog itself.
  t.true(
    singleOutputFiles.length >= formats.length,
    `Files that were created:\n${singleOutputFiles.join('\n')}`,
  );

  await logIn(t);
  await toggleDualOutputMode();
  // low resolution reduces CPU usage
  // await setOutputResolution('100x100');
  // Record 0.5s video in every format
  for (const format of formats) {
    await showSettingsWindow('Output', async () => {
      // await setFormDropdown('Recording Quality', 'High Quality, Medium File Size');
      // await sleep(500);
      const form = new FormMonkey(t);
      await form.setInputValue(await form.getInputSelectorByTitle('Recording Format'), format);
      await clickButton('Done');
    });

    await focusMain();
    await startRecording();
    await sleep(500);
    await stopRecording();
    // Wait to ensure that output setting are editable
    // await sleep(1000);
  }
  // Check that every file was created
  const dualOutputFiles = (await readdir(tmpDir))
    .filter(file => !singleOutputFiles.includes(file))
    .map(file => file);
  // M3U8 creates multiple TS files in addition to the catalog itself.
  t.true(
    dualOutputFiles.length >= formats.length,
    `Files that were created:\n${dualOutputFiles.join('\n')}`,
  );
});

/**
 * Recording in dual output mode with a dual output scene collection
 */
test('Recording Dual Output', async t => {
  await logIn(t);
  await toggleDualOutputMode();

  const tmpDir = await setTemporaryRecordingPath();

  // low resolution reduces CPU usage
  await setOutputResolution('100x100');

  await showSettingsWindow('Output', async () => {
    await setFormDropdown('Recording Quality', 'High Quality, Medium File Size');
    await sleep(500);
    await clickButton('Done');
  });

  // Recording mode: record horizontal and vertical displays
  await focusMain();
  await startRecording();
  // Record icons show in both headers
  await isDisplayed('i.icon-record');
  const icons = await selectElements('i.icon-record');
  t.true(icons.length === 2);
  await stopRecording();
  // Wait to ensure that video file is finalized
  await sleep(500);

  // Generated two recordings
  await showPage('Recordings');
  const recordings = await selectElements('span.file');
  t.true(recordings.length === 2);

  // Check that every two files were created with correct file name
  const files = await readdir(tmpDir);
  t.true(recordings.length === files.length);
  const fileNames = files.map(file => file.split('/').pop());
  recordings.forEach(async recording => {
    const recordingName = await recording.getText();
    t.true(fileNames.includes[recordingName]);
  });

  // Streaming mode (both):
  // - Cannot record either display (button will hide after go live)
  // - Stream icons show in both headers
  // - Record icons do not show in headers
  // - No recordings generated
  // await focusMain();
  // await prepareToGoLive();
  // await clickGoLive();

  // await sleep(5000);
  t.pass();
  // Streaming mode (vert record):
  // - Stream horizontal and record vertical
  // - Confirm only horizontal is streaming
  // - Confirm only vertical is recording
  // - Generate one recording
  // - Stream icon shows in horizontal header, record icon shows in vertical header
});
