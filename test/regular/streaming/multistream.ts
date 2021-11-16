import {
  clickGoLive,
  prepareToGoLive,
  stopStream,
  submit,
  switchAdvancedMode,
  waitForSettingsWindowLoaded,
} from '../../helpers/modules/streaming';
import { fillForm, useForm } from '../../helpers/modules/forms';
import { click, clickButton, isDisplayed, waitForDisplayed } from '../../helpers/modules/core';
import { logIn } from '../../helpers/modules/user';
import { releaseUserInPool, reserveUserFromPool } from '../../helpers/spectron/user';
import { showSettingsWindow } from '../../helpers/modules/settings/settings';
import { test, useSpectron } from '../../helpers/spectron';

useSpectron({ pauseIfFailed: true });


test('Multistream default mode', async t => {
  // login to via Twitch because it doesn't have strict rate limits
  await logIn('twitch', { multistream: true });
  await prepareToGoLive();
  await clickGoLive();
  await waitForSettingsWindowLoaded();

  // enable all platforms
  await fillForm({
    twitch: true,
    facebook: true,
    youtube: true,
  });
  await waitForSettingsWindowLoaded();

  // add settings
  await fillForm({
    title: 'Test stream',
    description: 'Test stream description',
    twitchGame: 'Fortnite',
  });

  await submit();
  await waitForDisplayed('span=Configure the Multistream service');
  await waitForDisplayed("h1=You're live!", { timeout: 60000 });
  await stopStream();
  await t.pass();
});


test('Multistream advanced mode', async t => {
  // login to via Twitch because it doesn't have strict rate limits
  await logIn('twitch', { multistream: true });
  await prepareToGoLive();
  await clickGoLive();
  await waitForSettingsWindowLoaded();

  // enable all platforms
  await fillForm({
    twitch: true,
    facebook: true,
    youtube: true,
  });

  await switchAdvancedMode();
  await waitForSettingsWindowLoaded();

  const twitchForm = useForm('twitch-settings');
  await twitchForm.fillForm({
    customEnabled: true,
    title: 'twitch title',
    twitchGame: 'Fortnite',
    twitchTags: ['100%'],
  });

  const youtubeForm = useForm('youtube-settings');
  await youtubeForm.fillForm({
    customEnabled: true,
    title: 'youtube title',
    description: 'youtube description',
  });

  const facebookForm = useForm('facebook-settings');
  await facebookForm.fillForm({
    customEnabled: true,
    facebookGame: 'Doom',
    title: 'facebook title',
    description: 'facebook description',
  });

  await submit();
  await waitForDisplayed('span=Configure the Multistream service');
  await waitForDisplayed("h1=You're live!", { timeout: 60000 });
  await stopStream();
  await t.pass();
});

test('Custom stream destinations', async t => {
  await logIn('twitch', { prime: true });

  // fetch a new stream key
  const user = await reserveUserFromPool(t, 'twitch');

  // add new destination
  await showSettingsWindow('Stream');
  await click('span=Add Destination');

  const { fillForm } = useForm();
  await fillForm({
    name: 'MyCustomDest',
    url: 'rtmp://live.twitch.tv/app/',
    streamKey: user.streamKey,
  });
  await clickButton('Save');
  t.true(await isDisplayed('span=MyCustomDest'), 'New destination should be created');

  // update destinations
  await click('i.fa-pen');
  await fillForm({
    name: 'MyCustomDestUpdated',
  });
  await clickButton('Save');

  t.true(await isDisplayed('span=MyCustomDestUpdated'), 'Destination should be updated');

  // add one more destination
  await click('span=Add Destination');
  await fillForm({
    name: 'MyCustomDest',
    url: 'rtmp://live.twitch.tv/app/',
    streamKey: user.streamKey,
  });
  await clickButton('Save');

  await t.false(await isDisplayed('span=Add Destination'), 'Do not allow more than 2 custom dest');

  // open the GoLiveWindow and check destinations
  await prepareToGoLive();
  await clickGoLive();
  await waitForSettingsWindowLoaded();
  await t.true(await isDisplayed('span=MyCustomDest'), 'Destination is available');
  await click('span=MyCustomDest'); // switch the destination on

  // try to stream
  await submit();
  await waitForDisplayed('span=Configure the Multistream service');
  await waitForDisplayed("h1=You're live!", { timeout: 60000 });
  await stopStream();
  await releaseUserInPool(user);

  // delete existing destinations
  await showSettingsWindow('Stream');
  await click('i.fa-trash');
  await click('i.fa-trash');
  t.false(await isDisplayed('i.fa-trash'), 'Destinations should be removed');
});
