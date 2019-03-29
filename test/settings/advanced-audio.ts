import {
  closeWindow,
  focusChild,
  focusMain,
  test,
  TExecutionContext,
  useSpectron,
} from '../helpers/spectron';
import { FormMonkey } from '../helpers/form-monkey';

useSpectron();

async function clickAdvancedAudio(t: TExecutionContext) {
  await t.context.app.client
    .$('h2=Mixer')
    .$('..')
    .click('.icon-settings');
}

const DEFAULT_SOURCE_SETTINGS = {
  deflection: 100,
  forceMono: false,
  syncOffset: 0,
  monitoringType: '0',
  flag0: true,
  flag1: true,
  flag2: true,
  flag3: true,
  flag4: true,
  flag5: true,
};

test('Change Advanced Audio Settings', async t => {
  await clickAdvancedAudio(t);
  await focusChild(t);
  const desktopAudioForm = new FormMonkey(t, 'tr[name="Desktop Audio"]');
  const micAuxForm = new FormMonkey(t, 'tr[name="Mic/Aux"]');

  // check default settings
  t.true(await desktopAudioForm.includes(DEFAULT_SOURCE_SETTINGS));
  t.true(await micAuxForm.includes(DEFAULT_SOURCE_SETTINGS));

  // update settings
  const updatedSettings = {
    deflection: 50,
    forceMono: true,
    syncOffset: 1000,
    monitoringType: '1',
    flag0: false,
    flag1: false,
    flag2: false,
    flag3: false,
    flag4: false,
    flag5: false,
  };
  await desktopAudioForm.fill(updatedSettings);
  await micAuxForm.fill(updatedSettings);

  // check settings are still updated after window close
  await closeWindow(t);
  await focusMain(t);
  await clickAdvancedAudio(t);
  await focusChild(t);
  t.true(await desktopAudioForm.includes(updatedSettings));
  t.true(await micAuxForm.includes(updatedSettings));

  t.pass();
});
