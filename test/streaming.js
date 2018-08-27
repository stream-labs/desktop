import test from 'ava';
import { useSpectron, focusMain, focusChild } from './helpers/spectron/index';
import { setFormInput } from './helpers/spectron/forms';

useSpectron();

test('Streaming to Twitch', async t => {
  if (!process.env.SLOBS_TEST_STREAM_KEY) {
    console.warn('SLOBS_TEST_STREAM_KEY not found!  Skipping streaming test.');
    t.pass();
    return;
  }

  const app = t.context.app;

  await focusMain(t);
  await app.client.click('.top-nav .icon-settings');

  await focusChild(t);
  await app.client.click('li=Stream');

  // This is the twitch.tv/slobstest stream key
  await setFormInput(
    t,
    'Stream key',
    process.env.SLOBS_TEST_STREAM_KEY
  );
  await app.client.click('button=Done');

  await focusMain(t);
  await app.client.click('button=Go Live');

  // TODO: Rewrite this test to use the logged in state and the live dock
  await app.client.waitForExist('button=End Stream', 10 * 1000);
  t.pass();
});
