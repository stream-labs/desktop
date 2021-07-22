import { click, clickButton, focusChild, useChildWindow, useMainWindow } from '../core';
import { mkdtemp } from 'fs-extra';
import { tmpdir } from 'os';
import * as path from 'path';
import { setInputValue } from '../forms/base';
import { FormMonkey } from '../../form-monkey';
import { getContext } from '../../spectron';

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
    await setInputValue('[data-role="input"][data-name="Recording Path"]', tmpDir);
    await clickButton('Done');
  });
  return tmpDir;
}

export async function setOutputResolution(resolution: string) {
  const [width, height] = resolution.split('x');
  await showSettingsWindow('Video', async () => {
    await clickButton('Use Custom');
    const form = new FormMonkey(getContext());
    await form.fill({ width, height });
    await clickButton('Apply');
    await clickButton('Done');
  });
}
