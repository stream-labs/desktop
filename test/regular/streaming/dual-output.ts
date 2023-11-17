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
  selectElements,
  useMainWindow,
  waitForText,
} from '../../helpers/modules/core';
import { logIn } from '../../helpers/modules/user';
import { toggleDualOutputMode, toggleDisplay } from '../../helpers/modules/dual-output';
import { getApiClient } from '../../helpers/api-client';
import { releaseUserInPool, reserveUserFromPool } from '../../helpers/webdriver/user';
import { test, useWebdriver, TExecutionContext } from '../../helpers/webdriver';
import { SceneBuilder } from '../../helpers/scene-builder';

useWebdriver();

/**
 * Dual output video settings
 */
test('User must be logged in to use Dual Output', async (t: TExecutionContext) => {
  await toggleDualOutputMode(false);
  await focusChild();
  t.true(await isDisplayed('form#login-modal', { timeout: 1000 }));
});

test.skip('Dual output checkbox toggles Dual Output mode', async (t: TExecutionContext) => {
  await logIn();
  await toggleDualOutputMode();
  await focusMain();
  t.true(await isDisplayed('div#vertical-display'));

  await toggleDualOutputMode();
  await focusMain();
  t.false(await isDisplayed('div#vertical-display'));
});

/**
 * Dual output displays
 */
test.skip('Dual output elements show on toggle', async (t: TExecutionContext) => {
  await logIn();
  await toggleDualOutputMode();
  await focusMain();

  t.true(await isDisplayed('div#vertical-display'));
  t.true(await isDisplayed('div#dual-output-header'));
  t.true(await isDisplayed('i#horizontal-display-toggle'));
  t.true(await isDisplayed('i#vertical-display-toggle'));
});

test.skip('Dual output toggles', async (t: TExecutionContext) => {
  await logIn();
  await toggleDualOutputMode();
  await focusMain();

  // check permutations of toggling on and off the displays
  await clickIfDisplayed('i#horizontal-display-toggle');
  t.false(await isDisplayed('div#horizontal-display'));
  t.true(await isDisplayed('div#vertical-display'));

  await toggleDisplay('vertical', true);
  t.false(await isDisplayed('div#horizontal-display'));
  t.false(await isDisplayed('div#vertical-display'));

  await toggleDisplay('horizontal');
  t.true(await isDisplayed('div#horizontal-display'));
  t.false(await isDisplayed('div#vertical-display'));

  await toggleDisplay('vertical');
  t.true(await isDisplayed('div#horizontal-display'));
  t.true(await isDisplayed('div#vertical-display'));

  await toggleDisplay('vertical');
  t.true(await isDisplayed('div#horizontal-display'));
  t.false(await isDisplayed('div#vertical-display'));

  await toggleDisplay('horizontal');
  t.false(await isDisplayed('div#horizontal-display'));
  t.false(await isDisplayed('div#vertical-display'));

  await toggleDisplay('vertical');
  t.false(await isDisplayed('div#horizontal-display'));
  t.true(await isDisplayed('div#vertical-display'));

  await toggleDisplay('horizontal');
  t.true(await isDisplayed('div#horizontal-display'));
  t.true(await isDisplayed('div#vertical-display'));
});

test.skip('Dual output toggle tooltip text', async t => {
  // @@@ TODO hover selector working by tooltip still not showing
  await logIn();
  await toggleDualOutputMode();

  await useMainWindow(async () => {
    await focusMain();

    await isDisplayed('i#horizontal-display-toggle');
    await isDisplayed('i#horizontal-display-toggle');

    // check tooltip text changes on hover
    await hoverElement('i#horizontal-display-toggle', 50000);
    t.true(await isDisplayed('div#toggle-horizontal-tooltip'));
    t.true(await waitForText('Hide horizontal display'));
    await toggleDisplay('horizontal');
    await hoverElement('i#horizontal-display-toggle', 50000);
    t.true(await waitForText('Show horizontal display'));

    await hoverElement('i#vertical-display-toggle', 50000);
    t.true(await waitForText('Hide vertical display'));
    await toggleDisplay('vertical');
    await hoverElement('i#vertical-display-toggle', 50000);
    t.true(await waitForText('Show vertical display'));
  });
});

