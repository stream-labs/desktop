import { focusMain, test, useSpectron } from '../../helpers/spectron';
import { assertOptions } from '../../helpers/spectron/assertions';
import { showSettings } from '../../helpers/spectron/settings';

useSpectron();

test('Populates audio settings', async t => {
  await showSettings(t, 'Audio');

  await assertOptions(t, 'SampleRate', '44.1khz', ['44.1khz', '48khz']);

  await assertOptions(t, 'ChannelSetup', 'Stereo', [
    'Mono',
    'Stereo',
    '2.1',
    '4.0',
    '4.1',
    '5.1',
    '7.1',
  ]);

  /*
   * Since this is hardware-specific (and devices look disabled on AppVeyor), all we can test is
   * that we have two audio devices and 3 mic/aux.
   */
  const { app } = t.context;
  t.true(await (await app.client.$('label=Desktop Audio Device 1')).isExisting());
  t.true(await (await app.client.$('label=Desktop Audio Device 2')).isExisting());

  t.true(await (await app.client.$('label=Mic/Auxiliary Device 1')).isExisting());
  t.true(await (await app.client.$('label=Mic/Auxiliary Device 2')).isExisting());
  t.true(await (await app.client.$('label=Mic/Auxiliary Device 3')).isExisting());

  // Test that we're displaying mixer settings in the footer
  await (await app.client.$('button=Done')).click();
  await focusMain(t);
  t.true(await (await app.client.$('.source-name=Desktop Audio')).isExisting());
  t.true(await (await app.client.$('.source-name*=Mic')).isExisting());
  t.true(await (await app.client.$('.volmeter-container')).isExisting());
});
