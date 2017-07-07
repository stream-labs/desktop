import test from 'ava';
import { useSpectron, focusMain, focusChild } from './helpers/spectron';
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
  await app.client.click('button=Go Live');

  // Wait up to 15 seconds for the "Stream OK" message to appear
  await app.client.waitForExist('div*=Stream OK', 15 * 1000);
  t.pass();
});
