import { TExecutionContext, test, useWebdriver } from '../../helpers/webdriver';
import { logIn } from '../../helpers/modules/user';
import {
  clickGoLive,
  prepareToGoLive,
  waitForSettingsWindowLoaded,
} from '../../helpers/modules/streaming';
import { addDummyAccount } from '../../helpers/webdriver/user';
import { assertFormContains, fillForm, readFields } from '../../helpers/modules/forms';
import { IDummyTestUser } from '../../data/dummy-accounts';
import { TTikTokLiveScopeTypes } from 'services/platforms/tiktok/api';

useWebdriver();

test('Streaming to TikTok', async t => {
  await logIn('twitch');

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

  // test all other tiktok statuses
  await testLiveScope(t, 'not-approved');
  await testLiveScope(t, 'legacy');
  await testLiveScope(t, 'denied');
});

async function testLiveScope(t: TExecutionContext, scope: TTikTokLiveScopeTypes) {
  const user: IDummyTestUser = await addDummyAccount('tiktok', { tiktokLiveScope: scope });

  await clickGoLive();
  await waitForSettingsWindowLoaded();

  // enable all platforms
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

  // add settings
  await fillForm(settings);
  await waitForSettingsWindowLoaded();
  const fields: any = await readFields();

  t.is(fields.serverUrl, user.serverUrl);
  t.is(fields.serverUrl, user.serverUrl);
}
