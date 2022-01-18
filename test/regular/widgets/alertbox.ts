import { test, TExecutionContext, runWithSpectron } from '../../helpers/spectron';
import { addSource, openSourceProperties } from '../../helpers/modules/sources';
import { logIn } from '../../helpers/modules/user';
import {
  click,
  clickButton,
  focusChild,
  focusMain,
  waitForDisplayed,
} from '../../helpers/modules/core';
import { TPlatform } from '../../../app/services/platforms';
import { getApiClient } from '../../helpers/api-client';
import { CustomizationService } from '../../../app/services/customization';
import { assertFormContains, fillForm } from '../../helpers/modules/forms';
import { sleep } from '../../helpers/sleep';

runWithSpectron();

test('AlertBox for Twitch', t => testAlertbox(t, 'twitch'));
test('AlertBox for YouTube', t => testAlertbox(t, 'youtube'));
test('AlertBox for Facebook', t => testAlertbox(t, 'facebook'));

const commonAlerts = ['Donation', 'Merch'];

const platformAlerts = {
  twitch: [...commonAlerts, 'Follow', 'Cheer (Bits)', 'Host', 'Raid'],
  youtube: [...commonAlerts, 'YouTube Subscribers', 'YouTube Membership', 'YouTube Super Chat'],
  facebook: [
    ...commonAlerts,
    'Facebook Follow',
    'Facebook Support',
    'Facebook Like',
    'Facebook Stars',
    'Facebook Share',
  ],
};

async function testAlertbox(t: TExecutionContext, platform: TPlatform) {
  await logIn(platform);

  // create alertbox
  await enableNewAlertbox();
  await addSource('Alertbox', 'Alertbox', false);
  await openAlertboxSettings();

  // click through all available alert types and check for console errors
  const alerts = platformAlerts[platform];
  for (const alert of alerts) await click(`span*=${alert}`);

  // test the donation alert settings
  if (platform === 'twitch') await testDonationAlert();

  t.pass();
}

async function testDonationAlert() {
  // go to the Donation Settings
  await click('span*=Donation');

  // fill the form
  const formData1 = {
    message_template: 'Test {name} donated {amount}!',
    sound_volume: 30,
  };
  await fillForm(formData1);

  // wait for saving
  await sleep(3000);

  // close and re-open the window to load the settings from server again
  await clickButton('Close');
  await sleep(1000);
  await openAlertboxSettings();
  await click('span*=Donation');

  // check settings are successfully saved
  await assertFormContains(formData1);

  // repeat the test with another dataset
  const formData2 = {
    message_template: '{name} donated {amount}',
    sound_volume: 50,
  };
  await fillForm(formData2);
  await sleep(3000);
  await clickButton('Close');
  await sleep(1000);
  await openAlertboxSettings();
  await click('span*=Donation');
  await assertFormContains(formData2);
}

async function openAlertboxSettings() {
  await focusMain();
  await openSourceProperties('Alertbox');
  await focusChild();
  await waitForDisplayed('span=General Settings');
}

/**
 * Set the new alerbox UI as default
 */
async function enableNewAlertbox() {
  const api = await getApiClient();
  const customizationService = api.getResource<CustomizationService>('CustomizationService');
  customizationService.setSettings({ legacyAlertbox: false });
}
