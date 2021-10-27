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
