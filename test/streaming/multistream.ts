import { click, focusChild, test, useSpectron } from '../helpers/spectron';
import { logIn } from '../helpers/spectron/user';
import { clickGoLive, prepareToGoLive, updateChannelSettings } from '../helpers/spectron/streaming';
import { fillForm, selectTitle } from '../helpers/form-monkey';
import { sleep } from '../helpers/sleep';

useSpectron();

test('Multistream default mode', async t => {
  await logIn(t, null, { multistream: true });
  await prepareToGoLive(t);
  await clickGoLive(t);

  // enable all platforms
  await fillForm(t, null, {
    twitch: true,
    youtube: true,
    facebook: true,
  });

  // add settings
  await fillForm(t, null, {
    title: 'Test stream',
    description: 'Test stream description',
    game: ['facebook Fortnite', 'twitch Fortnite'],
  });

  await sleep(99999, true)
  t.pass();
});
