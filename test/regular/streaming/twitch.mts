import {
  chatIsVisible,
  clickGoLive,
  goLive,
  prepareToGoLive,
  stopStream,
  submit,
  tryToGoLive,
  waitForSettingsWindowLoaded,
  waitForStreamStart,
  waitForStreamStop,
} from '../../helpers/modules/streaming.mjs';
import { showSettingsWindow } from '../../helpers/modules/settings/settings.mjs';
import {
  clickButton,
  focusChild,
  isDisplayed,
  waitForDisplayed,
} from '../../helpers/modules/core.mjs';
import { restartApp, test, useWebdriver } from '../../helpers/webdriver/index.mjs';
import { reserveUserFromPool } from '../../helpers/webdriver/user.mjs';
import { getApiClient } from '../../helpers/api-client.js';
import { StreamSettingsService } from '../../../app/services/settings/streaming/index.js';
import { assertFormContains, fillForm } from '../../helpers/modules/forms/index.mjs';
import { logIn } from '../../helpers/modules/user.mjs';

useWebdriver();

test('Streaming to Twitch', async t => {
  await logIn('twitch', { multistream: false });
  await goLive({
    title: 'SLOBS Test Stream',
    twitchGame: 'Warcraft III',
  });
  t.true(await chatIsVisible(), 'Chat should be visible');

  // check we can't change stream setting while live
  await showSettingsWindow('Stream');
  await waitForDisplayed("div=You can not change these settings when you're live");
  await stopStream();
  t.pass();
});

test('Streaming to Twitch without auth', async t => {
  const userInfo = await reserveUserFromPool(t, 'twitch');

  // type a new stream key in the Stream Settings Window
  await showSettingsWindow('Stream');
  const key = userInfo.streamKey;
  await fillForm({ key });
  await clickButton('Done');

  // go live
  await prepareToGoLive();
  await clickGoLive();
  await waitForStreamStart();
  await stopStream();
  t.pass();
});

test('Migrate the twitch account to the protected mode', async t => {
  await logIn('twitch');

  // change stream key before go live
  const streamSettings = (await getApiClient()).getResource<StreamSettingsService>(
    'StreamSettingsService',
  );
  streamSettings.setSettings({ key: 'fake key', protectedModeMigrationRequired: true });

  await restartApp(t); // restarting the app should call migration again

  // go live
  await tryToGoLive({
    title: 'SLOBS Test Stream',
    twitchGame: 'Fortnite',
  });
  await waitForStreamStop(); // can't go live with a fake key

  // check that settings have been switched to the Custom Ingest mode
  await showSettingsWindow('Stream');
  t.true(await isDisplayed('button=Use recommended settings'), 'Protected mode should be disabled');

  // use recommended settings
  await clickButton('Use recommended settings');
  // setup custom server
  streamSettings.setSettings({
    server: 'rtmp://live-sjc.twitch.tv/app',
    protectedModeMigrationRequired: true,
  });

  await restartApp(t); // restarting the app should call migration again
  await tryToGoLive({
    title: 'SLOBS Test Stream',
    twitchGame: 'Fortnite',
  });
  await waitForStreamStop();

  // check that settings have been switched to the Custom Ingest mode
  await showSettingsWindow('Stream');
  t.true(await isDisplayed('button=Use recommended settings'), 'Protected mode should be disabled');
});

// TODO: Re-enable after reauthing userpool
test.skip('Twitch Tags', async t => {
  await logIn('twitch');
  await focusChild();

  await prepareToGoLive();
  await clickGoLive();
  await waitForSettingsWindowLoaded();

  // Add a couple of tags
  await fillForm({
    twitchTags: ['100%', 'AMA'],
  });

  // Start and stop the stream
  await submit();
  await waitForStreamStart();
  await stopStream();

  // Go to Edit Stream Info to assert tags have persisted on Twitch
  await clickGoLive();
  await waitForSettingsWindowLoaded();
  await assertFormContains({
    twitchTags: ['100%', 'AMA'],
  });

  t.pass();
});

test('Streaming to Twitch unlisted category', async t => {
  await logIn('twitch');
  await goLive({
    title: 'SLOBS Test unlisted Stream',
    twitchGame: 'Unlisted',
  });
  t.pass();
});
