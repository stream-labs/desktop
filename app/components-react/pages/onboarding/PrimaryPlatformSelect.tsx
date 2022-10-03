import React, { useState } from 'react';
import { TPlatform } from 'services/platforms';
import { useModule } from 'slap';
import { LoginModule } from './Connect';
import styles from './Connect.m.less';
import { OnboardingModule } from './Onboarding';
import cx from 'classnames';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import commonStyles from './Common.m.less';
import { $t } from 'services/i18n';
import { confirmAsync } from 'components-react/modals';
import Form from 'components-react/shared/inputs/Form';
import { ListInput } from 'components-react/shared/inputs';

export function PrimaryPlatformSelect() {
  const { next } = useModule(OnboardingModule);
  const { isPartialSLAuth, loading, authInProgress, authPlatform } = useModule(LoginModule);

  const platforms = ['twitch', 'youtube', 'facebook', 'trovo'];

  // TODO
  const [selectedPlatform, setSelectedPlatform] = useState('twitch');

  // TODO: Filter
  const platformOptions = [
    {
      value: 'twitch',
      label: 'Twitch',
      image: <PlatformLogo platform="twitch" />,
    },
    {
      value: 'youtube',
      label: 'YouTube',
      image: <PlatformLogo platform="youtube" />,
    },
    {
      value: 'facebook',
      label: 'Facebook',
      image: <PlatformLogo platform="facebook" />,
    },
    {
      value: 'trovo',
      label: 'Trovo',
      image: <PlatformLogo platform="trovo" />,
    },
  ];

  function afterLogin() {
    console.log('MERGE COMPLETE');
  }

  function onSkip() {
    confirmAsync({
      title: $t('Log Out?'),
      content: $t(
        'Streamlabs Desktop requires that you have a connected streaming account in order to use all of its features. By skipping this step, you will be logged out and some features may be unavailable.',
      ),
      okText: $t('Log Out'),
    });
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.container}>
        <h1 className={commonStyles.titleContainer}>{$t('Select a Primary Platform')}</h1>
        <p style={{ marginBottom: 80, maxWidth: 400, textAlign: 'center' }}>
          {$t(
            'Your Streamlabs account has multiple connected streaming platforms. Please select the primary platform you will be streaming to using Streamlabs Desktop.',
          )}
        </p>
        <Form layout="inline" style={{ width: 300 }}>
          <ListInput
            style={{ width: '100%' }}
            onChange={setSelectedPlatform}
            allowClear={true}
            value={selectedPlatform}
            hasImage={true}
            options={[
              {
                value: 'twitch',
                label: 'Twitch',
                image: <PlatformLogo platform="twitch" />,
              },
            ]}
          />
        </Form>
      </div>
    </div>
  );

  // return (
  //   <div className={styles.pageContainer}>
  //     <div className={styles.container}>
  //       <h1 className={commonStyles.titleContainer}>{$t('Connect a Streaming Platform')}</h1>
  //       <p style={{ marginBottom: 80 }}>
  //         {$t(
  //           'Streamlabs Desktop requires you to connect a streaming platform to your Streamlabs account',
  //         )}
  //       </p>
  //       <div className={styles.signupButtons}>
  //         {platforms.map((platform: TPlatform) => (
  //           <button
  //             className={cx(`button button--${platform}`, styles.loginButton)}
  //             disabled={loading || authInProgress}
  //             onClick={() => authPlatform(platform, afterLogin, true)}
  //             key={platform}
  //           >
  //             {loading && <i className="fas fa-spinner fa-spin" />}
  //             {!loading && (
  //               <PlatformLogo
  //                 platform={platform}
  //                 size="medium"
  //                 color={platform === 'trovo' ? 'black' : 'white'}
  //               />
  //             )}
  //           </button>
  //         ))}
  //       </div>
  //       <p>
  //         <br />
  //         <span className={styles['link-button']} onClick={onSkip}>
  //           {$t('Skip')}
  //         </span>
  //       </p>
  //     </div>
  //   </div>
  // );
}
