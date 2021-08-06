import { useSpectron, test, TExecutionContext } from '../../helpers/spectron';
import { getApiClient } from '../../helpers/api-client';
import { makeScreenshots, useScreentest } from '../screenshoter';
import { SettingsService } from '../../../app/services/settings';
import { logIn, logOut } from '../../helpers/spectron/user';
import { sleep } from '../../helpers/sleep';
import {closeWindow, focusChild} from "../../helpers/modules/core";


useSpectron({ restartAppAfterEachTest: false });
useScreentest();

test('Settings General', async t => {
  const client = await getApiClient();
  const settingsService = client.getResource<SettingsService>('SettingsService');
  settingsService.showSettings();
  await focusChild();
  t.pass();
});

test('Settings Stream Offline', async t => {
  const client = await getApiClient();
  const settingsService = client.getResource<SettingsService>('SettingsService');
  settingsService.showSettings('Stream');
  await focusChild();
  t.pass();
});

test('Settings Stream Twitch', async (t: TExecutionContext) => {
  const client = await getApiClient();
  const settingsService = client.getResource<SettingsService>('SettingsService');
  await logIn(t, 'twitch');
  settingsService.showSettings('Stream');
  await focusChild();
  t.pass();
});

test('Settings Stream Youtube', async (t: TExecutionContext) => {
  const client = await getApiClient();
  const settingsService = client.getResource<SettingsService>('SettingsService');
  await logIn(t, 'youtube');
  settingsService.showSettings('Stream');
  await focusChild();
  t.pass();
});

test('Settings Stream Facebook', async (t: TExecutionContext) => {
  const client = await getApiClient();
  const settingsService = client.getResource<SettingsService>('SettingsService');
  await logIn(t, 'facebook');
  settingsService.showSettings('Stream');
  await focusChild();
  t.pass();
});

test('Settings Output', async t => {
  const client = await getApiClient();
  const settingsService = client.getResource<SettingsService>('SettingsService');
  settingsService.showSettings('Output');
  await focusChild();
  t.pass();
});

test('Settings Video', async t => {
  const client = await getApiClient();
  const settingsService = client.getResource<SettingsService>('SettingsService');
  settingsService.showSettings('Video');
  await focusChild();
  t.pass();
});

test('Settings Hotkeys', async t => {
  const client = await getApiClient();
  const settingsService = client.getResource<SettingsService>('SettingsService');
  settingsService.showSettings('Hotkeys');
  await focusChild();
  t.pass();
});

test('Settings Scene Collections', async t => {
  const client = await getApiClient();
  const settingsService = client.getResource<SettingsService>('SettingsService');
  settingsService.showSettings('Scene Collections');
  await focusChild();
  t.pass();
});

test('Settings Notifications', async t => {
  const client = await getApiClient();
  const settingsService = client.getResource<SettingsService>('SettingsService');
  settingsService.showSettings('Notifications');
  await focusChild();
  t.pass();
});

test('Settings Appearance', async t => {
  const client = await getApiClient();
  const settingsService = client.getResource<SettingsService>('SettingsService');
  await sleep(1000);
  settingsService.showSettings('Appearance');
  await focusChild();
  t.pass();
});

test('Settings Game Overlay', async (t: TExecutionContext) => {
  const client = await getApiClient();
  const settingsService = client.getResource<SettingsService>('SettingsService');

  // take offline screenshot
  settingsService.showSettings('Game Overlay');
  await focusChild();
  await makeScreenshots(t, 'Offline');
  await closeWindow('child');

  // take online screenshot
  await logIn(t);
  settingsService.showSettings('Game Overlay');
  await focusChild();
  await (await t.context.app.client.$('[data-type="toggle"]')).click(); // enable overlays
  await makeScreenshots(t, 'Online');
  await logOut(t);

  t.pass();
});
