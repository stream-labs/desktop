import { test, useSpectron } from '../../helpers/spectron';
import { logIn } from '../../helpers/spectron/user';
import { getFormInput } from '../../helpers/spectron/forms';
import { goLive, stopStream } from '../../helpers/modules/streaming';
import { FormMonkey } from '../../helpers/form-monkey';
import { showSettingsWindow } from '../../helpers/modules/settings/settings';

useSpectron();

test('Populates stream settings after go live', async t => {
  const { app } = t.context;

  await logIn(t);
  await goLive();
  await stopStream();
  await showSettingsWindow('Stream');
  await click('a=Stream to custom ingest');

  // await (await app.client.$('a=Stream to custom ingest')).click();
  // const form = new FormMonkey(t);
  // t.true(
  //   await form.includesByTitles({
  //     'Stream Type': 'Streaming Services',
  //     Service: 'Twitch',
  //     Server: 'Auto (Recommended)',
  //   }),
  // );
});

test('Populates stream key after go live', async t => {
  const { app } = t.context;

  await logIn(t);
  await goLive();
  await stopStream();
  await showSettingsWindow('Stream');
  await (await app.client.$('a=Stream to custom ingest')).click();

  // Test that we can toggle show stream key, also helps us fetch the value
  await (await app.client.$('button=Show')).click();
  t.false(await (await app.client.$('input[type=password]')).isExisting());

  // Check that is a somewhat valid Twitch stream key
  const streamKey = await getFormInput(t, 'Stream key');
  t.true(streamKey.startsWith('live_'));
  t.true(streamKey.length > 40);

  // Test that we can hide back the stream key
  await (await app.client.$('button=Hide')).click();
  t.true(await (await app.client.$('input[type=password]')).isExisting());
});
