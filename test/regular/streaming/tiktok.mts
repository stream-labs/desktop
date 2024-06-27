import {
  skipCheckingErrorsInLog,
  test,
  TExecutionContext,
  useWebdriver,
} from '../../helpers/webdriver/index.mjs';
import {
  clickGoLive,
  prepareToGoLive,
  stopStream,
  submit,
  waitForSettingsWindowLoaded,
  waitForStreamStart,
} from '../../helpers/modules/streaming.mjs';
import { addDummyAccount, withUser } from '../../helpers/webdriver/user.mjs';
import { fillForm, readFields } from '../../helpers/modules/forms/index.mjs';
import { IDummyTestUser } from '../../data/dummy-accounts.mjs';
import { TTikTokLiveScopeTypes } from 'services/platforms/tiktok/api.js';
import { isDisplayed, waitForDisplayed } from '../../helpers/modules/core.mjs';

useWebdriver();

test('Streaming to TikTok', withUser('twitch', { multistream: false, prime: false }), async t => {
  // test approved status
  await addDummyAccount('tiktok', { tiktokLiveScope: 'approved' });

  await prepareToGoLive();
  await clickGoLive();
  await waitForSettingsWindowLoaded();

  // enable tiktok
  await fillForm({
    tiktok: true,
  });
  await waitForSettingsWindowLoaded();
  const fields = await readFields();

  // tiktok always shows regardless of ultra status
  t.true(fields.hasOwnProperty('tiktok'));

  // accounts approved for live access do not show the server url and stream key fields
  t.false(fields.hasOwnProperty('serverUrl'));
  t.false(fields.hasOwnProperty('streamKey'));

  await fillForm({
    title: 'Test stream',
    twitchGame: 'Fortnite',
    tiktokGame: 'test1',
  });
  await submit();
  await waitForDisplayed('span=Update settings for TikTok');
  await waitForStreamStart();
  await stopStream();

  // test all other tiktok statuses
  await testLiveScope(t, 'not-approved');
  await testLiveScope(t, 'legacy');
  await testLiveScope(t, 'denied');

  t.pass();
});

async function testLiveScope(t: TExecutionContext, scope: TTikTokLiveScopeTypes) {
  const user: IDummyTestUser = await addDummyAccount('tiktok', { tiktokLiveScope: scope });

  await clickGoLive();

  // denied scope should show prompt to remerge TikTok account
  if (scope === 'denied') {
    skipCheckingErrorsInLog();
    t.true(await isDisplayed('div=Failed to update TikTok account', { timeout: 1000 }));
    return;
  }

  await waitForSettingsWindowLoaded();

  await fillForm({
    tiktok: true,
  });
  await waitForSettingsWindowLoaded();

  const settings = {
    title: 'Test stream',
    twitchGame: 'Fortnite',
    serverUrl: user.serverUrl,
    streamKey: user.streamKey,
  };

  // show server url and stream key fields for all other account scopes
  await fillForm(settings);
  await submit();
  await waitForDisplayed('span=Update settings for TikTok');
  await waitForStreamStart();
  await stopStream();
}
