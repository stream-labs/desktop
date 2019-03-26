import { focusChild, focusMain, test, useSpectron } from '../helpers/spectron';
import { FormMonkey } from '../helpers/form-monkey';
import { addTrailingSpace, createOptionsAssertion } from '../helpers/spectron/assertions';
import { getFormCheckbox, getFormInput } from '../helpers/spectron/forms';

useSpectron();

test('Populates advanced settings', async t => {
  const { app } = t.context;
  const form = new FormMonkey(t);
  const assertOptions = createOptionsAssertion(t, form);

  await focusMain(t);
  await app.client.click('.top-nav .icon-settings');

  await focusChild(t);
  await app.client.click('li=Advanced');

  // Process Priority
  await assertOptions(
    '[data-name=ProcessPriority]',
    'Normal',
    ['High', 'Above Normal', 'Normal', 'Below Normal', 'Idle'].map(addTrailingSpace),
  );

  // Color Profile
  await assertOptions(
    '[data-name=ColorFormat]',
    'NV12',
    ['NV12', 'I420', 'I444', 'RGB'].map(addTrailingSpace),
  );

  // YUV Color Space
  await assertOptions('[data-name=ColorSpace]', '601', ['601', '709'].map(addTrailingSpace));

  // YUV Color Range
  await assertOptions(
    '[data-name=ColorRange]',
    'Partial',
    ['Partial', 'Full'].map(addTrailingSpace),
  );

  // Force GPU as render device should be checked by default
  t.true(await getFormCheckbox(t, 'Force GPU as render device'));

  if (process.env.CI) {
    // Audio Monitoring Device
    await assertOptions(
      '[data-name=MonitoringDeviceName]',
      'Default',
      ['Default'].map(addTrailingSpace),
    );
  }

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
