import {
  clickGoLive,
  prepareToGoLive,
  waitForSettingsWindowLoaded,
} from '../../helpers/modules/streaming';
import {
  click,
  clickIfDisplayed,
  focusChild,
  focusMain,
  hoverElement,
  isDisplayed,
  useMainWindow,
  waitForText,
} from '../../helpers/modules/core';
import { logIn } from '../../helpers/modules/user';
import { releaseUserInPool, reserveUserFromPool } from '../../helpers/webdriver/user';
import { toggleDualOutputMode } from '../../helpers/modules/settings/settings';
import { test, useWebdriver, TExecutionContext } from '../../helpers/webdriver';

useWebdriver();

// Dual Output Go Live Window
// In-progress, skip for now

/**
 * Dual output video settings
 */
test('User must be logged in to use Dual Output', async (t: TExecutionContext) => {
  await toggleDualOutputMode(t);
  await focusChild();
  t.true(await isDisplayed('form#login-modal', { timeout: 1000 }));
});

test('Dual output checkbox toggles Dual Output mode', async (t: TExecutionContext) => {
  await logIn();
  await toggleDualOutputMode(t, true);
  await focusMain();
  // @@@ TODO check for property, not element
  t.true(await isDisplayed('div#vertical-display'));

  await toggleDualOutputMode(t, false);
  t.false(await isDisplayed('div#vertical-display'));
});

/**
 * Dual output displays
 */
test('Dual output elements show on toggle', async (t: TExecutionContext) => {
  await logIn();
  await toggleDualOutputMode(t, true);
  await focusMain();

  t.true(await isDisplayed('div#vertical-display'));
  t.true(await isDisplayed('div#dual-output-header'));
  t.true(await isDisplayed('i#horizontal-display-toggle'));
  t.true(await isDisplayed('i#vertical-display-toggle'));
});

test('Dual output toggles', async (t: TExecutionContext) => {
  await logIn();
  await toggleDualOutputMode(t, true);
  await focusMain();

  // check permutations of toggling on and off the displays
  await clickIfDisplayed('i#horizontal-display-toggle');
  t.false(await isDisplayed('div#horizontal-display'));
  t.true(await isDisplayed('div#vertical-display'));

  await clickIfDisplayed('i#vertical-display-toggle');
  t.false(await isDisplayed('div#horizontal-display'));
  t.false(await isDisplayed('div#vertical-display'));

  await click('i#horizontal-display-toggle');
  t.true(await isDisplayed('div#horizontal-display'));
  t.false(await isDisplayed('div#vertical-display'));

  await click('i#vertical-display-toggle');
  t.true(await isDisplayed('div#horizontal-display'));
  t.true(await isDisplayed('div#vertical-display'));

  await click('i#vertical-display-toggle');
  t.true(await isDisplayed('div#horizontal-display'));
  t.false(await isDisplayed('div#vertical-display'));

  await click('i#horizontal-display-toggle');
  t.false(await isDisplayed('div#horizontal-display'));
  t.false(await isDisplayed('div#vertical-display'));

  await click('i#vertical-display-toggle');
  t.false(await isDisplayed('div#horizontal-display'));
  t.true(await isDisplayed('div#vertical-display'));

  await click('i#horizontal-display-toggle');
  t.true(await isDisplayed('div#horizontal-display'));
  t.true(await isDisplayed('div#vertical-display'));
});

test.skip('Dual output toggle tooltip text', async t => {
  // @@@ TODO hover selector working by tooltip still not showing
  await logIn();
  await toggleDualOutputMode(t, true);

  await useMainWindow(async () => {
    await focusMain();

    await isDisplayed('i#horizontal-display-toggle');
    await isDisplayed('i#horizontal-display-toggle');

    // check tooltip text changes on hover
    await hoverElement('i#horizontal-display-toggle', 50000);
    t.true(await isDisplayed('div#toggle-horizontal-tooltip'));
    t.true(await waitForText('Hide horizontal display'));
    await click('i#horizontal-display-toggle');
    await hoverElement('i#horizontal-display-toggle', 50000);
    t.true(await waitForText('Show horizontal display'));

    await hoverElement('i#vertical-display-toggle', 50000);
    t.true(await waitForText('Hide vertical display'));
    await click('i#vertical-display-toggle');
    await hoverElement('i#vertical-display-toggle', 50000);
    t.true(await waitForText('Show vertical display'));
  });
});

// test('Dual output display toggles show/hide scene items in source selector', async t => {});

// test('Dual output scene item toggles', async t => {});

