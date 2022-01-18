import { test, runWithSpectron } from '../../helpers/spectron';
import { setFormDropdown } from '../../helpers/spectron/forms';
import { focusChild, focusMain } from '../../helpers/modules/core';

runWithSpectron();

test('Populates simple output mode settings', async t => {
  const { app } = t.context;

  await focusMain();
  await (await app.client.$('.side-nav .icon-settings')).click();

  await focusChild();
  await (await app.client.$('li=Output')).click();

  await setFormDropdown('Output Mode', 'Simple');

  // Video Bitrate
  const videoBitrate = await (
    await app.client.$(
      // TODO: this selector is too brittle, but unfortunately we don't have control over this
      '.input-label + .input-body .number-input input',
    )
  ).getValue();
  t.is(parseInt(videoBitrate, 10), 2500);

  // Audio Bitrates dropdown
  const audioBitrates = await app.client.execute(() => {
    return Array.from(
      document.querySelectorAll('div[data-name=ABitrate] ul li span span'),
    ).map(el => parseInt(el.textContent, 10));
  });

  t.true(audioBitrates.length > 0, 'Audio bitrates exists');

  // Test that we can switch encoders and all options are present
  for (const encoder of [
    'Software (x264)', // CI doesn't have hardware support
  ]) {
    await t.notThrowsAsync(
      setFormDropdown('Encoder', encoder),
      `${encoder} was not found as an option`,
    );
  }

  // We can enable replay buffer
  await t.notThrowsAsync(
    async () => await (await app.client.$('label=Enable Replay Buffer')).click(),
  );
});
