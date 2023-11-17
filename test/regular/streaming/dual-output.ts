import {
  clickGoLive,
  prepareToGoLive,
  waitForSettingsWindowLoaded,
} from '../../helpers/modules/streaming';
import {
  clickIfDisplayed,
  focusChild,
  focusMain,
  isDisplayed,
  selectElements,
} from '../../helpers/modules/core';
import { logIn } from '../../helpers/modules/user';
import {
  toggleDualOutputMode,
  toggleDisplay,
  confirmSelectorNodesDisplay,
  confirmHasDisplaysAssigned,
} from '../../helpers/modules/dual-output';
import { getApiClient } from '../../helpers/api-client';
import { test, useWebdriver, TExecutionContext } from '../../helpers/webdriver';
import { SceneBuilder } from '../../helpers/scene-builder';
import { addSource } from '../../helpers/modules/sources';
import { ScenesService } from 'services/api/external-api/scenes';

useWebdriver();

/**
 * Dual output video settings
 */
test.skip('User must be logged in to use Dual Output', async (t: TExecutionContext) => {
  await toggleDualOutputMode(false);
  await focusChild();
  t.true(await isDisplayed('form#login-modal', { timeout: 1000 }));
});

test('Dual output checkbox toggles Dual Output mode and duplicates sources', async (t: TExecutionContext) => {
  await logIn();

  const sceneBuilder = new SceneBuilder(await getApiClient());

  await addSource('Color Block', 'Color Source');
  await addSource('Color Block', 'Color Source 2');
  await addSource('Color Block', 'Color Source 3');

  t.true(
    sceneBuilder.isEqualTo(
      `
    Color Source 3:
    Color Source 2:
    Color Source:
  `,
    ),
  );

  // toggle dual output on and convert dual output scene collection
  await toggleDualOutputMode();
  await focusMain();
  // @@@ TODO check for property, not element
  t.true(await isDisplayed('div#vertical-display'));
  t.true(
    sceneBuilder.isEqualTo(
      `
    Color Source 3:
    Color Source 2:
    Color Source:
    Color Source 3:
    Color Source 2:
    Color Source:
  `,
    ),
  );

  // toggle dual output off, vertical nodes persist
  await toggleDualOutputMode();
  await focusMain();
  t.false(await isDisplayed('div#vertical-display'));
  t.true(
    sceneBuilder.isEqualTo(
      `
    Color Source 3:
    Color Source 2:
    Color Source:
    Color Source 3:
    Color Source 2:
    Color Source:
  `,
    ),
  );

  // toggle dual output on, nodes do not duplicate
  await toggleDualOutputMode();
  t.true(
    sceneBuilder.isEqualTo(
      `
    Color Source 3:
    Color Source 2:
    Color Source:
    Color Source 3:
    Color Source 2:
    Color Source:
  `,
    ),
  );
});

/**
 * Dual output displays
 */
