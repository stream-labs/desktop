import test from 'ava';
import { useSpectron, focusMain, focusChild } from './helpers/spectron/index';
import { setFormInput } from './helpers/spectron/forms';

useSpectron();

test('Streaming to Twitch', async t => {
  const app = t.context.app;

  await focusMain(t);
  await app.client.click('.top-nav .fa-cog');

  await focusChild(t);
  await app.client.click('li=Stream');

  // This is the twitch.tv/slobstest stream key
  await setFormInput(
    t,
    'Stream key',
    process.env.SLOBS_STREAM_KEY || 'live_147956788_GvRHQnjQL64F1MqDlw5roLcroaRULT'
  );
  await app.client.click('button=Done');

  await focusMain(t);
  await app.client.click('button=GO LIVE');

  // TODO: Rewrite this test to use the logged in state and the live dock
  await app.client.waitForExist('button=END STREAM', 5 * 1000);
  t.pass();
});
