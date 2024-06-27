import { getContext } from '../webdriver/index.mjs';
import { TPlatform } from '../../../app/services/platforms/index.js';
import { ITestUserFeatures, logIn as userLogin } from '../webdriver/user.mjs';

export function logIn(
  platform: TPlatform = 'twitch',
  features?: ITestUserFeatures, // if not set, pick a random user's account from user-pool
  waitForUI = true,
  isOnboardingTest = false,
) {
  return userLogin(getContext(), platform, features, waitForUI, isOnboardingTest);
}
