import {
  focusChild,
  focusMain,
  restartApp,
  test,
  TExecutionContext,
  useSpectron
} from '../helpers/spectron';

useSpectron();

test('Populates essential hotkeys for them to be bound', async t => {
  const { app } = t.context;

  await focusMain(t);
  await app.client.click('.top-nav .icon-settings');

  await focusChild(t);

  await app.client.click('li=Hotkeys');

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
    'Push to Talk'
  ]) {
    await t.true(
      await app.client.isExisting(`.Hotkey-description=${hotkey}`),
      `Hotkey for ${hotkey} was not found`
    );
  }
});

test('Binds a hotkey', async t => {
  const { app } = t.context;

  // Control+B
  const BINDING = '\uE009b';

  await openHotkeySettings(t);

  // Bind a hotkey to Start Recording
  await app.client.click('.hotkey[data-test-id=Start_Recording] .Hotkey-bindings');
  // @ts-ignore keys is a valid method, just not typed
  await app.client.keys(BINDING);
  await app.client.click('button=Done');

  // Check that the binding persisted
  await openHotkeySettings(t);
  let binding = await app.client.getValue('.hotkey[data-test-id=Start_Recording] .Hotkey-input');
  t.is(binding, 'Ctrl+B');

  // check hotkey exists after restart
  await restartApp(t);
  await openHotkeySettings(t);
  binding = await app.client.getValue('.hotkey[data-test-id=Start_Recording] .Hotkey-input');
  t.is(binding, 'Ctrl+B');
});


const openHotkeySettings = async (t: TExecutionContext) => {
  const { app } = t.context;
  await focusMain(t);
  await app.client.click('.top-nav .icon-settings');

  await focusChild(t);

  // Wait for hotkeys to populate
  await app.client.click('li=Hotkeys');
  await app.client.waitForExist('.hotkey');
};
