import { useSpectron, test, focusChild, TExecutionContext, closeWindow } from '../../helpers/spectron';
import { getClient } from '../../helpers/api-client';
import { makeScreenshots, useScreentest } from '../screenshoter';
import { SettingsService } from '../../../app/services/settings';
import { logIn, logOut } from '../../helpers/spectron/user';
import { sleep } from '../../helpers/sleep';


useSpectron({ restartAppAfterEachTest: false });
useScreentest();

test('Settings General', async t => {
  const client = await getClient();
  const settingsService = client.getResource<SettingsService>('SettingsService');
  settingsService.showSettings();
  await focusChild(t);
  t.pass();
});

test('Settings Stream Offline', async t => {
  const client = await getClient();
  const settingsService = client.getResource<SettingsService>('SettingsService');
  settingsService.showSettings('Stream');
  await focusChild(t);
  t.pass();
});

test('Settings Stream Twitch', async (t: TExecutionContext) => {
  const client = await getClient();
  const settingsService = client.getResource<SettingsService>('SettingsService');
  await logIn(t, 'twitch');
  settingsService.showSettings('Stream');
  await focusChild(t);
  t.pass();
});

test('Settings Stream Youtube', async (t: TExecutionContext) => {
  const client = await getClient();
  const settingsService = client.getResource<SettingsService>('SettingsService');
  await logIn(t, 'youtube');
  settingsService.showSettings('Stream');
  await focusChild(t);
  t.pass();
});

test('Settings Stream Facebook', async (t: TExecutionContext) => {
  const client = await getClient();
  const settingsService = client.getResource<SettingsService>('SettingsService');
  await logIn(t, 'facebook');
  settingsService.showSettings('Stream');
  await focusChild(t);
  t.pass();
});

test('Settings Output', async t => {
  const client = await getClient();
  const settingsService = client.getResource<SettingsService>('SettingsService');
  settingsService.showSettings('Output');
  await focusChild(t);
  t.pass();
});

test('Settings Video', async t => {
  const client = await getClient();
  const settingsService = client.getResource<SettingsService>('SettingsService');
  settingsService.showSettings('Video');
  await focusChild(t);
  t.pass();
});

test('Settings Hotkeys', async t => {
  const client = await getClient();
  const settingsService = client.getResource<SettingsService>('SettingsService');
  settingsService.showSettings('Hotkeys');
  await focusChild(t);
  t.pass();
});

test('Settings Scene Collections', async t => {
  const client = await getClient();
  const settingsService = client.getResource<SettingsService>('SettingsService');
  settingsService.showSettings('Scene Collections');
  await focusChild(t);
  t.pass();
});

test('Settings Notifications', async t => {
  const client = await getClient();
  const settingsService = client.getResource<SettingsService>('SettingsService');
  settingsService.showSettings('Notifications');
  await focusChild(t);
  t.pass();
});

test('Settings Appearance', async t => {
  const client = await getClient();
  const settingsService = client.getResource<SettingsService>('SettingsService');
  await sleep(1000);
  settingsService.showSettings('Appearance');
  await focusChild(t);
  t.pass();
});

test('Settings Game Overlay', async (t: TExecutionContext) => {
  const client = await getClient();
  const settingsService = client.getResource<SettingsService>('SettingsService');

  // take offline screenshot
  settingsService.showSettings('Game Overlay');
  await focusChild(t);
  await makeScreenshots(t, 'Offline');
  await closeWindow(t);

  // take online screenshot
  await logIn(t);
  settingsService.showSettings('Game Overlay');
  await focusChild(t);
  await (await t.context.app.client.$('[data-type="toggle"]')).click(); // enable overlays
  await makeScreenshots(t, 'Online');
  await logOut(t);

  t.pass();
});
