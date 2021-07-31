import { test, useSpectron } from '../../helpers/spectron';
import { FormMonkey } from '../../helpers/form-monkey';
import { assertOptions } from '../../helpers/spectron/assertions';
import { getFormCheckbox, getFormInput } from '../../helpers/spectron/forms';
import { showSettingsWindow } from '../../helpers/modules/settings/settings';

useSpectron();

test('Populates advanced settings', async t => {
  await showSettingsWindow('Advanced');

  // Process Priority
  await assertOptions(t, 'ProcessPriority', 'Normal', [
    'High',
    'Above Normal',
    'Normal',
    'Below Normal',
    'Idle',
  ]);

  // Color Profile
  await assertOptions(t, 'ColorFormat', 'NV12', ['NV12', 'I420', 'I444', 'RGB']);

  // YUV Color Space
  await assertOptions(t, 'ColorSpace', '601', ['601', '709']);

  // YUV Color Range
  await assertOptions(t, 'ColorRange', 'Partial', ['Partial', 'Full']);

  // Force GPU as render device should be checked by default
  t.true(await getFormCheckbox(t, 'Force GPU as render device'));

  // Disable Windows audio ducking should be unchecked
  t.false(await getFormCheckbox(t, 'Disable Windows audio ducking'));

  // Recording
  t.is('%CCYY-%MM-%DD %hh-%mm-%ss', await getFormInput(t, 'Filename Formatting'));
  t.false(await getFormCheckbox(t, 'Overwrite if file exists'));

  // Replay Buffer
  t.is('Replay', await getFormInput(t, 'Replay Buffer Filename Prefix'));
  t.is('', await getFormInput(t, 'Replay Buffer Filename Suffix'));

  // Stream Delay
  t.false(await getFormCheckbox(t, 'Enable'));
  t.is('20', await getFormInput(t, 'Duration (seconds)'));
  t.true(await getFormCheckbox(t, 'Preserved cutoff point (increase delay) when reconnecting'));

  // Automatically reconnect
  t.true(await getFormCheckbox(t, 'Enable', 1));
  t.is('10', await getFormInput(t, 'Retry Delay (seconds)'));
  t.is('20', await getFormInput(t, 'Maximum Retries'));

  // Browser Source hardware acceleration should be enabled by default
  t.true(
    await getFormCheckbox(t, 'Enable Browser Source Hardware Acceleration (requires a restart)'),
  );
});
