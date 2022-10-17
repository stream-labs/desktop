import { test, useSpectron } from '../../helpers/spectron';
import { useForm } from '../../helpers/modules/forms/form';
import { showSettingsWindow } from '../../helpers/modules/settings/settings';

useSpectron();

test('Populates video settings', async t => {
  await showSettingsWindow('Video');

  const { assertInputOptions } = useForm();

  await t.notThrowsAsync(async () => {
    await assertInputOptions('scaleType', 'Bicubic (Sharpened scaling, 16 samples)', [
      'Bilinear (Fastest, but blurry if scaling)',
      'Bicubic (Sharpened scaling, 16 samples)',
      'Lanczos (Sharpened scaling, 32 samples)',
    ]);

    await assertInputOptions('fpsType', 'Common FPS Values', [
      'Common FPS Values',
      'Integer FPS Values',
      'Fractional FPS Values',
    ]);

    await assertInputOptions('fpsCom', '30', [
      '10',
      '20',
      '24 NTSC',
      '29.97',
      '30',
      '48',
      '59.94',
      '60',
    ]);
  });
});
