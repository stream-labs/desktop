import { restartApp, test, TExecutionContext, useWebdriver } from '../../helpers/webdriver';
import { focusChild, focusMain } from '../../helpers/modules/core';

useWebdriver();

test('Populates essential hotkeys for them to be bound', async t => {
  const { app } = t.context;

  await focusMain();
  await (await app.client.$('.side-nav .icon-settings')).click();

  await focusChild();

  await (await app.client.$('li=Hotkeys')).click();
  await (await app.client.$('h2=Mic/Aux')).click();

  for (const hotkey of [
    'Start Streaming',
    'Stop Streaming',
    'Start Recording',
    'Stop Recording',
    'Enable Studio Mode',
    'Disable Studio Mode',
    'Transition (Studio Mode)',
    'Save Replay',
    'Mute',
    'Unmute',
    'Push to Mute',
    'Push to Talk',
  ]) {
    const hotkeyLabel = await app.client.$(`label=${hotkey}`);

    await t.true(await hotkeyLabel.isExisting(), `Hotkey for ${hotkey} was not found`);
  }
});

test('Binds a hotkey', async t => {
  const { app } = t.context;

  // Control+B
  const BINDING = '\uE009b';

  await openHotkeySettings(t);

  const bindingEl = async (root = app) =>
    await root.client.$('[data-testid=Start_Recording] [data-name=binding]');

  const getBinding = async (root = app) => (await bindingEl(root)).getValue();

  const doneButton = app.client.$('button=Done');

  // Bind a hotkey to Start Recording
  await bindingEl().then(el => el.click());

  await app.client.keys(BINDING);
  await doneButton.click();

  // Check that the binding persisted
  await openHotkeySettings(t);
  let binding = await getBinding();

  // New hotkey bind inputs have a suffix for re-binding
  const expectedBinding = 'Ctrl+B (Click to re-bind)';
  //
  t.is(binding, expectedBinding);

  // check hotkey exists after restart
  const restartedApp = await restartApp(t);
  await openHotkeySettings(t);

  binding = await getBinding(restartedApp);
  t.is(binding, expectedBinding);
});

const openHotkeySettings = async (t: TExecutionContext) => {
  const { app } = t.context;
  await focusMain();
  await (await app.client.$('.side-nav .icon-settings')).click();

  await focusChild();

  // Wait for hotkeys to populate
  await (await app.client.$('li=Hotkeys')).click();
  const startStreamingHotkey = await app.client.$('[data-testid=Start_Streaming]');
  await startStreamingHotkey.waitForExist();
};
