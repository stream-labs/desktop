import electron from 'electron';
import { Component } from 'vue-property-decorator';
import Multiselect from 'vue-multiselect';
import TsxComponent, { createProps } from 'components/tsx-component';
import KevinSvg from 'components/shared/KevinSvg';
import SmoothProgressBar from 'components/shared/SmoothProgressBar';
import { Inject } from 'services/core/injector';
import { ObsImporterService } from 'services/obs-importer';
import { ScenesService } from 'services/scenes';
import defer from 'lodash/defer';
import { $t } from 'services/i18n';
import commonStyles from './Common.m.less';
import styles from './ObsImport.m.less';

class ObsImportProps {
  continue: (bool: boolean) => void = () => {};
  setProcessing: (bool: boolean) => void = () => {};
}

@Component({ props: createProps(ObsImportProps) })
export default class ObsImport extends TsxComponent<ObsImportProps> {
  @Inject() obsImporterService: ObsImporterService;
  @Inject() scenesService: ScenesService;

  progress = 0;
  importing = false;
  pathChosen = false;

  sceneCollections = this.obsImporterService.getSceneCollections();
  profiles = this.obsImporterService.getProfiles();
  selectedProfile = this.profiles[0] || null;

  startImport(forceStart?: boolean) {
    if (this.importing) return;
    this.pathChosen = true;
    if (this.profiles.length > 1 && !forceStart) return;

    this.importing = true;
    this.props.setProcessing(true);
    defer(async () => {
      try {
        await this.obsImporterService.load(this.selectedProfile);
        this.importing = false;
        this.progress = 1;
        this.props.setProcessing(false);
        this.props.continue(true);
      } catch (e) {
        this.$toasted.show($t('Something went wrong.'), {
          position: 'bottom-center',
          className: 'toast-alert',
          duration: 3000,
        });
        this.props.setProcessing(false);
        this.importing = false;
      }
    });
  }

  get hasExternalMonitor() {
    return electron.remote.screen
      .getAllDisplays()
      .find(display => display.bounds.x !== 0 || display.bounds.y !== 0);
  }

  get isIrlStreamer() {
    return this.scenesService.views.scenes.find(scene => /irl/i.test(scene.name));
  }

  get recommendedFeatures() {
    const featureList = ['appStore'];

    if (!this.hasExternalMonitor) {
      featureList.push('gameOverlay');
    } else if (this.isIrlStreamer) {
      featureList.push('facemasks');
    } else {
      featureList.push('videoEncoding');
    }

    return featureList;
  }

  get featuresMetadata() {
    return {
      appStore: {
        title: $t('App Store'),
        description: $t(
          'Check out 50+ amazing apps from independent developers, ranging from DMCA-compliant music ' +
            'to stunning overlays to more tools to engage with your community. Head over to the app store in the main ' +
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
      facemasks: {
        title: $t('Face Masks'),
        description: $t(
          'Enjoy interacting with your viewers via IRL streams? Take that interaction to the next level with ' +
            'Streamlabs Facemasks, a tool that lets your viewers add 3-D masks to your face when they donate. ' +
            'Head over to the facemask settings to get started.',
        ),
        image: 'facemasks',
      },
      videoEncoding: {
        title: $t('Optimized Video Encoding'),
        description: $t(
          'Stream at higher quality and lower CPU usage by enabling video encoding optimization. We achieve these ' +
            'improvements because we tune Streamlabs OBS specifically for your game of choice and your bandwidth. ' +
            'To enable, check the box ‘Use optimized encoder settings’ while editing your stream information.',
        ),
        image: 'video-encoding',
      },
    };
  }

  get featureCards() {
    return (
      <div class={styles.container}>
        {this.recommendedFeatures.map(feature => {
          const data = this.featuresMetadata[feature];
          return (
            <div class={styles.card}>
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

  get preImport() {
    if (this.importing) return null;
    return (
      <div>
        {this.profiles.length > 1 && (
          <div>
            <span class={styles.profileSelectTitle}>{$t('Select an OBS profile to import')}</span>
            <Multiselect
              class={styles.profileSelect}
              value={this.selectedProfile}
              onInput={(val: string) => (this.selectedProfile = val)}
              options={this.profiles}
              allowEmpty={false}
              showLabels={false}
            />
          </div>
        )}
        <button
          class={commonStyles.optionCard}
          style="margin: auto; margin-top: 24px;"
          onClick={() => this.startImport(true)}
        >
          <h2>{$t('Start')}</h2>
        </button>
      </div>
    );
  }

  render() {
    return (
      <div style="width: 100%;">
        <h1 class={commonStyles.titleContainer}>
          {$t('Importing Your Existing Settings From OBS')}
        </h1>
        {this.preImport}
        {this.importing && (
          <SmoothProgressBar
            value={this.progress}
            timeLimit={1000 * 10}
            class={styles.progressBar}
          />
        )}
        <div class={styles.textContainer}>
          <KevinSvg />
          <div>
            {$t(
              'It takes up to one minute to import your settings, so you have some time to look at some of our features',
            )}
          </div>
        </div>
        {this.featureCards}
      </div>
    );
  }
}
