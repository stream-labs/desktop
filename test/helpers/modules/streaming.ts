/*
 * The streaming module provides helper-methods for everything related to
 * starting, scheduling, and updating streams
 */

import { getApiClient } from '../api-client';
import {
  click,
  clickButton,
  focusChild,
  isDisplayed,
  select,
  selectButton,
  useChildWindow,
  useMainWindow,
  waitForClickable,
  waitForDisplayed,
  waitForEnabled,
} from './core';
import { sleep } from '../sleep';
import { fillForm, TFormData, useForm } from './forms';
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
  (await getApiClient())
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
    await waitForSettingsWindowLoaded();
    if (prefillData) {
      await fillForm(prefillData);
      await sleep(500);
    }
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

export async function waitForSettingsWindowLoaded() {
  // the spinner can take some time to appear
  await sleep(500);
  // wait for at least one input to be displayed
  return waitForDisplayed('[data-role="input"][data-type="text"]', { timeout: 15000 });
}

export async function switchAdvancedMode() {
  await waitForDisplayed('[data-name="advancedMode"]');
  await waitForEnabled('[data-name=advancedMode]', { timeout: 15000 });
  await click('[data-name=advancedMode]');
}

/**
 * Open liveDock and edit stream settings
 */
export async function updateChannelSettings(prefillData: TFormData) {
  await useMainWindow(async () => {
    await click('.live-dock'); // open LiveDock
    await click('.icon-edit'); // click Edit
    await focusChild();
    if (prefillData) await fillForm('editStreamForm', prefillData);
    await clickButton('Update');
    await waitForDisplayed('div=Successfully updated');
  });
}

export async function openScheduler() {
  await useMainWindow(async () => {
    await click('.icon-date'); // open the StreamScheduler
    await waitForClickable('.ant-picker-calendar-month-select'); // wait for loading
  });
}

export async function scheduleStream(date: Date, formData: TFormData) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  await useMainWindow(async () => {
    await openScheduler();

    // select the year
    await click('.ant-picker-calendar-year-select');
    await click(`.ant-select-item-option[title="${year}"]`);

    // select the month
    await click('.ant-picker-calendar-month-select');
    await click(`.rc-virtual-list-holder-inner div:nth-child(${month + 1})`);

    // click the date
    await click(`.ant-picker-calendar-date-value=${day}`);

    // select the platform
    await fillForm(formData);

    await clickButton('Schedule');
    await waitForClickable('.ant-picker-calendar-month-select', { timeout: 10000 });
  });
}
