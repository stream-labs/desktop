import { restartApp, test, useSpectron } from '../../helpers/spectron';
import { logIn, reserveUserFromPool } from '../../helpers/spectron/user';
import { showSettings } from '../../helpers/spectron/settings';
import { setFormInput } from '../../helpers/spectron/forms';
import {
  chatIsVisible,
  clickGoLive,
  goLive,
  prepareToGoLive, stopStream,
  tryToGoLive,
  waitForStreamStart,
  waitForStreamStop
} from '../../helpers/spectron/streaming';
import { selectTitle } from '../../helpers/form-monkey';
import { getClient } from '../../helpers/api-client';
import { StreamSettingsService } from '../../../app/services/settings/streaming';

useSpectron();

test('Streaming to Twitch without auth', async t => {
  const userInfo = await reserveUserFromPool(t, 'twitch');

  await showSettings(t, 'Stream');

  // This is the twitch.tv/slobstest stream key
  await setFormInput(t, 'Stream key', userInfo.streamKey);
  await (await t.context.app.client.$('button=Done')).click();

  // go live
  await prepareToGoLive(t);
  await clickGoLive(t);
  await waitForStreamStart(t);
  await stopStream(t);
  t.pass();
});

test('Streaming to Twitch', async t => {
  await logIn(t, 'twitch');
  await goLive(t, {
    title: 'SLOBS Test Stream',
    twitchGame: selectTitle("PLAYERUNKNOWN'S BATTLEGROUNDS"),
  });
  t.true(await chatIsVisible(t), 'Chat should be visible');

  // check we can't change stream setting while live
  await showSettings(t, 'Stream');
  await t.true(
    await (
      await t.context.app.client.$("div=You can not change these settings when you're live")
    ).isExisting(),
    'Stream settings should be not visible',
  );
  await stopStream(t);
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
    twitchGame: selectTitle("PLAYERUNKNOWN'S BATTLEGROUNDS"),
  });
  await waitForStreamStop(t); // can't go live with a fake key

  // check that settings have been switched to the Custom Ingest mode
  await showSettings(t, 'Stream');
  t.true(
    await (await t.context.app.client.$('button=Use recommended settings')).isDisplayed(),
    'Protected mode should be disabled',
  );

  // use recommended settings
  await (await t.context.app.client.$('button=Use recommended settings')).click();
  // setup custom server
  streamSettings.setSettings({
    server: 'rtmp://live-sjc.twitch.tv/app',
    protectedModeMigrationRequired: true,
  });

  await restartApp(t); // restarting the app should call migration again
  await tryToGoLive(t, {
    title: 'SLOBS Test Stream',
    twitchGame: selectTitle("PLAYERUNKNOWN'S BATTLEGROUNDS"),
  });
  await waitForStreamStop(t);

  // check that settings have been switched to the Custom Ingest mode
  await showSettings(t, 'Stream');
  t.true(
    await (await t.context.app.client.$('button=Use recommended settings')).isDisplayed(),
    'Protected mode should be disabled',
  );
});
