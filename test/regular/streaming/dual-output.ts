import {
  clickGoLive,
  prepareToGoLive,
  submit,
  waitForSettingsWindowLoaded,
} from '../../helpers/modules/streaming';
import {
  clickIfDisplayed,
  focusChild,
  focusMain,
  isDisplayed,
  waitForDisplayed,
} from '../../helpers/modules/core';
import { logIn } from '../../helpers/modules/user';
import { toggleDisplay, toggleDualOutputMode } from '../../helpers/modules/dual-output';
import {
  skipCheckingErrorsInLog,
  test,
  TExecutionContext,
  useWebdriver,
} from '../../helpers/webdriver';
import { withUser } from '../../helpers/webdriver/user';
import { SceneBuilder } from '../../helpers/scene-builder';
import { getApiClient } from '../../helpers/api-client';

// not a react hook
// eslint-disable-next-line react-hooks/rules-of-hooks
useWebdriver();

/**
 * Toggle Dual Output Video Settings
 */
test('User must be logged in to use Dual Output', async (t: TExecutionContext) => {
  await toggleDualOutputMode(false);
  await focusChild();
  t.true(await isDisplayed('form#login-modal', { timeout: 1000 }));
});

test('Dual output checkbox toggles Dual Output mode', withUser(), async (t: TExecutionContext) => {
  await toggleDualOutputMode();
  await focusMain();
  t.true(await isDisplayed('div#vertical-display'));

  await toggleDualOutputMode();
  await focusMain();
  t.false(await isDisplayed('div#vertical-display'));
});

test('Cannot toggle Dual Output in Studio Mode', withUser(), async (t: TExecutionContext) => {
  const { app } = t.context;

  await toggleDualOutputMode();

  // attempt toggle studio mode from side nav
  await focusMain();
  await (await app.client.$('.side-nav .icon-studio-mode-3')).click();
  t.true(await isDisplayed('div=Cannot toggle Studio Mode in Dual Output Mode.'));
});

test(
  'Dual Output Selective Recording is Horizontal Only',
  withUser(),
  async (t: TExecutionContext) => {
    const { app } = t.context;

    t.false(await isDisplayed('div#vertical-display'));
    await (await app.client.$('[data-name=sourcesControls] .icon-smart-record')).click();

    // Check that selective recording icon is active
    await (await app.client.$('.icon-smart-record.active')).waitForExist();

    await toggleDualOutputMode();

    // dual output is active but the vertical display is not shown
    await focusMain();
    await (await app.client.$('.icon-dual-output.active')).waitForExist();
    t.false(await isDisplayed('div#vertical-display'));

    // toggling selective recording off should show the vertical display
    await (await app.client.$('.icon-smart-record.active')).click();
    t.true(await isDisplayed('div#vertical-display'));

    // toggling selective recording back on should hide the vertical display
    await (await app.client.$('.icon-smart-record')).click();
    t.false(await isDisplayed('div#vertical-display'));

    // toggling selective recording on while in dual output mode opens a message box warning
    // notifying the user that the vertical canvas is no longer accessible
    // skip checking the log for this error
    skipCheckingErrorsInLog();
    t.pass();
  },
);

/**
 * Dual Output Go Live
 */

test(
  'Dual Output Go Live Non-Ultra',
  // non-ultra user
  withUser('twitch', { prime: false }),
  async t => {
    await toggleDualOutputMode();
    await prepareToGoLive();
    await clickGoLive();
    await waitForSettingsWindowLoaded();

    await waitForDisplayed('[data-test=non-ultra-switcher]');

    // cannot use dual output mode with only one platform linked
    await submit();
    await waitForDisplayed('span=Confirm Horizontal and Vertical Platforms');

    t.pass();
  },
);

test(
  'Dual Output Go Live Ultra',
  withUser('twitch', { multistream: true }),
  async (t: TExecutionContext) => {
    // test going live with ultra
    await toggleDualOutputMode();
    await prepareToGoLive();
    await clickGoLive();
    await waitForSettingsWindowLoaded();

    await waitForDisplayed('[data-test=ultra-switcher]');

    // cannot use dual output mode with all platforms assigned to one display
    await submit();
    await waitForDisplayed('span=Confirm Horizontal and Vertical Platforms');

    t.pass();
  },
);

test('Dual output duplicates item and folder hierarchy', async (t: TExecutionContext) => {
  await logIn();

  const sceneBuilder = new SceneBuilder(await getApiClient());

  // Build a complex item and folder hierarchy
  const sketch = `
  Item1:
  Item2:
  Folder1
    Item3:
    Item4:
  Item5:
  Folder2
    Item6:
    Folder3
      Item7:
      Item8:
    Item9:
    Folder4
      Item10:
  Item11:
`;

  sceneBuilder.build(sketch);

  t.true(
    sceneBuilder.isEqualTo(
      `
      Item1:
      Item2:
      Folder1
        Item3:
        Item4:
      Item5:
      Folder2
        Item6:
        Folder3
          Item7:
          Item8:
        Item9:
        Folder4
          Item10:
      Item11:
  `,
    ),
  );

  // toggle dual output on and convert dual output scene collection
  await toggleDualOutputMode();
  t.true(
    sceneBuilder.isEqualTo(
      `
      Item1: color_source
      Item2: color_source
      Folder1
        Item3: color_source
        Item4: color_source
      Item5: color_source
      Folder2
        Item6: color_source
        Folder3
          Item7: color_source
          Item8: color_source
        Item9: color_source
        Folder4
          Item10: color_source
      Item11: color_source
      Item1: color_source
      Item2: color_source
      Folder1
        Item3: color_source
        Item4: color_source
      Item5: color_source
      Folder2
        Item6: color_source
        Folder3
          Item7: color_source
          Item8: color_source
        Item9: color_source
        Folder4
          Item10: color_source
      Item11: color_source
    `,
    ),
  );
});

/**
 * Dual Output Sources
 */

test('Dual output display toggles', withUser(), async (t: TExecutionContext) => {
  await toggleDualOutputMode();
  await focusMain();

  t.true(await isDisplayed('div#dual-output-header'));

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