// test('Dual output folder toggles', async t => {});

// test('Dual output nodes', async t => {});

test.skip('Dual Output Go Live Window', async t => {
  await logIn('twitch');
  await logIn('trovo');
  await logIn('youtube');

  //
  await prepareToGoLive();
  await clickGoLive();
  await waitForSettingsWindowLoaded();
});

// test('Multistream default mode', async t => {
//   // login to via Twitch because it doesn't have strict rate limits
//   await logIn('twitch', { multistream: true });
//   await prepareToGoLive();
//   await clickGoLive();
//   await waitForSettingsWindowLoaded();

//   // enable all platforms
//   await fillForm({
//     twitch: true,
//     youtube: true,
//     trovo: true,
//   });
//   await waitForSettingsWindowLoaded();

//   // add settings
//   await fillForm({
//     title: 'Test stream',
//     description: 'Test stream description',
//     twitchGame: 'Fortnite',
//   });

//   await submit();
//   await waitForDisplayed('span=Configure the Multistream service');
//   await waitForDisplayed("h1=You're live!", { timeout: 60000 });
//   await stopStream();
//   await t.pass();
// });

// test('Multistream advanced mode', async t => {
//   // login to via Twitch because it doesn't have strict rate limits
//   await logIn('twitch', { multistream: true });
//   await prepareToGoLive();
//   await clickGoLive();
//   await waitForSettingsWindowLoaded();

//   // enable all platforms
//   await fillForm({
//     twitch: true,
//     youtube: true,
//     trovo: true,
//   });

//   await switchAdvancedMode();
//   await waitForSettingsWindowLoaded();

//   const twitchForm = useForm('twitch-settings');
//   await twitchForm.fillForm({
//     customEnabled: true,
//     title: 'twitch title',
//     twitchGame: 'Fortnite',
//     // TODO: Re-enable after reauthing userpool
//     // twitchTags: ['100%'],
//   });

//   const youtubeForm = useForm('youtube-settings');
//   await youtubeForm.fillForm({
//     customEnabled: true,
//     title: 'youtube title',
//     description: 'youtube description',
//   });

//   const trovoForm = useForm('trovo-settings');
//   await trovoForm.fillForm({
//     customEnabled: true,
//     trovoGame: 'Doom',
//     title: 'trovo title',
//   });

//   await submit();
//   await waitForDisplayed('span=Configure the Multistream service');
//   await waitForDisplayed("h1=You're live!", { timeout: 60000 });
//   await stopStream();
//   await t.pass();
// });

// test('Custom stream destinations', async t => {
//   await logIn('twitch', { prime: true });

//   // fetch a new stream key
//   const user = await reserveUserFromPool(t, 'twitch');

//   // add new destination
//   await showSettingsWindow('Stream');
//   await click('span=Add Destination');

//   const { fillForm } = useForm();
//   await fillForm({
//     name: 'MyCustomDest',
//     url: 'rtmp://live.twitch.tv/app/',
//     streamKey: user.streamKey,
//   });
//   await clickButton('Save');
//   t.true(await isDisplayed('span=MyCustomDest'), 'New destination should be created');

//   // update destinations
//   await click('i.fa-pen');
//   await fillForm({
//     name: 'MyCustomDestUpdated',
//   });
//   await clickButton('Save');

//   t.true(await isDisplayed('span=MyCustomDestUpdated'), 'Destination should be updated');

//   // add one more destination
//   await click('span=Add Destination');
//   await fillForm({
//     name: 'MyCustomDest',
//     url: 'rtmp://live.twitch.tv/app/',
//     streamKey: user.streamKey,
//   });
//   await clickButton('Save');

//   await t.false(await isDisplayed('span=Add Destination'), 'Do not allow more than 2 custom dest');

//   // open the GoLiveWindow and check destinations
//   await prepareToGoLive();
//   await clickGoLive();
//   await waitForSettingsWindowLoaded();
//   await t.true(await isDisplayed('span=MyCustomDest'), 'Destination is available');
//   await click('span=MyCustomDest'); // switch the destination on

//   // try to stream
//   await submit();
//   await waitForDisplayed('span=Configure the Multistream service');
//   await waitForDisplayed("h1=You're live!", { timeout: 60000 });
//   await stopStream();
//   await releaseUserInPool(user);

//   // delete existing destinations
//   await showSettingsWindow('Stream');
//   await click('i.fa-trash');
//   await click('i.fa-trash');
//   t.false(await isDisplayed('i.fa-trash'), 'Destinations should be removed');
// });
