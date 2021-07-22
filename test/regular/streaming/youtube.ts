import { logIn } from '../../helpers/modules/user';
import { test, useSpectron } from '../../helpers/spectron';
import { chatIsVisible, goLive, stopStream } from '../../helpers/modules/streaming';
import { sleep } from '../../helpers/sleep';

useSpectron();

test('Streaming to Youtube', async t => {
  await logIn('youtube', { multistream: false });
  t.false(await chatIsVisible(), 'Chat should not be visible for YT before stream starts');

  await goLive({
    title: 'SLOBS Test Stream',
    description: 'SLOBS Test Stream Description',
  });

  t.true(await chatIsVisible(), 'Chat should be visible');
  await stopStream();
});
