import { test, TExecutionContext, useSpectron } from '../../helpers/spectron';
import { addSource } from '../../helpers/modules/sources';
import { logIn } from '../../helpers/modules/user';
import { click, focusChild, waitForDisplayed } from '../../helpers/modules/core';
import { TPlatform } from '../../../app/services/platforms';
import { logOut } from '../../helpers/spectron/user';
import { getApiClient } from '../../helpers/api-client';
import { CustomizationService } from '../../../app/services/customization';

useSpectron({
  restartAppAfterEachTest: false,
  clearCollectionAfterEachTest: true,
});

test('AlertBox for Twitch', t => testAlertbox(t, 'twitch'));
test('AlertBox for YouTube', t => testAlertbox(t, 'youtube'));

// TODO: something is wrong with FB test
// test('AlertBox for Facebook', t => testAlert(t, 'facebook'));

const commonAlerts = ['Donation', 'Merch'];

const platformAlerts = {
  twitch: [...commonAlerts, 'Follow', 'Twitch Cheer (Bits)', 'Twitch Host', 'Twitch Raid'],
  youtube: [...commonAlerts, 'Youtube Subscribers', 'YouTube Super Chat'],
  facebook: [
    ...commonAlerts,
    'Follow',
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
  await addSource('Alertbox', 'AlertBox', false);
  await focusChild();
  await waitForDisplayed('span=General Settings');

  // click through all available alert types and check for console errors
  const alerts = platformAlerts[platform];
  for (const alert of alerts) await click(`span*=${alert}`);

  await logOut(t);
  t.pass();
}

/**
 * Set the new alerbox UI as default
 */
async function enableNewAlertbox() {
  const api = await getApiClient();
  const customizationService = api.getResource<CustomizationService>('CustomizationService');
  customizationService.setSettings({ legacyAlertbox: false });
}
