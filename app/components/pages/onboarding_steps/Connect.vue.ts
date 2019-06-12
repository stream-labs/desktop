import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { UserService } from 'services/user';
import { TPlatform, EPlatformCallResult } from 'services/platforms';
import { Inject } from 'services/core/injector';
import { OnboardingService } from 'services/onboarding';
import electron from 'electron';
import { $t } from 'services/i18n';

@Component({})
export default class Connect extends Vue {
  @Inject() userService: UserService;
  @Inject() onboardingService: OnboardingService;

  loadingState = false;

  authPlatform(platform: TPlatform) {
    this.loadingState = true;
    this.userService.startAuth(
      platform,
      () => {
        this.loadingState = false;
      },
      () => {
        this.loadingState = true;
      },
      result => {
        // Currently we do not have special handling for generic errors
        if (result === EPlatformCallResult.Success || result === EPlatformCallResult.Error) {
          this.onboardingService.next();
        } else if (result === EPlatformCallResult.TwitchTwoFactor) {
          this.loadingState = false;
          electron.remote.dialog.showMessageBox(
            {
              type: 'error',
              message: $t(
                'Twitch requires two factor authentication to be enabled ' +
                  'on your account in order to stream to Twitch. Please enable two ' +
                  'factor authentication and try again.',
              ),
              title: $t('Twitch Authentication Error'),
              buttons: [$t('Dismiss'), $t('Enable Two Factor Authentication')],
            },
            buttonIndex => {
              if (buttonIndex === 1) {
                electron.remote.shell.openExternal('https://twitch.tv/settings/security');
              }
            },
          );
        }
      },
    );
  }

  iconForPlatform(platform: TPlatform) {
    if (this.loadingState) return 'fas fa-spinner fa-spin';

    return {
      twitch: 'fab fa-twitch',
      youtube: 'fab fa-youtube',
      mixer: 'fas fa-times',
      facebook: 'fab fa-facebook',
    }[platform];
  }

  skipOnboarding() {
    this.onboardingService.skip();
  }

  get isSecurityUpgrade() {
    return this.onboardingService.options.isSecurityUpgrade;
  }

  contactSupport() {
    electron.remote.shell.openExternal('https://support.streamlabs.com');
  }
}
