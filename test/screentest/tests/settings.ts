import { useSpectron, test, focusChild, TExecutionContext, closeWindow } from '../../helpers/spectron';
import { getClient } from '../../helpers/api-client';
import { makeScreenshots, useScreentest } from '../screenshoter';
import { ISettingsServiceApi } from '../../../app/services/settings';
import { logIn, logOut } from '../../helpers/spectron/user';

useSpectron({ restartAppAfterEachTest: false });
useScreentest();

test('Settings General', async t => {
  const client = await getClient();
  const settingsService = client.getResource<ISettingsServiceApi>('SettingsService');
  settingsService.showSettings();
  await focusChild(t);
  t.pass();
});

test('Settings Stream', async t => {
  const client = await getClient();
  const settingsService = client.getResource<ISettingsServiceApi>('SettingsService');
  settingsService.showSettings('Stream');
  await focusChild(t);
  t.pass();
});

test('Settings Output', async t => {
  const client = await getClient();
  const settingsService = client.getResource<ISettingsServiceApi>('SettingsService');
  settingsService.showSettings('Output');
  await focusChild(t);
  t.pass();
});

test('Settings Video', async t => {
  const client = await getClient();
  const settingsService = client.getResource<ISettingsServiceApi>('SettingsService');
  settingsService.showSettings('Video');
  await focusChild(t);
  t.pass();
});

test('Settings Hotkeys', async t => {
  const client = await getClient();
  const settingsService = client.getResource<ISettingsServiceApi>('SettingsService');
  settingsService.showSettings('Hotkeys');
  await focusChild(t);
  t.pass();
});

test('Settings Game Overlay', async (t: TExecutionContext) => {
  const client = await getClient();
  const settingsService = client.getResource<ISettingsServiceApi>('SettingsService');

  // take offline screenshot
  settingsService.showSettings('Game Overlay');
  await focusChild(t);
  await makeScreenshots(t, 'Offline');
  await closeWindow(t);

  // take online screenshot
  await logIn(t);
  settingsService.showSettings('Game Overlay');
  await focusChild(t);
  await t.context.app.client.click('[data-type="toggle"]'); // enable overlays
  await makeScreenshots(t, 'Online');
  await logOut(t);

  t.pass();
});

test('Settings Scene Collections', async t => {
  const client = await getClient();
  const settingsService = client.getResource<ISettingsServiceApi>('SettingsService');
  settingsService.showSettings('Scene Collections');
  await focusChild(t);
  t.pass();
});

test('Settings Notifications', async t => {
  const client = await getClient();
  const settingsService = client.getResource<ISettingsServiceApi>('SettingsService');
  settingsService.showSettings('Notifications');
  await focusChild(t);
  t.pass();
});

test('Settings Appearance', async t => {
  const client = await getClient();
  const settingsService = client.getResource<ISettingsServiceApi>('SettingsService');
  settingsService.showSettings('Appearance');
  await focusChild(t);
  t.pass();
});
