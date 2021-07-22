import { getClient } from '../api-client';
import {
  click,
  clickButton,
  focusChild, isDisplayed,
  selectButton, useChildWindow,
  useMainWindow,
  waitForDisplayed
} from './core';
import { sleep } from '../sleep';
import { useForm } from './forms';
import { setOutputResolution } from './settings/settings';
import { StreamSettingsService } from '../../../app/services/settings/streaming';

/**
 * Go live and wait for stream start
 */
export async function goLive(prefillData?: Record<string, any>) {
  await tryToGoLive(prefillData);
  await waitForStreamStart();
}

/**
 * setup settings for running streaming tests in CI
 */
export async function prepareToGoLive() {
  // set low resolution to prevent intensive CPU usage
  await setOutputResolution('100x100');

  // disable warning when trying to start stream without video-sources
  (await getClient())
    .getResource<StreamSettingsService>('StreamSettingsService')
    .setSettings({ warnNoVideoSources: false });
}

/**
 * Simply click the "Go Live" button in the Main window
 * It opens the EditStreamInfo window or start stream if the conformation dialog has been disabled
 */
export async function clickGoLive() {
  await useMainWindow(async () => {
    await clickButton('Go Live');
  });
}

/**
 * Fill the form in the EditStreamInfo window and click Go Live
 */
export async function tryToGoLive(prefillData?: Record<string, unknown>) {
  await prepareToGoLive();
  await clickGoLive();
  const { fillForm } = useForm('editStreamForm');

  await useChildWindow(async () => {
    await waitForDisplayed('[data-type="text"]');
    if (prefillData) await fillForm(prefillData);
    await submit();
  });
}

/**
 * Submit EditStreamInfo form in the child window
 */
export async function submit() {
  const submitButton = await selectButton('Confirm & Go Live');
  await submitButton.waitForEnabled({ timeout: 10000 });
  await submitButton.click();
}

export async function waitForStreamStart() {
  // check we're streaming
  await useMainWindow(async () => {
    await (await selectButton('End Stream')).waitForExist({ timeout: 20 * 1000 });
  });
}

/**
 * Click the "End Stream" button and wait until stream stops
 */
export async function stopStream() {
  await useMainWindow(async () => {
    await clickButton('End Stream');
    await waitForStreamStop();
  });
}

export async function waitForStreamStop() {
  await sleep(2000); // the stream often starts with delay so we have the "Go Live" button visible for a second even we clicked "Start Stream"
  const ms = 40 * 1000; // we may wait for a long time if the stream key is not valid

  await useMainWindow(async () => {
    try {
      await waitForDisplayed('button=Go Live', { timeout: ms });
    } catch (e) {
      throw new Error(`Stream did not stop in ${ms}ms`);
    }
  });
}

export async function chatIsVisible() {
  return await useMainWindow(async () => {

    return await isDisplayed('a=Refresh Chat');
  });
}

export async function startRecording() {
  await click('.record-button');
  await waitForDisplayed('.record-button.active');
}

export async function stopRecording() {
  await click('.record-button');
  await waitForDisplayed('.record-button:not(.active)', { timeout: 15000 });
}

/**
 * Open liveDock and edit stream settings
 */
export async function updateChannelSettings(prefillData?: Record<string, any>) {
  await useMainWindow(async () => {
    await click('.live-dock'); // open LiveDock
    await click('.icon-edit'); // click Edit
    await focusChild();
    await clickButton('Update');
    await waitForDisplayed('div=Successfully updated');
  });
}
