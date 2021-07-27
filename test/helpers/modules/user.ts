import { getContext } from '../spectron';
import { TPlatform } from '../../../app/services/platforms';
import { ITestUserFeatures, logIn as userLogin } from '../spectron/user';

export function logIn(
  platform: TPlatform = 'twitch',
  features?: ITestUserFeatures, // if not set, pick a random user's account from user-pool
  waitForUI = true,
  isOnboardingTest = false,
) {
  return userLogin(getContext(), platform, features, waitForUI, isOnboardingTest);
}
