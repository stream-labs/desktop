import { test, useWebdriver } from '../../helpers/webdriver';
import { logIn } from '../../helpers/modules/user';
import {
  clickGoLive,
  prepareToGoLive,
  waitForSettingsWindowLoaded,
} from '../../helpers/modules/streaming';
import { addDummyAccount } from '../../helpers/webdriver/user';
import { readFields } from '../../helpers/modules/forms';

useWebdriver();

test('Streaming to X', async t => {
  await logIn('twitch', { multistream: true });

  // test approved status
  await addDummyAccount('twitter');

  await prepareToGoLive();
  await clickGoLive();
  await waitForSettingsWindowLoaded();

  const fields = await readFields();

  t.true(fields.hasOwnProperty('twitter'));

  t.pass();
});
