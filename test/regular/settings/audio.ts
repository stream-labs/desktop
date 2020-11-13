import {
  focusMain,
  test,
  useSpectron,
} from '../../helpers/spectron';
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
  t.true(await app.client.isExisting('label=Desktop Audio Device 1'));
  t.true(await app.client.isExisting('label=Desktop Audio Device 2'));

  t.true(await app.client.isExisting('label=Mic/Auxiliary Device 1'));
  t.true(await app.client.isExisting('label=Mic/Auxiliary Device 2'));
  t.true(await app.client.isExisting('label=Mic/Auxiliary Device 3'));

  // Test that we're displaying mixer settings in the footer
  await app.client.click('button=Done');
  await focusMain(t);
  t.true(await app.client.isExisting('.source-name=Desktop Audio'));
  t.true(await app.client.isExisting('.source-name*=Mic'));
  t.true(await app.client.isExisting('.volmeter-container'));
});
