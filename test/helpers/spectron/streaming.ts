import { click, focusChild, focusMain, TExecutionContext } from './index';
import { setOutputResolution } from './output';
import { fillForm } from '../form-monkey';
import { getClient } from '../api-client';
import moment = require('moment');
import { StreamSettingsService } from '../../../app/services/settings/streaming';
import { sleep } from '../sleep';
/**
 * Go live and wait for stream start
 */
export async function goLive(t: TExecutionContext, prefillData?: Dictionary<string>) {
  await tryToGoLive(t, prefillData);
  await waitForStreamStart(t);
}

/**
 * setup settings for running streaming tests in CI
 */
export async function prepareToGoLive(t: TExecutionContext) {
  // set low resolution to prevent intensive CPU usage
  await setOutputResolution(t, '100x100');

  // disable warning when trying to start stream without video-sources
  (await getClient())
    .getResource<StreamSettingsService>('StreamSettingsService')
    .setSettings({ warnNoVideoSources: false });
}

/**
 * Simply click the "Go Live" button
 * It opens the EditStreamInfo window or start stream if the conformation dialog has been disabled
 */
export async function clickGoLive(t: TExecutionContext) {
  await focusMain(t);
  await click(t, 'button=Go Live');
  await focusChild(t);
}

/**
 * Fill the form in the EditStreamInfo window and click Go Live
 */
export async function tryToGoLive(t: TExecutionContext, prefillData?: Dictionary<string>) {
  await prepareToGoLive(t);
  await clickGoLive(t);
  await focusChild(t);
  if (prefillData) {
    await fillForm(t, 'form[name=editStreamForm]', prefillData);
  }
  await submit(t);
}

/**
 * Submit EditStreamInfo form in the child window
 */
export async function submit(t: TExecutionContext) {
  const app = t.context.app;
  await app.client.waitForEnabled('button=Confirm & Go Live', 10000);
  await click(t, 'button=Confirm & Go Live');
}

export async function waitForStreamStart(t: TExecutionContext) {
  // check we're streaming
  await focusMain(t);
  await t.context.app.client.waitForExist('button=End Stream', 20 * 1000);
}

/**
 * Click the "End Stream" button and wait until stream stops
 */
export async function stopStream(t: TExecutionContext) {
  await focusMain(t);
  await click(t, 'button=End Stream');
  await waitForStreamStop(t);
}

export async function waitForStreamStop(t: TExecutionContext) {
  await sleep(2000); // the stream often starts with delay so we have the "Go Live" button visible for a second even we clicked "Start Stream"
  const ms = 40 * 1000; // we may wait for a long time if the stream key is not valid
  await focusMain(t);
  try {
    await t.context.app.client.waitForExist('button=Go Live', ms);
  } catch (e) {
    throw new Error(`Stream did not stop in ${ms}ms`);
  }
}

/**
 * Schedule stream for platforms that supports scheduling
 */
export async function scheduleStream(
  t: TExecutionContext,
  date: number,
  channelInfo?: Dictionary<string>,
) {
  const app = t.context.app;
  await focusMain(t);
  await click(t, 'button .icon-date');
  await focusChild(t);
  await fillForm(t, null, {
    ...channelInfo,
    date: moment(date).format('MM/DD/YYYY'),
  });
  await click(t, 'button=Schedule');

  // the success message should be shown
  await app.client.waitForVisible('.toast-success', 20000);
}

export async function chatIsVisible(t: TExecutionContext) {
  await focusMain(t);
  return await t.context.app.client.isVisible('a=Refresh Chat'); // TODO: it's better to check the content of the chat browser-view
}
