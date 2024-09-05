import { fillForm, readFields, useForm } from '../../helpers/modules/forms';
import {
  click,
  clickButton,
  focusChild,
  isDisplayed,
  waitForDisplayed,
} from '../../helpers/modules/core';
import {
  clickGoLive,
  prepareToGoLive,
  waitForSettingsWindowLoaded,
} from '../../helpers/modules/streaming';
import { test, useWebdriver } from '../../helpers/webdriver';
import { addDummyAccount, withUser } from '../../helpers/webdriver/user';
import { toggleDualOutputMode } from '../../helpers/modules/dual-output';
import { tikTokUsers } from '../../data/dummy-accounts';
import { sleep } from '../../helpers/sleep';

useWebdriver();

/**
 * Tests for the components in the Go Live Window
 * @remark The initial login for all of the below tests for both the cases of:
 *  - TikTok as Primary Account
 *  - TikTok NOT as Primary Account, TikTok Merged
 * Cases handled by other tests (with test name):
 *  - Can add up to 5 custom destinations --> (Custom stream destinations)
 * Cases not handled:
 *  - Shows the "Add Destination" button until all possible platforms have been added and 5 custom destinations have been added
 *  - Primary Chat: show/hide, value must match one of the platforms going live
 *  - Dual Output
 */
test('Ultra User Go Live Window', withUser('twitch', { multistream: true }), async t => {
  await prepareToGoLive();
  await clickGoLive();
  await waitForSettingsWindowLoaded();

  // Show single output add destination button
  t.true(
    await isDisplayed('[data-test=single-output-add-destination]'),
    'Add Destination single output button should be displayed',
  );

  // TikTok card with Ultra prompt shows if TikTok is not logged in
  t.true(
    await isDisplayed('[data-test=tiktok-single-output]'),
    'TikTok card should be always be displayed',
  );

  const { tikTokLiveScope, serverUrl, streamKey } = tikTokUsers.approved;
  await addDummyAccount('tiktok', { tikTokLiveScope, serverUrl, streamKey });

  // Must have at least one platform enabled
  await clickGoLive();
  await waitForSettingsWindowLoaded();
  await fillForm({
    twitch: false,
  });

  // wait for toggle to reset
  await sleep(500);

  let fields = (await readFields()) as {
    twitch: boolean;
    youtube: boolean;
    trovo: boolean;
    tiktok: boolean;
    customEnabled: boolean;
  };

  t.true(fields.twitch === true, 'One platform is always enabled');

  // Can toggle off primary platform
  await fillForm({
    trovo: true,
  });
  await waitForSettingsWindowLoaded();

  await fillForm({
    twitch: false,
  });
  await waitForSettingsWindowLoaded();

  fields = (await readFields()) as {
    twitch: boolean;
    youtube: boolean;
    trovo: boolean;
    tiktok: boolean;
    customEnabled: boolean;
  };

  t.true(fields.twitch === false, 'Primary platform can be disabled');
  t.true(fields.trovo === true, 'Secondary platform can be only enabled platform');

  t.pass();
});
