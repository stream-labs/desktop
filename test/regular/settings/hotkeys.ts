import {
  focusChild,
  focusMain,
  restartApp,
  test,
  TExecutionContext,
  useSpectron,
} from '../../helpers/spectron';

useSpectron();

test('Populates essential hotkeys for them to be bound', async t => {
  const { app } = t.context;

  await focusMain(t);
  await (await app.client.$('.side-nav .icon-settings')).click();

  await focusChild(t);

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
    await t.true(
      await (await app.client.$(`.Hotkey-description=${hotkey}`)).isExisting(),
      `Hotkey for ${hotkey} was not found`,
    );
  }
});

test('Binds a hotkey', async t => {
  const { app } = t.context;

  // Control+B
  const BINDING = '\uE009b';

  await openHotkeySettings(t);

  // Bind a hotkey to Start Recording
  await (await app.client.$('.hotkey[data-test-id=Start_Recording] .Hotkey-bindings')).click();
  await app.client.keys(BINDING);
  await (await app.client.$('button=Done')).click();

  // Check that the binding persisted
  await openHotkeySettings(t);
  let binding = await (
    await app.client.$('.hotkey[data-test-id=Start_Recording] .Hotkey-input')
  ).getValue();
  t.is(binding, 'Ctrl+B');

  // check hotkey exists after restart
  const restartedApp = await restartApp(t);
  await openHotkeySettings(t);

  binding = await (
    await restartedApp.client.$('.hotkey[data-test-id=Start_Recording] .Hotkey-input')
  ).getValue();
  t.is(binding, 'Ctrl+B');
});

const openHotkeySettings = async (t: TExecutionContext) => {
  const { app } = t.context;
  await focusMain(t);
  await (await app.client.$('.side-nav .icon-settings')).click();

  await focusChild(t);

  // Wait for hotkeys to populate
  await (await app.client.$('li=Hotkeys')).click();
  await (await app.client.$('.hotkey')).waitForExist();
};
