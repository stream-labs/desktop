import { readdir } from 'fs-extra';
import { test, useWebdriver } from '../helpers/webdriver';
import { sleep } from '../helpers/sleep';
import {
  clickGoLive,
  prepareToGoLive,
  startRecording,
  stopRecording,
  stopStream,
} from '../helpers/modules/streaming';
import { FormMonkey } from '../helpers/form-monkey';
import {
  setOutputResolution,
  setTemporaryRecordingPath,
  showSettingsWindow,
} from '../helpers/modules/settings/settings';
import {
  clickButton,
  focusMain,
  selectElements,
  isDisplayed,
  select,
  focusChild,
  waitForDisplayed,
} from '../helpers/modules/core';
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
test.skip('Recording Dual Output', async t => {
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

  // Confirm vertical recording toggle
  await prepareToGoLive();
  await clickGoLive();
  await focusChild();
  await waitForDisplayed('div=Vertical Recording Only');
  const verticalToggle = await select('[data-name=record-vertical]');
  let value = await verticalToggle.getAttribute('value');
  t.true(value === 'false');
  await verticalToggle.click();
  value = await verticalToggle.getAttribute('value');
  t.true(value === 'false');

  // Recording mode: record horizontal and vertical displays
  await focusMain();
  await startRecording();
  // Record icons show in both headers
  // Icons are conditionally shown/hidden prevent rendering issues with the icon visibility shifting the title text
  await isDisplayed('i.icon-record.hidden');
  const hiddenStream = await selectElements('i.icon-stream.hidden');
  const hiddenRecord = await selectElements('i.icon-record.hidden');
  const visibleRecord = await selectElements('i.icon-record');

  t.true(hiddenStream.length === 2);
  t.true(hiddenRecord.length === 0);
  t.true(visibleRecord.length === 2);
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

  // Streaming mode
  // await clickGoLive();
  // await focusChild();
  // await waitForDisplayed('div=Vertical Recording Only');
  // const toggle = await select('[data-name=record-vertical]');
  // await toggle.click();

  // await goLive();
  // // Stream icons show in both headers, record icons do not show in headers
  // // Icons are conditionally shown/hidden prevent rendering issues with the icon visibility shifting the title text
  // await isDisplayed('i.icon-stream.hidden');
  // hiddenRecord = await selectElements('i.icon-record.hidden');
  // hiddenStream = await selectElements('i.icon-stream.hidden');
  // const visibleStream = await selectElements('i.icon-stream');

  // t.true(hiddenRecord.length === 2);
  // t.true(hiddenStream.length === 0);
  // t.true(visibleStream.length === 2);

  // await stopStream();
  // await sleep(5000);

  // // No recordings generated
  // await showPage('Recordings');
  // t.true(recordings === (await selectElements('span.file')));

  // Streaming mode (vert record):
  // - Stream horizontal and record vertical
  // - Confirm only horizontal is streaming
  // - Confirm only vertical is recording
  // - Generate one recording
  // - Stream icon shows in horizontal header, record icon shows in vertical header
});

/**
 * Records all file quality in single output mode with a vanilla scene collection
 * and dual output mode with a dual output scene collection
 */
test.skip('Recording File Quality', async t => {
  // const tmpDir = await setTemporaryRecordingPath();

  // // low resolution reduces CPU usage
  // await setOutputResolution('100x100');

  // const formats = ['flv', 'mp4', 'mov', 'mkv', 'ts', 'm3u8'];

  await showSettingsWindow('Output', async () => {
    const options = await selectElements('.multiselect__option');
    // const labels = options.map(async (option: WebdriverIO.Element) => await option.getText());

    // Record 0.5s video with every quality
    for (const option of options) {
      const title = await option.getText();
      console.log('title ', title);
    }
    // const options = await selectElements('[data-name]="RecQuality"');
    // const options = await getFormDropdownOptions('Recording Quality', 'RecQuality');

    // console.log(labels);
    // await setFormDropdown('Recording Quality', 'High Quality, Medium File Size');
    await sleep(50000);
  });
});
