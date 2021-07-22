import { chatIsVisible, goLive, stopStream } from '../../helpers/modules/streaming';
import { showSettingsWindow } from '../../helpers/modules/settings/settings';
import { waitForDisplayed } from '../../helpers/modules/core';
import { logIn } from '../../helpers/modules/user';
import { test, useSpectron } from '../../helpers/spectron';

useSpectron();

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
//
// test('Streaming to Twitch without auth', async t => {
//   const userInfo = await reserveUserFromPool(t, 'twitch');
//
//   await showSettings(t, 'Stream');
//
//   // This is the twitch.tv/slobstest stream key
//   await setFormInput(t, 'Stream key', userInfo.streamKey);
//   await (await t.context.app.client.$('button=Done')).click();
//
//   // go live
//   await prepareToGoLive(t);
//   await clickGoLive(t);
//   await waitForStreamStart(t);
//   await stopStream(t);
//   t.pass();
// });
//
//
//
// test('Migrate the twitch account to the protected mode', async t => {
//   await logIn(t, 'twitch');
//
//   // change stream key before go live
//   const streamSettings = (await getClient()).getResource<StreamSettingsService>(
//     'StreamSettingsService',
//   );
//   streamSettings.setSettings({ key: 'fake key', protectedModeMigrationRequired: true });
//
//   await restartApp(t); // restarting the app should call migration again
//
//   // go live
//   await tryToGoLive(t, {
//     title: 'SLOBS Test Stream',
//     twitchGame: selectTitle("PLAYERUNKNOWN'S BATTLEGROUNDS"),
//   });
//   await waitForStreamStop(t); // can't go live with a fake key
//
//   // check that settings have been switched to the Custom Ingest mode
//   await showSettings(t, 'Stream');
//   t.true(
//     await (await t.context.app.client.$('button=Use recommended settings')).isDisplayed(),
//     'Protected mode should be disabled',
//   );
//
//   // use recommended settings
//   await (await t.context.app.client.$('button=Use recommended settings')).click();
//   // setup custom server
//   streamSettings.setSettings({
//     server: 'rtmp://live-sjc.twitch.tv/app',
//     protectedModeMigrationRequired: true,
//   });
//
//   await restartApp(t); // restarting the app should call migration again
//   await tryToGoLive(t, {
//     title: 'SLOBS Test Stream',
//     twitchGame: selectTitle("PLAYERUNKNOWN'S BATTLEGROUNDS"),
//   });
//   await waitForStreamStop(t);
//
//   // check that settings have been switched to the Custom Ingest mode
//   await showSettings(t, 'Stream');
//   t.true(
//     await (await t.context.app.client.$('button=Use recommended settings')).isDisplayed(),
//     'Protected mode should be disabled',
//   );
// });
