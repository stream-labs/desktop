import { test, useSpectron } from '../../helpers/spectron';
import { assertOptions } from '../../helpers/spectron/assertions';
import { showSettingsWindow } from '../../helpers/modules/settings/settings';

useSpectron();

test('Populates video settings', async t => {
  await showSettingsWindow('Video');

  await assertOptions(t, 'ScaleType', 'Bicubic (Sharpened scaling, 16 samples)', [
    'Bilinear (Fastest, but blurry if scaling)',
    'Bicubic (Sharpened scaling, 16 samples)',
    'Lanczos (Sharpened scaling, 32 samples)',
  ]);

  await assertOptions(t, 'FPSType', 'Common FPS Values', [
    'Common FPS Values',
    'Integer FPS Value',
    'Fractional FPS Value',
  ]);

  await assertOptions(t, 'FPSCommon', '30', [
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
