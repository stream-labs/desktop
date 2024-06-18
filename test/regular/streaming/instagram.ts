import { test, useWebdriver } from '../../helpers/webdriver';
import { logIn } from '../../helpers/modules/user';
import {
  clickGoLive,
  prepareToGoLive,
  waitForSettingsWindowLoaded,
  submit,
  waitForStreamStart,
  stopStream,
} from '../../helpers/modules/streaming';
import { addDummyAccount, releaseUserInPool, withPoolUser } from '../../helpers/webdriver/user';
import { fillForm } from '../../helpers/modules/forms';
import { waitForDisplayed } from '../../helpers/modules/core';

useWebdriver();

test('Streaming to Instagram', async t => {
  const user = await logIn('twitch', { prime: true, multistream: false });

  await withPoolUser(user, async () => {
    // test approved status
    const dummy = await addDummyAccount('instagram');

    await prepareToGoLive();
    await clickGoLive();
    await waitForSettingsWindowLoaded();
    await fillForm({
      instagram: true,
    });
    await waitForSettingsWindowLoaded();

    await fillForm({
      title: 'Test stream',
      twitchGame: 'Fortnite',
      streamUrl: dummy.streamUrl,
      streamKey: dummy.streamKey,
    });
    await submit();
    await waitForDisplayed('span=Update settings for Instagram');
    await waitForStreamStart();
    await stopStream();

    t.pass();
  });
});
