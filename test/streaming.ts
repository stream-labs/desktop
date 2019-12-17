import {
  useSpectron,
  focusMain,
  focusChild,
  test,
  skipCheckingErrorsInLog,
  restartApp,
  closeWindow,
  click,
} from './helpers/spectron/index';
import { setFormInput } from './helpers/spectron/forms';
import { fillForm, formIncludes, FormMonkey } from './helpers/form-monkey';
import { logIn, logOut } from './helpers/spectron/user';
import { setTemporaryRecordingPath } from './helpers/spectron/output';
const moment = require('moment');
import { fetchMock, resetFetchMock } from './helpers/spectron/network';
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
} from './helpers/spectron/streaming';
import { TPlatform } from '../app/services/platforms';
import { readdir } from 'fs-extra';
import { showSettings } from './helpers/spectron/settings';
import { sleep } from './helpers/sleep';
import { getClient } from './helpers/api-client';
import { StreamSettingsService } from '../app/services/settings/streaming';

useSpectron();

// TODO obtain a valid streamkey in CI
test.skip('Streaming to Twitch without auth', async t => {
  if (!process.env.SLOBS_TEST_STREAM_KEY) {
    console.warn('SLOBS_TEST_STREAM_KEY not found!  Skipping streaming test.');
    t.pass();
    return;
  }

  await showSettings(t, 'Stream');

  // This is the twitch.tv/slobstest stream key
  await setFormInput(t, 'Stream key', process.env.SLOBS_TEST_STREAM_KEY);
  await t.context.app.client.click('button=Done');

  // go live
  await prepareToGoLive(t);
  await clickGoLive(t);
  await waitForStreamStart(t);
  t.pass();
});

test('Streaming to Twitch', async t => {
  await logIn(t, 'twitch');
  await goLive(t, {
    title: 'SLOBS Test Stream',
    game: "PLAYERUNKNOWN'S BATTLEGROUNDS",
  });
  t.true(await chatIsVisible(t), 'Chat should be visible');

  // check we can't change stream setting while live
  await showSettings(t, 'Stream');
  await t.true(
    await t.context.app.client.isExisting("div=You can not change these settings when you're live"),
  );
  t.pass();
});

test('Streaming to Facebook', async t => {
  await logIn(t, 'facebook');
  await goLive(t, {
    title: 'SLOBS Test Stream',
    game: "PLAYERUNKNOWN'S BATTLEGROUNDS",
    description: 'SLOBS Test Stream Description',
  });
  t.true(await chatIsVisible(t), 'Chat should be visible');
  t.pass();
});

// TODO: Mixer stopped returning a stream key for testing accounts
test.skip('Streaming to Mixer', async t => {
  await logIn(t, 'mixer');
  await goLive(t, {
    title: 'SLOBS Test Stream',
    game: "PLAYERUNKNOWN'S BATTLEGROUNDS",
  });
  t.true(await chatIsVisible(t), 'Chat should be visible');
  t.pass();
});

test('Streaming to Youtube', async t => {
  await logIn(t, 'youtube');

  t.false(await chatIsVisible(t), 'Chat is not visible for YT before stream starts');

  await goLive(t, {
    title: 'SLOBS Test Stream',
    description: 'SLOBS Test Stream Description',
  });

  t.true(await chatIsVisible(t), 'Chat should be visible');

  // give youtube 2 min to publish stream
  await focusChild(t);
  await t.context.app.client.waitForVisible("p=You're live!", 2 * 60 * 1000);

  t.pass();
});

test('Youtube should show error window if afterStreamStart hook fails', async t => {
  await logIn(t, 'youtube');

  await goLive(t, {
    title: 'SLOBS Test Stream',
    description: 'SLOBS Test Stream Description',
  });
  await focusChild(t);
  await closeWindow(t);

  // emulate API errors
  skipCheckingErrorsInLog();
  await fetchMock(t, /www\.googleapis\.com\/youtube/, 404);

  // the error window should be shown right after request to YT API fails
  await sleep(2000); // TODO: wait for the child window to be shown instead sleep
  await focusChild(t);
  await t.context.app.client.waitForVisible('h1=Something went wrong');

  t.pass();
});

test('Streaming to the scheduled event on Youtube', async t => {
  await logIn(t, 'youtube');

  // create event via scheduling form
  const tomorrow = Date.now() + 1000 * 60 * 60 * 24;
  await scheduleStream(t, tomorrow, {
    title: `Youtube Test Stream ${tomorrow}`,
    description: 'SLOBS Test Stream Description',
  });

  // select event and go live
  await prepareToGoLive(t);
  await clickGoLive(t);
  const form = new FormMonkey(t);
  await form.fill({
    event: await form.getOptionByTitle('event', new RegExp(`Youtube Test Stream ${tomorrow}`)),
  });
  await submit(t);
  await waitForStreamStart(t);
  t.pass();
});

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
    game: "PLAYERUNKNOWN'S BATTLEGROUNDS",
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

