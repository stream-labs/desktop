import { test, TExecutionContext, useSpectron } from '../../helpers/spectron';
import { showSettingsWindow } from '../../helpers/modules/settings/settings';
import { useForm } from '../../helpers/modules/forms';
import { ListInputController } from '../../helpers/modules/forms/list';

useSpectron();

export async function assertOptions(
  t: TExecutionContext,
  inputName: string,
  expectedValue: string,
  expectedOptions: string[],
) {
  const form = useForm();
  const scaleTypeInput = await form.getInput<ListInputController<string>>(inputName);
  const options = (await scaleTypeInput.getOptions()).map(opt => opt.label);
  const value = await scaleTypeInput.getDisplayValue();

  t.is(value, expectedValue);
  t.deepEqual(options, expectedOptions);
}

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
