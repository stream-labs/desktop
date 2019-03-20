import { focusChild, focusMain, test, TExecutionContext, useSpectron } from '../helpers/spectron';
import { getDropdownOptions, setFormDropdown } from '../helpers/spectron/forms';
import { sleep } from '../helpers/sleep';
import { FormMonkey } from '../helpers/form-monkey';
import { addTrailingSpace, createOptionsAssertion } from '../helpers/spectron/assertions';

useSpectron();

test('Populates audio settings', async t => {
  const { app } = t.context;
  const form = new FormMonkey(t);
  const assertOptions = createOptionsAssertion(t, form);

  await focusMain(t);
  await app.client.click('.top-nav .icon-settings');

  await focusChild(t);
  await app.client.click('li=Audio');

  await assertOptions(
    '[data-name=SampleRate]',
    '44.1khz',
    ['44.1khz', '48khz'].map(addTrailingSpace),
  );

  await assertOptions(
    '[data-name=ChannelSetup]',
    'Stereo',
    ['Mono', 'Stereo', '2.1', '4.0', '4.1', '5.1', '7.1'].map(addTrailingSpace),
  );

  /*
   * Since this is hardware-specific (and devices look disabled on AppVeyor), all we can test is
   * that we have two audio devices and 3 mic/aux.
   */
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

