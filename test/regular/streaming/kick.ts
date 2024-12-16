import { test, useWebdriver } from '../../helpers/webdriver';
import {
  clickGoLive,
  prepareToGoLive,
  stopStream,
  submit,
  waitForSettingsWindowLoaded,
  waitForStreamStart,
} from '../../helpers/modules/streaming';
import { addDummyAccount, withUser } from '../../helpers/webdriver/user';
import { fillForm } from '../../helpers/modules/forms';
import { waitForDisplayed } from '../../helpers/modules/core';

// not a react hook
// eslint-disable-next-line react-hooks/rules-of-hooks
useWebdriver();

test('Streaming to Kick', withUser('twitch', { multistream: true }), async t => {
  await addDummyAccount('kick');

  await prepareToGoLive();
  await clickGoLive();
  await waitForSettingsWindowLoaded();
  await fillForm({
    kick: true,
  });
  await waitForSettingsWindowLoaded();
  await waitForDisplayed('div[data-name="kick-settings"]');

  await fillForm({
    title: 'Test stream',
    twitchGame: 'Fortnite',
  });
  await submit();
  await waitForDisplayed('span=Update settings for Kick');
  await waitForStreamStart();
  await stopStream();
  t.pass();
});