test.skip('Dual output display toggles show/hides displays and filters sources', async (t: TExecutionContext) => {
  await logIn();

  const client = await getApiClient();
  const sceneBuilder = new SceneBuilder(client);

  await addSource('Color Block', 'Color Source');
  await addSource('Color Block', 'Color Source 2');
  await addSource('Color Block', 'Color Source 3');

  await toggleDualOutputMode();
  await focusMain();

  t.true(sceneBuilder.confirmDualOutputCollection());

  const scenesService = client.getResource<ScenesService>('ScenesService');

  let sceneNodes = scenesService.activeScene.getSourceSelectorNodes();
  let visibleHorizontalNodes: WebdriverIO.Element[] = [];
  let visibleVerticalNodes: WebdriverIO.Element[] = [];

  // check permutations of toggling on and off the displays
  // toggle horizontal, vertical display active
  await clickIfDisplayed('i#horizontal-display-toggle');
  t.false(await isDisplayed('div#horizontal-display'));
  t.true(await isDisplayed('div#vertical-display'));

  // should only show vertical sources in source selector
  sceneNodes = scenesService.activeScene.getSourceSelectorNodes();
  visibleHorizontalNodes = await selectElements('i.horizontal-source-icon');
  visibleVerticalNodes = await selectElements('i.vertical-source-icon');

  t.is(sceneNodes.length, visibleVerticalNodes.length);
  t.is(visibleHorizontalNodes.length, 0);
  t.is(confirmSelectorNodesDisplay(sceneNodes, 'vertical'), true);

  // toggle vertical, no displays active
  await toggleDisplay('vertical', true);
  t.false(await isDisplayed('div#horizontal-display'));
  t.false(await isDisplayed('div#vertical-display'));

  // should hide both horizontal and vertical sources in source selector
  visibleHorizontalNodes = await selectElements('i.horizontal-source-icon');
  visibleVerticalNodes = await selectElements('i.vertical-source-icon');

  t.is(visibleHorizontalNodes.length, 0);
  t.is(visibleVerticalNodes.length, 0);

  // toggle horizontal, only horizontal active
  await toggleDisplay('horizontal');
  t.true(await isDisplayed('div#horizontal-display'));
  t.false(await isDisplayed('div#vertical-display'));

  // should only show horizontal sources in source selector
  sceneNodes = scenesService.activeScene.getSourceSelectorNodes();
  visibleHorizontalNodes = await selectElements('i.horizontal-source-icon');
  visibleVerticalNodes = await selectElements('i.vertical-source-icon');

  t.is(sceneNodes.length, visibleHorizontalNodes.length);
  t.is(visibleVerticalNodes.length, 0);
  t.is(confirmSelectorNodesDisplay(sceneNodes, 'horizontal'), true);

  // toggle vertical, both displays active
  await toggleDisplay('vertical');
  t.true(await isDisplayed('div#horizontal-display'));
  t.true(await isDisplayed('div#vertical-display'));

  // should show both horizontal and vertical sources in source selector
  sceneNodes = scenesService.activeScene.getSourceSelectorNodes();
  visibleHorizontalNodes = await selectElements('i.horizontal-source-icon');
  visibleVerticalNodes = await selectElements('i.vertical-source-icon');

  t.is(sceneNodes.length, visibleHorizontalNodes.length);
  t.is(sceneNodes.length, visibleVerticalNodes.length);
  t.is(confirmHasDisplaysAssigned(sceneNodes), true);

  // toggle vertical, only horizontal active
  await toggleDisplay('vertical');
  t.true(await isDisplayed('div#horizontal-display'));
  t.false(await isDisplayed('div#vertical-display'));

  // should only show horizontal sources in source selector
  sceneNodes = scenesService.activeScene.getSourceSelectorNodes();
  visibleHorizontalNodes = await selectElements('i.horizontal-source-icon');
  visibleVerticalNodes = await selectElements('i.vertical-source-icon');

  t.is(sceneNodes.length, visibleHorizontalNodes.length);
  t.is(visibleVerticalNodes.length, 0);
  t.is(confirmSelectorNodesDisplay(sceneNodes, 'horizontal'), true);

  // toggle horizontal, both displays inactive
  await toggleDisplay('horizontal');
  t.false(await isDisplayed('div#horizontal-display'));
  t.false(await isDisplayed('div#vertical-display'));

  // should hide both horizontal and vertical sources in source selector
  sceneNodes = scenesService.activeScene.getSourceSelectorNodes();
  visibleHorizontalNodes = await selectElements('i.horizontal-source-icon');
  visibleVerticalNodes = await selectElements('i.vertical-source-icon');

  t.is(visibleHorizontalNodes.length, 0);
  t.is(visibleVerticalNodes.length, 0);

  // toggle vertical, only vertical active
  await toggleDisplay('vertical');
  t.false(await isDisplayed('div#horizontal-display'));
  t.true(await isDisplayed('div#vertical-display'));

  // should only show vertical sources in source selector
  sceneNodes = scenesService.activeScene.getSourceSelectorNodes();
  visibleHorizontalNodes = await selectElements('i.horizontal-source-icon');
  visibleVerticalNodes = await selectElements('i.vertical-source-icon');

  t.is(sceneNodes.length, visibleVerticalNodes.length);
  t.is(visibleHorizontalNodes.length, 0);
  t.is(confirmSelectorNodesDisplay(sceneNodes, 'vertical'), true);

  // toggle horizontal, both displays active
  await toggleDisplay('horizontal');
  t.true(await isDisplayed('div#horizontal-display'));
  t.true(await isDisplayed('div#vertical-display'));

  // should show both horizontal and vertical sources in source selector
  visibleHorizontalNodes = await selectElements('i.horizontal-source-icon');
  visibleVerticalNodes = await selectElements('i.vertical-source-icon');

  t.is(sceneNodes.length, visibleHorizontalNodes.length);
  t.is(sceneNodes.length, visibleVerticalNodes.length);
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
