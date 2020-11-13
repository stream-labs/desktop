import {
  useSpectron,
  focusMain,
  focusChild,
  test,
  skipCheckingErrorsInLog,
  restartApp,
  click,
} from '../../helpers/spectron';
import { setFormInput } from '../../helpers/spectron/forms';
import { fillForm, formIncludes, FormMonkey, selectTitle } from '../../helpers/form-monkey';
import { logIn, logOut, releaseUserInPool, reserveUserFromPool } from '../../helpers/spectron/user';
import { setTemporaryRecordingPath } from '../../helpers/spectron/output';
const moment = require('moment');
import { fetchMock, resetFetchMock } from '../../helpers/spectron/network';
import {
  goLive,
  clickGoLive,
  prepareToGoLive,
  scheduleStream,
  submit,
  waitForStreamStart,
  stopStream,
  tryToGoLive,
  chatIsVisible,
  waitForStreamStop,
  updateChannelSettings,
} from '../../helpers/spectron/streaming';
import { TPlatform } from '../../../app/services/platforms';
import { readdir } from 'fs-extra';
import { showSettings } from '../../helpers/spectron/settings';
import { sleep } from '../../helpers/sleep';
import { getClient } from '../../helpers/api-client';
import { StreamSettingsService } from '../../../app/services/settings/streaming';

useSpectron();

test('Stream after switching accounts', async t => {
  // stream to youtube
  await logIn(t, 'youtube');
  await goLive(t, {
    title: 'SLOBS Test Stream',
    description: 'SLOBS Test Stream Description',
  });
  await stopStream(t);

  // stream to twitch
  await logOut(t);
  await logIn(t, 'twitch');
  await goLive(t, {
    title: 'SLOBS Test Stream',
    twitchGame: selectTitle("PLAYERUNKNOWN'S BATTLEGROUNDS"),
  });

  t.pass();
});

test('Stream with disabled confirmation', async t => {
  await logIn(t, 'twitch');
  await showSettings(t, 'General');
  await fillForm(t, null, { stream_info_udpate: false });
  await prepareToGoLive(t);
  await clickGoLive(t);
  await waitForStreamStart(t);

  // try to stream after restart
  await restartApp(t);
  await prepareToGoLive(t);
  await clickGoLive(t);
  await waitForStreamStart(t);
  await stopStream(t);
  await logOut(t);

  // check that stream_info_udpate can not be applied to YT
  await logIn(t, 'youtube');
  await clickGoLive(t);
  await focusChild(t);
  t.true(
    await t.context.app.client.isVisible('button=Confirm & Go Live'),
    'Should not be able to disable GoLive window for YT',
  );

  t.pass();
});

test('Go live error', async t => {
  // login into the account
  await logIn(t, 'twitch');
  const app = t.context.app;

  await prepareToGoLive(t);

  // simulate issues with the twitch api
  await fetchMock(t, /api\.twitch\.tv/, 404);
  skipCheckingErrorsInLog();

  // open EditStreamInfo window
  await focusMain(t);
  await app.client.click('button=Go Live');
  await focusChild(t);

  // check that the error text is shown
  await app.client.waitForVisible('a=just go live');

  // stop simulating network issues and retry fetching the channelInfo
  await resetFetchMock(t);
  await focusChild(t);
  await app.client.click('a=fetching the information again');
  await app.client.waitForEnabled('button=Confirm & Go Live');

  // test the case when the channel info has been successful fetched but can't be updated
  await fetchMock(t, /api\.twitch\.tv/, 404);
  await focusChild(t);
  await click(t, 'button=Confirm & Go Live');
  await app.client.waitForVisible('a=just go live');

  t.pass();
});

test('User has linked twitter', async t => {
  await logIn(t, 'twitch', { hasLinkedTwitter: true, notStreamable: true });
  await prepareToGoLive(t);
  await clickGoLive(t);

  await t.context.app.client.waitForVisible('button=Unlink Twitter', 10000);
  t.true(
    await t.context.app.client.isExisting('button=Unlink Twitter'),
    'The button for unlinking Twitter should exist',
  );
});

test('Recording when streaming', async t => {
  await logIn(t);
  const app = t.context.app;

  // enable RecordWhenStreaming
  await showSettings(t, 'General');
  await fillForm(t, null, { RecordWhenStreaming: true });
  const tmpDir = await setTemporaryRecordingPath(t);

  await goLive(t, {
    title: 'SLOBS Test Stream',
    twitchGame: selectTitle("PLAYERUNKNOWN'S BATTLEGROUNDS"),
  });

  // Stop recording
  await app.client.click('.record-button');
  await app.client.waitForVisible('.record-button:not(.active)', 15000);

  // check that recording has been created
  const files = await readdir(tmpDir);
  t.true(files.length === 1, 'Should be one recoded file');
});

test('Streaming to Dlive', async t => {
  // click Log-in
  await click(t, '.icon-settings');
  await focusChild(t);
  await click(t, '.fa-sign-in-alt');
  await focusMain(t);

  // select DLive from the "use another platform list"
  await fillForm(t, null, { otherPlatform: 'dlive' });

  // provide  a fake stream key
  await fillForm(t, null, { key: 'fake key' });

  // click finish and check settings
  await click(t, 'button=Finish');
  await showSettings(t, 'Stream');

  t.true(
    await formIncludes(t, { key: 'fake key', server: 'rtmp://stream.dlive.tv/live' }),
    'Settings for Dlive should be visible in the Settings->Stream window',
  );

  // TODO: we probably want to start streaming with a real streamkey
});

test('Update channel settings before streaming', async t => {
  await logIn(t, 'twitch');
  await updateChannelSettings(t, { title: 'updated title' });
  t.pass();
});
