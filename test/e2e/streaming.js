import test from 'ava';
import { useSpectron, focusMain, focusChild } from '../helpers/spectron/index';
import { setFormInput } from '../helpers/spectron/forms';

useSpectron();

test('Streaming to custom streaming server', async t => {
  const streamingServerURL = process.env.NAIR_TEST_STREAM_SERVER;
  const streamingKey = process.env.NAIR_TEST_STREAM_KEY;

  if (!(streamingServerURL && streamingKey)) {
    console.warn(
      'テスト用配信情報が不足しています。配信テストをスキップします。\n' +
      `NAIR_TEST_STREAM_SERVER: ${process.env.NAIR_TEST_STREAM_SERVER}\n` + 
      `NAIR_TEST_STREAM_KEY   : ${process.env.NAIR_TEST_STREAM_KEY}`
    );
    t.pass();
    return;
  }

  const app = t.context.app;

  await focusMain(t);
  await app.client.click('[data-test="OpenSettings"]');

  await focusChild(t);
  await app.client.click('[data-test="Settings"] [data-test="SideMenu"] [data-test="Stream"]');

  await setFormInput(
    t,
    '[data-test="Form/Text/server"]',
    streamingServerURL
  );
  await setFormInput(
    t,
    '[data-test="Form/Text/key"]',
    streamingKey
  );
  await app.client.click('[data-test="Done"]');

  await focusMain(t);
  await app.client.click('[data-test="StartStreamingButton"]');

  await app.client.waitForExist('[data-test="StartStreamingButton"][data-test-status="live"]', 10 * 1000);
  t.pass();
});
