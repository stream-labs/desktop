import { test, runWithSpectron } from '../../helpers/spectron';
import { logIn } from '../../helpers/spectron/user';
import { getFormInput } from '../../helpers/spectron/forms';
import { goLive, stopStream } from '../../helpers/modules/streaming';
import { FormMonkey } from '../../helpers/form-monkey';
import { showSettingsWindow } from '../../helpers/modules/settings/settings';
import { click } from '../../helpers/modules/core';
import { assertFormContains, readFields, useForm } from '../../helpers/modules/forms';

runWithSpectron();

test('Populates stream settings after go live', async t => {
  await logIn(t);
  await goLive();
  await stopStream();
  await showSettingsWindow('Stream');
  await click('a=Stream to custom ingest');

  await assertFormContains(
    {
      'Stream Type': 'Streaming Services',
      Service: 'Twitch',
      Server: 'Auto (Recommended)',
    },
    'title',
  );

  t.pass();
});

test('Populates stream key after go live', async t => {
  const { app } = t.context;

  await logIn(t);
  await goLive();
  await stopStream();
  await showSettingsWindow('Stream');
  await click('a=Stream to custom ingest');

  // Check that is a somewhat valid Twitch stream key
  const formData = (await readFields()) as { key: string };
  const streamKey = formData.key;
  t.true(streamKey.startsWith('live_'));
  t.true(streamKey.length > 40);
});
