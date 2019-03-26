import { focusChild, focusMain, test, useSpectron } from '../helpers/spectron';
import { addTrailingSpace, createOptionsAssertion } from '../helpers/spectron/assertions';
import { FormMonkey } from '../helpers/form-monkey';
import { setFormDropdown } from '../helpers/spectron/forms';

useSpectron();

test('Populates video settings', async t => {
  const form = new FormMonkey(t);
  const assertOptions = createOptionsAssertion(t, form);

  const { app } = t.context;

  await focusMain(t);
  await app.client.click('.top-nav .icon-settings');

  await focusChild(t);
  await app.client.click('li=Video');

  await assertOptions(
    '[data-name=ScaleType]',
    'Bicubic (Sharpened scaling, 16 samples)',
    [
      'Bilinear (Fastest, but blurry if scaling)',
      'Bicubic (Sharpened scaling, 16 samples)',
      'Lanczos (Sharpened scaling, 32 samples)',
    ].map(addTrailingSpace),
  );

  await assertOptions(
    '[data-name=FPSType]',
    'Common FPS Values',
    ['Common FPS Values', 'Integer FPS Value', 'Fractional FPS Value'].map(addTrailingSpace),
  );

  await assertOptions(
    '[data-name=FPSCommon]',
    '30',
    ['10', '20', '24 NTSC', '29.97', '30', '48', '59.94', '60'].map(addTrailingSpace),
  );

  // Only test resolution on CI, as this is hardware-specific
  if (process.env.CI) {
    for (const res of ['1024x768']) {
      await t.notThrowsAsync(
        setFormDropdown(t, 'Base (Canvas) Resolution', '1024x768'),
        `Resolution ${res} was not found`,
      );
    }
  }
});
