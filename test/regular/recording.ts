import { readdir } from 'fs-extra';
import { test, TExecutionContext, useWebdriver } from '../helpers/webdriver';
import { sleep } from '../helpers/sleep';
import { startRecording, stopRecording } from '../helpers/modules/streaming';
import { FormMonkey } from '../helpers/form-monkey';
import {
  setOutputResolution,
  setTemporaryRecordingPath,
  showSettingsWindow,
} from '../helpers/modules/settings/settings';
import {
  clickButton,
  clickWhenDisplayed,
  focusMain,
  getNumElements,
  waitForDisplayed,
} from '../helpers/modules/core';
import { logIn } from '../helpers/webdriver/user';
import { toggleDualOutputMode } from '../helpers/modules/dual-output';
import { setFormDropdown } from '../helpers/webdriver/forms';
import { setInputValue } from '../helpers/modules/forms';

// not a react hook
// eslint-disable-next-line react-hooks/rules-of-hooks
useWebdriver();

/**
 * Iterate over all formats and record a 0.5s video in each.
 * @param t - AVA test context
 * @param advanced - whether to use advanced settings
 * @returns number of formats
 */
async function createRecordingFiles(advanced: boolean = false): Promise<number> {
  const formats = ['flv', 'mp4', 'mov', 'mkv', 'ts', 'm3u8'];

  // Record 0.5s video in every format
  for (const format of formats) {
    await showSettingsWindow('Output', async () => {
      await sleep(2000);
      if (advanced) {
        await clickButton('Recording');
      }

      await sleep(2000);
      await setFormDropdown('Recording Format', format);
      await sleep(2000);
      await clickButton('Done');
    });

    await focusMain();
    await startRecording();
    await sleep(500);
    await stopRecording();

    // Confirm notification has been shown
    await focusMain();
    await clickWhenDisplayed('span=A new Recording has been completed. Click for more info');
    await waitForDisplayed('h1=Recordings', { timeout: 1000 });
  }

  return Promise.resolve(formats.length);
}

async function validateRecordingFiles(t: TExecutionContext, tmpDir: string, numFormats: number) {
  // Check that every file was created
  const files = await readdir(tmpDir);

  const numFiles = files.length;

  // M3U8 creates multiple TS files in addition to the catalog itself.
  t.true(numFiles >= numFormats, `Files that were created:\n${files.join('\n')}`);
  waitForDisplayed('h1=Recordings');

  const numRecordings = await getNumElements('[data-test=filename]');
  t.is(numRecordings, numFiles, 'Number of recordings in history matches number of files recorded');
}

/**
 * Recording with one context active (horizontal)
 */

test('Recording', async t => {
  // low resolution reduces CPU usage
  await setOutputResolution('100x100');
  const tmpDir = await setTemporaryRecordingPath();

  // Simple Recording
  const numFormats = await createRecordingFiles();
  await validateRecordingFiles(t, tmpDir, numFormats);
});

test('Advanced Recording', async t => {
  // low resolution reduces CPU usage
  await setOutputResolution('100x100');

  // Advanced Recording
  const tmpAdvDir = await setTemporaryRecordingPath(true);
  const numFiles = await createRecordingFiles(true);
  console.log('numFiles', numFiles);
  await validateRecordingFiles(t, tmpAdvDir, numFiles);
});

/**
 * Recording with two contexts active (horizontal and vertical)
 * should produce no different results than with one context.
 */
test('Recording with two contexts active', async t => {
  await logIn(t);
  await toggleDualOutputMode();
  const tmpDir = await setTemporaryRecordingPath();
  // low resolution reduces CPU usage
  await setOutputResolution('100x100');
  await showSettingsWindow('Output', async () => {
    await setFormDropdown('Output Mode', 'Advanced');
    await clickButton('Recording');
    await setInputValue('[data-name="RecFilePath"] input', tmpDir);
  });

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
    await sleep(1000);
    await stopRecording();
    // Wait to ensure that output setting are editable
    await sleep(1000);
  }
  // Check that every file was created
  const files = await readdir(tmpDir);
  // M3U8 creates multiple TS files in addition to the catalog itself.
  t.true(files.length >= formats.length, `Files that were created:\n${files.join('\n')}`);
});
