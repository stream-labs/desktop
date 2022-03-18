import { useModule } from 'components-react/hooks/useModule';
import { Services } from 'components-react/service-provider';
import AutoProgressBar from 'components-react/shared/AutoProgressBar';
import { ListInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import KevinSvg from 'components-react/shared/KevinSvg';
import { mutation } from 'components-react/store';
import React from 'react';
import { $t } from 'services/i18n';
import commonStyles from './Common.m.less';
import styles from './ObsImport.m.less';
import { OnboardingModule } from './Onboarding';

export function ObsImport() {
  const { importing, percent } = useModule(ObsImportModule).select();

  return (
    <div style={{ width: '100%' }}>
      <h1 className={commonStyles.titleContainer}>
        {$t('Importing Your Existing Settings From OBS')}
      </h1>
      {!importing && <PreImport />}
      {importing && (
        <div className={styles.progressBar}>
          <AutoProgressBar percent={percent} timeTarget={10 * 1000} />
        </div>
      )}
      <div className={styles.textContainer}>
        <KevinSvg />
        <div>
          {$t(
            'While we import your settings and scenes from OBS Studio, check out these great features unique to Streamlabs',
          )}
        </div>
      </div>
      <FeatureCards />
    </div>
  );
}

function PreImport() {
  const { setProcessing, next } = useModule(OnboardingModule).select();
  const { profiles, selectedProfile, setSelectedProfile, startImport } = useModule(
    ObsImportModule,
  ).select();

  return (
    <div>
      {profiles.length > 1 && (
        <div style={{ width: 400, margin: 'auto' }}>
          <span className={styles.profileSelectTitle}>{$t('Select an OBS profile to import')}</span>
          <Form layout="inline">
            <ListInput
              options={profiles.map(p => ({ label: p, value: p }))}
              value={selectedProfile}
              onChange={setSelectedProfile}
              allowClear={false}
            />
          </Form>
        </div>
      )}
      <button
        className={commonStyles.optionCard}
        style={{ margin: 'auto', marginTop: 24 }}
        onClick={() => {
          setProcessing(true);
          startImport()
            .then(() => {
              setProcessing(false);
              next();
            })
            .catch(() => {
              setProcessing(false);
            });
        }}
      >
        <h2>{$t('Start')}</h2>
      </button>
    </div>
  );
}

function FeatureCards() {
  const recommendedFeatures = ['appStore', 'gameOverlay'];
  const featuresMetadata = {
    appStore: {
      title: $t('App Store'),
      description: $t(
        'Check out 50+ amazing apps from independent developers, ranging from DMCA-compliant music ' +
          'to stunning overlays to more tools to engage with your community. Head over to the app store in the left ' +
          'navigation to browse our selection of free and paid apps.',
      ),
      image: 'app-store',
    },
    gameOverlay: {
      title: $t('In-game Overlay'),
      description: $t(
        'Only have one screen? Perfect! Enable our in-game overlay to make sure you catch every chat message and ' +
          'stream event that happens while you get your game on. You can enable this feature in the ‘Game Overlay’ ' +
          'tab of the settings menu.',
      ),
      image: 'game-overlay',
    },
  };

  return (
    <div className={styles.container}>
      {recommendedFeatures.map(feature => {
        const data = featuresMetadata[feature];
        return (
          <div className={styles.card} key={feature}>
            <div>
              <h3>{data.title}</h3>
              <div>{data.description}</div>
            </div>
            <img src={require(`../../../../media/images/onboarding/${data.image}.png`)} />
          </div>
        );
      })}
    </div>
  );
}

class ObsImportModule {
  state = {
    profiles: [] as string[],
    selectedProfile: '' as string | null,
    importing: false,
    percent: 0,
  };

  init() {
    // Intentionally synchronous
    const profiles = this.ObsImporterService.getProfiles();
    this.setProfiles(profiles);
    this.setSelectedProfile(profiles[0] ?? null);
  }

  get ObsImporterService() {
    return Services.ObsImporterService;
  }

  startImport() {
    if (this.state.importing) return Promise.resolve();
    if (!this.state.selectedProfile) return Promise.resolve();

    this.setImporting(true);

    return this.ObsImporterService.load(this.state.selectedProfile)
      .then(r => {
        this.setImporting(false);
        return r;
      })
      .catch(() => {
        this.setImporting(false);
        // TODO: Error handling
      });
  }

  @mutation()
  setProfiles(profiles: string[]) {
    this.state.profiles = profiles;
  }

  @mutation()
  setSelectedProfile(profile: string) {
    this.state.selectedProfile = profile;
  }

  @mutation()
  setImporting(val: boolean) {
    this.state.importing = val;
  }

  @mutation()
  setPercent(val: number) {
    this.state.percent = val;
  }
}
