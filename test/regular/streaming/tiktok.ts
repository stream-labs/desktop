import {
  TExecutionContext,
  skipCheckingErrorsInLog,
  test,
  useWebdriver,
} from '../../helpers/webdriver';
import { logIn } from '../../helpers/modules/user';
import {
  clickGoLive,
  prepareToGoLive,
  stopStream,
  submit,
  waitForSettingsWindowLoaded,
  waitForStreamStart,
} from '../../helpers/modules/streaming';
import { addDummyAccount, releaseUserInPool } from '../../helpers/webdriver/user';
import {
  assertFormContains,
  fillForm,
  readFields,
  setInputValue,
  useForm,
} from '../../helpers/modules/forms';
import { IDummyTestUser } from '../../data/dummy-accounts';
import { TTikTokLiveScopeTypes } from 'services/platforms/tiktok/api';
import { isDisplayed, waitForDisplayed } from '../../helpers/modules/core';

useWebdriver();

test('Streaming to TikTok', async t => {
  // also tests approved status
  const user = await logInTikTok(false);

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

  await releaseUserInPool(user);
  t.pass();
});

test('TikTok game tags', async t => {
  // using dummy data creates an error when requesting game tags
  skipCheckingErrorsInLog();

  const user = await logInTikTok(true);
  await fillForm({
    title: 'Test stream',
    twitchGame: 'Fortnite',
  });

  // game tag is required
  await submit();
  await waitForDisplayed('div=The field is required');

  // form shows game tag and default options
  await setInputValue('div=TikTok Game', 'te');
  const settingsForm = useForm('tiktok-settings');
  await settingsForm.assertInputOptions('tiktokGame', null, ['test1', 'Other']);

  // goes live with game tag
  await settingsForm.fillForm({ tiktokGame: 'test1' });
  await submit();
  await waitForStreamStart();
  await stopStream();

  // persists game name
  await clickGoLive();
  await waitForSettingsWindowLoaded();
  assertFormContains({ tiktokGame: 'test1' });

  // goes live with default option
  await settingsForm.fillForm({ tiktokGame: 'Other' });
  await submit();
  await waitForStreamStart();
  await stopStream();

  // default option only shows once in options
  await clickGoLive();
  await waitForSettingsWindowLoaded();

  assertFormContains({ tiktokGame: 'Other' });
  await settingsForm.assertInputOptions('tiktokGame', 'Other', ['Other']);

  await releaseUserInPool(user);

  t.pass();
});

async function logInTikTok(isPrime: boolean) {
  const user = await logIn('twitch', { multistream: false, prime: isPrime });

  // login approved status
  await addDummyAccount('tiktok', { tiktokLiveScope: 'approved' });

  await prepareToGoLive();
  await clickGoLive();
  await waitForSettingsWindowLoaded();

  // enable tiktok
  await fillForm({
    tiktok: true,
  });
  await waitForSettingsWindowLoaded();

  return user;
}

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