test.skip('Dual output display toggles filter scene items in source selector', async t => {
  // @@@ TODO scene items not auto duplicating when toggling

  /* This is not a perfectly precise assessment of whether the correct nodes are showing in the source selector.
   * The more precise check of the data is in the dual output api tests.
   */

  const client = await getApiClient();
  const sceneBuilder = new SceneBuilder(client);
  sceneBuilder.build(`
    Folder1
    Folder2
      Item1: image
      Item2: browser_source
    Folder3
      Item3:
   `);

  // the number of rows in the source selector should be constant when toggling displays or streaming modes
  const numSourceRows = (await selectElements('div[data-role="source"]')).length;

  await logIn();
  await toggleDualOutputMode();
  await focusMain();
  // const sceneBuilder = new SceneBuilder(client);
  // sceneBuilder.build(`
  //   Folder1
  //   Folder2
  //     Item1: image
  //     Item2: browser_source
  //   Folder3
  //     Item3:
  //  `);

  // const numSourceRows = (await selectElements('div[data-role="source"]')).length;
  await isDisplayed('i.horizontal-item', { timeout: 10000 });
  await isDisplayed('i.vertical-item', { timeout: 10000 });

  // in dual output mode with both displays on
  // show both horizontal and vertical scene items side by side
  t.true((await selectElements('div[data-role="source"]')).length === numSourceRows);
  t.true((await selectElements('i.horizontal-item')).length === numSourceRows);
  t.true((await selectElements('i.vertical-item')).length === numSourceRows);

  // in dual output mode with the horizontal display off
  // show only vertical scene items
  await toggleDisplay('horizontal');
  t.true((await selectElements('div[data-role="source"]')).length === numSourceRows);
  t.true((await selectElements('i.horizontal-item')).length === 0);
  t.true((await selectElements('i.vertical-item')).length === numSourceRows);

  // in dual output mode with both displays off
  // show both horizontal and vertical scene items side by side
  await toggleDisplay('vertical');
  t.true((await selectElements('div[data-role="source"]')).length === numSourceRows);
  t.true((await selectElements('i.horizontal-item')).length === numSourceRows);
  t.true((await selectElements('i.vertical-item')).length === numSourceRows);

  // in dual output mode with the vertical display off
  // only show horizontal scene items
  await toggleDisplay('horizontal');
  t.true((await selectElements('div[data-role="source"]')).length === numSourceRows);
  t.true((await selectElements('i.horizontal-item')).length === numSourceRows);
  t.true((await selectElements('i.vertical-item')).length === 0);

  // in single output mode, only show horizontal scene items
  await toggleDualOutputMode();
  t.true((await selectElements('div[data-role="source"]')).length === numSourceRows);
  t.true((await selectElements('i.horizontal-item')).length === 0);
  t.true((await selectElements('i.vertical-item')).length === 0);
});

test.skip('Dual output source toggles show/hide scene items in displays', async t => {
  // const client = await getApiClient();
  // const dualOutputService = client.getResource<DualOutputService>('DualOutputService');
  // const horizontalNodeIds = dualOutputService.views.horizontalNodeIds;
  // const verticalNodeIds = dualOutputService.views.verticalNodeIds;
  // await logIn();
  // await toggleDualOutputMode(t, true);
  // await focusMain();
  // data-role="source"
  // vertical-item
  // horizontal-item
});

// test('Dual output scene item toggles', async t => {});

// test('Dual output folder toggles', async t => {});

// test('Dual output nodes', async t => {});

/*
 * Dual Output Go Live Window
 * In-progress, skip for now
 */
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
