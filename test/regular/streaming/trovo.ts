import { test, useSpectron } from '../../helpers/spectron';
import { logIn } from '../../helpers/modules/user';
import { chatIsVisible, goLive, stopStream } from '../../helpers/modules/streaming';

useSpectron();

// TODO add testing accounts for Trovo
test.skip('Streaming to Trovo', async t => {
  await logIn('trovo');
  await goLive({
    title: 'Test',
    trovoGame: 'Fortnite',
  });
  t.true(await chatIsVisible(), 'Chat should be visible');
  await stopStream();
  t.pass();
});
