import { test, useWebdriver } from '../../helpers/webdriver/index.mjs';
import { logIn } from '../../helpers/webdriver/user.mjs';
import {
  goLive,
  stopStream,
  waitForStreamStart,
  waitForStreamStop,
} from '../../helpers/modules/streaming.mjs';
import { showSettingsWindow } from '../../helpers/modules/settings/settings.mjs';
import { click } from '../../helpers/modules/core.mjs';
import { assertFormContains, readFields, useForm } from '../../helpers/modules/forms/index.mjs';

useWebdriver();

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
  const user = await logIn(t);

  // make sure all required fields are filled for platforms
  if (user.type === 'twitch') {
    await goLive({
      title: 'Test title',
      twitchGame: 'Fortnite',
    });
  } else {
    await goLive();
  }

  await waitForStreamStart();
  await stopStream();
  await waitForStreamStop();
  await showSettingsWindow('Stream');
  await click('a=Stream to custom ingest');

  // Check that is a somewhat valid Twitch stream key
  const formData = (await readFields()) as { key: string };
  const streamKey = formData.key;
  t.true(streamKey.startsWith('live_'));
  t.true(streamKey.length > 40);
});
