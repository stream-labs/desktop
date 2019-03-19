import { focusChild, focusMain, test, useSpectron } from '../helpers/spectron';
import { setFormDropdown } from '../helpers/spectron/forms';
import { sleep } from '../helpers/sleep';

useSpectron();

const AUDIO_BITRATES = [64, 96, 128, 160, 192, 224, 256, 288, 320];

test('Populates simple output mode settings', async t => {
  const { app } = t.context;

  await focusMain(t);
  await app.client.click('.top-nav .icon-settings');

  await focusChild(t);
  await app.client.click('li=Output');

  await setFormDropdown(t, 'Output Mode', 'Simple');

  // Video Bitrate
  const videoBitrate = await app.client.getValue(
    // TODO: this selector is too brittle, but unfortunately we don't have control over this
    '.input-label + .input-body .number-input input',
  );
  t.is(parseInt(videoBitrate, 10), 2500);

  // Audio Bitrates dropdown
  const audioBitrates = (await app.client.execute(() => {
    return Array.from(document.querySelectorAll('div[data-name=ABitrate] ul li span span')).map(
      el => parseInt(el.textContent, 10),
    );
  })).value;

  t.deepEqual(audioBitrates, AUDIO_BITRATES, 'Audio bitrates do not match');

  // Test that we can switch encoders and all options are present
  for (const encoder of [
    'Hardware (NVENC)',
    'Hardware (NVENC) (new)',
    'Hardware (QSV)',
    'Software (x264)',
  ]) {
    // CI doesn't have hardware support
    if (process.env.CI && encoder.startsWith('Hardware')) {
      continue;
    }

    await t.notThrowsAsync(
      setFormDropdown(t, 'Encoder', encoder),
      `${encoder} was not found as an option`,
    );
  }

  // We can enable replay buffer
  await t.notThrowsAsync(async () => await app.client.click('label=Enable Replay Buffer'));
});
