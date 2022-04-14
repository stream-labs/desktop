import React from 'react';
import styles from './Connect.m.less';
import commonStyles from './Common.m.less';
import { $t } from 'services/i18n';
import { Services } from 'components-react/service-provider';
import { useModule } from 'components-react/hooks/useModule';
import { mutation } from 'components-react/store';
import { ExtraPlatformConnect } from './ExtraPlatformConnect';
import { EPlatformCallResult, TPlatform } from 'services/platforms';
import cx from 'classnames';
import * as remote from '@electron/remote';
import { OnboardingModule } from './Onboarding';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import { EAuthProcessState } from 'services/user';
import { ListInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';

export function Connect() {
  const {
    isRelog,
    selectedExtraPlatform,
    loading,
    authInProgress,
    authPlatform,
    setExtraPlatform,
  } = useModule(LoginModule).select();
  const { next } = useModule(OnboardingModule).select();
  const { UsageStatisticsService } = Services;

  if (selectedExtraPlatform) {
    return <ExtraPlatformConnect />;
  }

  function onSkip() {
    if (loading || authInProgress) return;
    next();
  }

  function onSelectExtraPlatform(val: TExtraPlatform | 'tiktok' | undefined) {
    if (val === 'tiktok') {
      authPlatform('tiktok', next);
      return;
    }

    UsageStatisticsService.recordAnalyticsEvent('PlatformLogin', val);
    setExtraPlatform(val);
  }

  const platforms = ['twitch', 'youtube', 'facebook', 'trovo'];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.container}>
        <h1 className={commonStyles.titleContainer}>{$t('Connect')}</h1>
        {!isRelog && (
          <p style={{ marginBottom: 80 }}>
            {$t('Sign in with your streaming account to get started with Streamlabs')}
          </p>
        )}
        {isRelog && (
          <h3 style={{ marginBottom: '16px' }}>
            Your login has expired. Please re-login to continue using Streamlabs
          </h3>
        )}
        <div className={styles.signupButtons}>
          {platforms.map((platform: TPlatform) => (
            <button
              className={cx(`button button--${platform}`, styles.loginButton)}
              disabled={loading || authInProgress}
              onClick={() => authPlatform(platform, next)}
              key={platform}
            >
              {loading && <i className="fas fa-spinner fa-spin" />}
              {!loading && (
                <PlatformLogo
                  platform={platform}
                  size="medium"
                  color={platform === 'trovo' ? 'black' : 'white'}
                />
              )}
            </button>
          ))}
        </div>
        <p className={styles['select-another']}> {$t('or select another platform')} </p>
        <Form layout="inline" style={{ width: 300 }}>
          <ListInput
            style={{ width: '100%' }}
            placeholder={$t('Select platform')}
            onChange={onSelectExtraPlatform}
            allowClear={true}
            value={selectedExtraPlatform}
            hasImage={true}
            options={[
              {
                value: 'tiktok',
                label: 'TikTok',
                image:
                  'data:image/png;base64,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',
              },
              {
                value: 'dlive',
                label: 'Dlive',
                image: require('../../../../media/images/platforms/dlive-logo-small.png'),
              },
              {
                value: 'nimotv',
                label: 'NimoTV',
                image: require('../../../../media/images/platforms/nimo-logo-small.png'),
              },
            ]}
          />
        </Form>
        <p>
          <br />
          <span className={styles['link-button']} onClick={onSkip}>
            {$t('Skip')}
          </span>
        </p>
      </div>
    </div>
  );
}

type TExtraPlatform = 'nimotv' | 'dlive';

export class LoginModule {
  state = {
    selectedExtraPlatform: undefined as TExtraPlatform | undefined,
  };

  get UserService() {
    return Services.UserService;
  }

  get UsageStatisticsService() {
    return Services.UsageStatisticsService;
  }

  get isRelog() {
    return this.UserService.state.isRelog;
  }

  get loading() {
    return this.UserService.state.authProcessState === EAuthProcessState.Loading;
  }

  get authInProgress() {
    return this.UserService.state.authProcessState === EAuthProcessState.InProgress;
  }

  async authPlatform(platform: TPlatform, onSuccess: () => void) {
    this.UsageStatisticsService.recordAnalyticsEvent('PlatformLogin', platform);
    const result = await this.UserService.startAuth(
      platform,
      platform === 'youtube' ? 'external' : 'internal',
    );

    if (result === EPlatformCallResult.TwitchTwoFactor) {
      remote.dialog
        .showMessageBox({
          type: 'error',
          message: $t(
            'Twitch requires two factor authentication to be enabled on your account in order to stream to Twitch. ' +
              'Please enable two factor authentication and try again.',
          ),
          title: $t('Twitch Authentication Error'),
          buttons: [$t('Enable Two Factor Authentication'), $t('Dismiss')],
        })
        .then(({ response }) => {
          if (response === 0) {
            remote.shell.openExternal('https://twitch.tv/settings/security');
          }
        });
    } else {
      // Currently we do not have special handling for generic errors
      onSuccess();
    }
  }

  @mutation()
  setExtraPlatform(val: TExtraPlatform | undefined) {
    this.state.selectedExtraPlatform = val;
  }
}
