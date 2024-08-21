import { readdir } from 'fs-extra';
import { ITestContext, test, useWebdriver } from '../helpers/webdriver';
import { sleep } from '../helpers/sleep';
import {
  clickGoLive,
  prepareToGoLive,
  startRecording,
  stopRecording,
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
  focusChild,
  closeWindow,
} from '../helpers/modules/core';
import { logIn } from '../helpers/webdriver/user';
import { logIn as multiLogIn } from '../helpers/modules/user';
import { toggleDualOutputMode } from '../helpers/modules/dual-output';
import { showPage } from '../helpers/modules/navigation';
import { setFormDropdown } from '../helpers/webdriver/forms';
import { ExecutionContext } from 'ava';

useWebdriver();

async function confirmFilesCreated(
  t: ExecutionContext<ITestContext>,
  tmpDir: string,
  numCreatedFiles: number,
) {
  const recordings = await selectElements('span.file');
  t.true(recordings.length === numCreatedFiles);

  // check that every files was created with correct file name
  const files = await readdir(tmpDir);
  t.true(recordings.length === files.length);
  const fileNames = files.map(file => file.split('/').pop());
  recordings.forEach(async recording => {
    const recordingName = await recording.getText();
    t.true(fileNames.includes[recordingName]);
  });
}

async function recordAndConfirmRecordings(
  t: ExecutionContext<ITestContext>,
  tmpDir: string,
  qualities: string[],
  setSettings: (setting: string) => Promise<void>,
  numExpectedRecordings: number,
) {
  for (const quality of qualities) {
    await setSettings(quality);
    await focusMain();
    await startRecording();
    await sleep(500);
    await stopRecording();

    // Wait to ensure that output setting are editable
    await sleep(500);
  }

  // Check that every file was created
  const files = await readdir(tmpDir);

  console.log('files length ', files.length);

  // M3U8 creates multiple TS files in addition to the catalog itself.
  t.true(files.length === numExpectedRecordings, `Files that were created:\n${files.join('\n')}`);
}

async function prepareRecordDualOutput(t: ExecutionContext<ITestContext>): Promise<string> {
  await multiLogIn('twitch', { multistream: true });
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

  return tmpDir;
}

/**
 * Records all formats in single output mode with a vanilla scene collection
 * and dual output mode with a dual output scene collection
 */
test('Recording', async t => {
  const tmpDir = await setTemporaryRecordingPath();

  // low resolution reduces CPU usage
  await setOutputResolution('100x100');

  const formats = ['flv', 'mp4', 'mov', 'mkv', 'ts', 'm3u8'];

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

  /**
   * Recording in Dual Output Mode
   */
  await logIn(t);
  await toggleDualOutputMode();

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
  // Wait for recording to start
  await sleep(500);

  // Record icons show in both headers
  // Icons are conditionally shown/hidden prevent rendering issues with the icon visibility shifting the title text
  const streamIcons = await selectElements('i.icon-stream.visible');
  const recordIcons = await selectElements('i.icon-record.visible');

  t.true(streamIcons.length === 0);
  t.true(recordIcons.length === 2);

  await stopRecording();
  // Wait to ensure that both video files are finalized
  await sleep(500);

  await focusMain();

  //  Generated two recordings
  await showPage('Recordings');
  await confirmFilesCreated(t, tmpDir, 2);
});

/**
 * Records all file quality in single output mode with a vanilla scene collection
 * and dual output mode with a dual output scene collection
 *
 * TODO: refactor for `Same as stream` as valid dual output quality when backend fix is implemented
 */
test('Recording File Quality', async t => {
  const tmpDir = await setTemporaryRecordingPath();

  // low resolution reduces CPU usage
  await setOutputResolution('100x100');

  const singleOutputQualities = [
    'High Quality, Medium File Size',
    'Indistinguishable Quality, Large File Size',
    'Lossless Quality, Tremendously Large File Size',
    'Same as stream',
  ];

  // `Same as stream` is currently not a valid option when recording dual output
  const dualOutputQualities = [
    'High, Medium File Size',
    'Indistinguishable, Large File Size',
    'Lossless, Tremendously Large File Size',
  ];

  // single output recording quality
  await recordAndConfirmRecordings(
    t,
    tmpDir,
    singleOutputQualities,
    async (quality: string) => {
      await showSettingsWindow('Output', async () => {
        await setFormDropdown('Recording Quality', quality);
        await clickButton('Done');
      });
    },
    singleOutputQualities.length,
  );

  // dual output recording quality
  await logIn(t);
  await toggleDualOutputMode();
  await prepareToGoLive();
  await focusMain();

  // the single output recordings already exist in the directory
  // so account for them in the number of expected recordings
  const numExpectedRecordings = singleOutputQualities.length + dualOutputQualities.length * 2;

  await recordAndConfirmRecordings(
    t,
    tmpDir,
    dualOutputQualities,
    async (quality: string) => {
      await clickGoLive();
      await focusChild();
      const form = new FormMonkey(t);
      await form.setInputValue('[data-name="recording-quality"]', quality);
      await closeWindow('child');
    },
    numExpectedRecordings,
  );

  await toggleDualOutputMode();
});