test('Migrate the twitch account to the protected mode', async t => {
  await logIn(t, 'twitch');

  // change stream key before go live
  const streamSettings = (await getClient()).getResource<StreamSettingsService>(
    'StreamSettingsService',
  );
  streamSettings.setSettings({ key: 'fake key', protectedModeMigrationRequired: true });

  await restartApp(t); // restarting the app should call migration again

  // go live
  await tryToGoLive(t, {
    title: 'SLOBS Test Stream',
    game: "PLAYERUNKNOWN'S BATTLEGROUNDS",
  });
  await waitForStreamStop(t); // can't go live with a fake key

  // check that settings have been switched to the Custom Ingest mode
  await showSettings(t, 'Stream');
  t.true(
    await t.context.app.client.isVisible('button=Use recommended settings'),
    'Protected mode should be disabled',
  );

  // use recommended settings
  await t.context.app.client.click('button=Use recommended settings');
  // setup custom server
  streamSettings.setSettings({
    server: 'rtmp://live-sjc.twitch.tv/app',
    protectedModeMigrationRequired: true,
  });

  await restartApp(t); // restarting the app should call migration again
  await tryToGoLive(t, {
    title: 'SLOBS Test Stream',
    game: "PLAYERUNKNOWN'S BATTLEGROUNDS",
  });
  await waitForStreamStop(t);

  // check that settings have been switched to the Custom Ingest mode
  await showSettings(t, 'Stream');
  t.true(
    await t.context.app.client.isVisible('button=Use recommended settings'),
    'Protected mode should be disabled',
  );
});

// test scheduling for each platform
const schedulingPlatforms = ['facebook', 'youtube'];
schedulingPlatforms.forEach(platform => {
  test(`Schedule stream to ${platform}`, async t => {
    // login into the account
    await logIn(t, platform as TPlatform);
    const app = t.context.app;

    // open EditStreamInfo window
    await focusMain(t);
    await app.client.click('button .icon-date');
    await focusChild(t);

    const formMonkey = new FormMonkey(t, 'form[name=editStreamForm]');

    // fill streaming data
    switch (platform) {
      case 'facebook':
        await formMonkey.fill({
          title: 'SLOBS Test Stream',
          description: 'SLOBS Test Stream Description',
        });
        break;

      case 'youtube':
        await formMonkey.fill({
          title: 'SLOBS Test Stream',
          description: 'SLOBS Test Stream Description',
        });
        break;
    }

    await app.client.click('button=Schedule');

    // need to provide a date
    t.true(await app.client.isExisting('div=The field is required'));

    // set the date to tomorrow
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    await formMonkey.fill({
      date: moment(tomorrow).format('MM/DD/YYYY'),
    });

    await app.client.click('button=Schedule');

    // facebook requires a game
    if (platform === 'facebook') {
      t.true(await app.client.waitForVisible('.toast-alert', 2000));

      await formMonkey.fill({
        game: "PLAYERUNKNOWN'S BATTLEGROUNDS",
      });

      await app.client.click('button=Schedule');
    }

    await app.client.waitForVisible('.toast-success', 20000);
  });
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
  await app.client.click('button=Go Live');
  await focusChild(t);

  // check that the error text is shown
  await app.client.waitForVisible('a=just go live.');

  // stop simulating network issues and retry fetching the channelInfo
  await resetFetchMock(t);
  await focusChild(t);
  await app.client.click('a=fetching the information again');
  await app.client.waitForVisible('button=Confirm & Go Live');

  // test the case when the channel info has been successful fetched but can't be updated
  await fetchMock(t, /api\.twitch\.tv/, 404);
  await focusChild(t);
  await click(t, 'button=Confirm & Go Live');
  await app.client.waitForVisible('a=just go live.');

  t.pass();
});

test('Youtube streaming is disabled', async t => {
  skipCheckingErrorsInLog();
  await logIn(t, 'youtube', { streamingIsDisabled: true });
  t.true(
    await t.context.app.client.isExisting('span=YouTube account not enabled for live streaming'),
    'The streaming-disabled message should be visible',
  );
});

test('User does not have Facebook pages', async t => {
  skipCheckingErrorsInLog();
  await logIn(t, 'facebook', { noFacebookPages: true });
  await prepareToGoLive(t);
  await clickGoLive(t);
  await focusChild(t);
  t.true(
    await t.context.app.client.isExisting('a=Create Page'),
    'The link for adding new facebook changes should exist',
  );
});

test('User has linked twitter', async t => {
  await logIn(t, 'twitch', { hasLinkedTwitter: true });
  await prepareToGoLive(t);
  await clickGoLive(t);

  // check the "Unlink" button
  await t.context.app.client.waitForVisible('button=Unlink Twitter');
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
    game: "PLAYERUNKNOWN'S BATTLEGROUNDS",
  });

  // Stop recording
  await app.client.click('.record-button');
  await app.client.waitForVisible('.record-button:not(.active)', 60000);

  // check that recording has been created
  const files = await readdir(tmpDir);
  t.true(files.length === 1, 'Should be one recoded file');
});

test('Streaming to Dlive', async t => {
  // click Log-in
  await click(t, '.fa-sign-in-alt');

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
