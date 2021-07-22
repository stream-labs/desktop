import { test, useSpectron } from '../../helpers/spectron';
import { logIn } from '../../helpers/modules/user';
import { chatIsVisible, goLive, stopStream } from '../../helpers/modules/streaming';

useSpectron();

test('Streaming to a Facebook Page', async t => {
  await logIn('facebook', { multistream: false });
  await goLive({
    title: 'SLOBS Test Stream',
    facebookGame: 'Fortnite',
    description: 'SLOBS Test Stream Description',
  });
  t.true(await chatIsVisible(), 'Chat should be visible');
  await stopStream();
  t.pass();
});
