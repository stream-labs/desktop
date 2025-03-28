import {
  click,
  clickButton,
  clickCheckbox,
  focusChild,
  useChildWindow,
  useMainWindow,
} from '../core';
import { mkdtemp } from 'fs-extra';
import { tmpdir } from 'os';
import * as path from 'path';
import { setInputValue } from '../forms/base';
import { FormMonkey } from '../../form-monkey';
import { TExecutionContext } from '../../../helpers/webdriver';

/**
 * Open the settings window with a given category selected
 * If callback provided then focus the child window and execute the callback
 */
export async function showSettingsWindow(category: string, cb?: () => Promise<unknown>) {
  await useMainWindow(async () => {
    await click('.side-nav .icon-settings');

    if (category) {
      await focusChild();
      await click(`.nav-item__content=${category}`);
    }
  });

  if (cb) {
    await useChildWindow(cb);
  }
}

/**
 * Set recording path to a temp dir
 */
export async function setTemporaryRecordingPath(): Promise<string> {
  const tmpDir = await mkdtemp(path.join(tmpdir(), 'slobs-recording-'));
  await showSettingsWindow('Output', async () => {
    await setInputValue('input[data-name="FilePath"]', tmpDir);
    await clickButton('Done');
  });
  return tmpDir;
}

/**
 * Set output resolution
 * It's recommended to set low resolution for streaming and recording tests
 * to prevent high CPU usage
 */
export async function setOutputResolution(resolution: string) {
  const [width, height] = resolution.split('x');
  await showSettingsWindow('Video', async () => {
    await setInputValue('[data-name="outputRes"]', `${width}x${height}`);
    await clickButton('Done');
  });
}
