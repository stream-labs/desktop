import { test, useWebdriver } from '../../helpers/webdriver/index.mjs';
import { logIn } from '../../helpers/modules/user.mjs';
import { chatIsVisible, goLive, stopStream } from '../../helpers/modules/streaming.mjs';

useWebdriver();

test('Streaming to Trovo', async t => {
  await logIn('trovo');
  await goLive({
    title: 'Test',
    trovoGame: 'Fortnite',
  });
  t.true(await chatIsVisible(), 'Chat should be visible');
  await stopStream();
  t.pass();
});
