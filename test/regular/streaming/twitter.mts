import { test, useWebdriver } from '../../helpers/webdriver/index.mjs';
import {
  clickGoLive,
  prepareToGoLive,
  stopStream,
  submit,
  waitForSettingsWindowLoaded,
  waitForStreamStart,
} from '../../helpers/modules/streaming.mjs';
import { addDummyAccount, withUser } from '../../helpers/webdriver/user.mjs';
import { fillForm } from '../../helpers/modules/forms/index.mjs';
import { waitForDisplayed } from '../../helpers/modules/core.mjs';

useWebdriver();

test('Streaming to X', withUser('twitch', { multistream: true }), async t => {
  await addDummyAccount('twitter');

  await prepareToGoLive();
  await clickGoLive();
  await waitForSettingsWindowLoaded();
  await fillForm({
    twitter: true,
  });
  await waitForSettingsWindowLoaded();

  await fillForm({
    title: 'Test stream',
    twitchGame: 'Fortnite',
  });
  await submit();
  await waitForDisplayed('span=Update settings for X (Twitter)');
  await waitForStreamStart();
  await stopStream();
  t.pass();
});
